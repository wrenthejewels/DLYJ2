param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

$metadataDir = Join-Path $Root 'data\metadata'

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Format-Decimal {
    param(
        [double]$Value,
        [int]$Digits = 4
    )

    return $Value.ToString("F$Digits", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-StringValue {
    param(
        [object]$OverrideRow,
        [Parameter(Mandatory)] [object]$DefaultRow,
        [Parameter(Mandatory)] [string]$Property
    )

    if ($OverrideRow -and -not [string]::IsNullOrWhiteSpace([string]$OverrideRow.$Property)) {
        return [string]$OverrideRow.$Property
    }
    return [string]$DefaultRow.$Property
}

function Get-NumberValue {
    param(
        [object]$OverrideRow,
        [Parameter(Mandatory)] [object]$DefaultRow,
        [Parameter(Mandatory)] [string]$Property
    )

    if ($OverrideRow -and -not [string]::IsNullOrWhiteSpace([string]$OverrideRow.$Property)) {
        return [double]$OverrideRow.$Property
    }
    return [double]$DefaultRow.$Property
}

function Get-TaskId([string]$OccupationId, [string]$OnetTaskId) {
    return "task_{0}_{1}" -f ($OccupationId -replace '[^a-zA-Z0-9_]', '_'), ($OnetTaskId -replace '[^a-zA-Z0-9_]', '_')
}

function Parse-ListValue {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return @()
    }

    return ($Value -split '[|;,]' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function New-FunctionId {
    param(
        [string]$OccupationId,
        [string]$Suffix
    )

    return "fn_{0}_{1}" -f ($OccupationId -replace '[^a-zA-Z0-9_]', '_'), ($Suffix -replace '[^a-zA-Z0-9_]', '_')
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$taskInventory = Import-Csv (Join-Path $OutputDir 'occupation_task_inventory.csv')
$dependencyEdges = Import-Csv (Join-Path $OutputDir 'task_dependency_edges.csv')
$roleDefaults = Import-Csv (Join-Path $metadataDir 'role_family_function_defaults.csv')
$roleOverrides = Import-Csv (Join-Path $metadataDir 'occupation_role_function_overrides.csv')
$secondaryFunctionPath = Join-Path $metadataDir 'occupation_secondary_function_overrides.csv'
$secondaryFunctions = if (Test-Path $secondaryFunctionPath) { Import-Csv $secondaryFunctionPath } else { @() }

$defaultsByRoleFamily = @{}
foreach ($row in $roleDefaults) {
    $defaultsByRoleFamily[$row.role_family] = $row
}

$overridesByOccupation = @{}
foreach ($row in $roleOverrides) {
    $overridesByOccupation[$row.occupation_id] = $row
}

$secondaryByOccupation = @{}
foreach ($row in $secondaryFunctions) {
    if (-not $secondaryByOccupation.ContainsKey($row.occupation_id)) {
        $secondaryByOccupation[$row.occupation_id] = New-Object System.Collections.Generic.List[object]
    }
    $secondaryByOccupation[$row.occupation_id].Add($row)
}

$inventoryByOccupation = @{}
foreach ($row in $taskInventory) {
    if (-not $inventoryByOccupation.ContainsKey($row.occupation_id)) {
        $inventoryByOccupation[$row.occupation_id] = New-Object System.Collections.Generic.List[object]
    }
    $inventoryByOccupation[$row.occupation_id].Add($row)
}

$taskDegreeMap = @{}
$degreeMaxByOccupation = @{}
foreach ($edge in $dependencyEdges) {
    foreach ($taskId in @($edge.from_task_id, $edge.to_task_id)) {
        $key = "$($edge.occupation_id)|$taskId"
        if (-not $taskDegreeMap.ContainsKey($key)) {
            $taskDegreeMap[$key] = 0
        }
        $taskDegreeMap[$key] += 1
        if (-not $degreeMaxByOccupation.ContainsKey($edge.occupation_id)) {
            $degreeMaxByOccupation[$edge.occupation_id] = 0
        }
        if ($taskDegreeMap[$key] -gt $degreeMaxByOccupation[$edge.occupation_id]) {
            $degreeMaxByOccupation[$edge.occupation_id] = $taskDegreeMap[$key]
        }
    }
}

$clusterFunctionBias = @{
    'cluster_oversight_strategy' = 0.12
    'cluster_decision_support' = 0.10
    'cluster_client_interaction' = 0.08
    'cluster_relationship_management' = 0.08
    'cluster_coordination' = 0.05
    'cluster_analysis' = 0.04
    'cluster_research_synthesis' = 0.04
    'cluster_qa_review' = 0.03
    'cluster_drafting' = 0.01
    'cluster_documentation' = -0.05
    'cluster_workflow_admin' = -0.07
    'cluster_execution_routine' = -0.09
}

$clusterAccountabilityBias = @{
    'cluster_oversight_strategy' = 0.10
    'cluster_decision_support' = 0.08
    'cluster_client_interaction' = 0.08
    'cluster_relationship_management' = 0.06
    'cluster_coordination' = 0.03
    'cluster_analysis' = 0.02
    'cluster_research_synthesis' = 0.03
    'cluster_qa_review' = 0.07
    'cluster_drafting' = -0.02
    'cluster_documentation' = -0.04
    'cluster_workflow_admin' = -0.04
    'cluster_execution_routine' = -0.06
}

$clusterJudgmentBias = @{
    'cluster_oversight_strategy' = 0.08
    'cluster_decision_support' = 0.08
    'cluster_client_interaction' = 0.05
    'cluster_relationship_management' = 0.04
    'cluster_analysis' = 0.04
    'cluster_research_synthesis' = 0.05
    'cluster_qa_review' = 0.03
    'cluster_workflow_admin' = -0.02
    'cluster_execution_routine' = -0.05
}

$clusterTrustBias = @{
    'cluster_client_interaction' = 0.08
    'cluster_relationship_management' = 0.08
    'cluster_oversight_strategy' = 0.05
    'cluster_decision_support' = 0.04
    'cluster_qa_review' = 0.03
    'cluster_execution_routine' = -0.03
}

$clusterRegulatoryBias = @{
    'cluster_oversight_strategy' = 0.08
    'cluster_qa_review' = 0.08
    'cluster_decision_support' = 0.04
    'cluster_documentation' = 0.03
    'cluster_execution_routine' = -0.02
}

$clusterAuthorityBias = @{
    'cluster_oversight_strategy' = 0.10
    'cluster_decision_support' = 0.06
    'cluster_client_interaction' = 0.05
    'cluster_relationship_management' = 0.05
    'cluster_qa_review' = 0.03
    'cluster_execution_routine' = -0.04
}

$roleFamilyBias = @{
    'admin' = @{ 'cluster_workflow_admin' = 0.08; 'cluster_coordination' = 0.06; 'cluster_documentation' = 0.03 }
    'consulting' = @{ 'cluster_coordination' = 0.08; 'cluster_oversight_strategy' = 0.08; 'cluster_decision_support' = 0.08 }
    'content' = @{ 'cluster_drafting' = 0.10; 'cluster_research_synthesis' = 0.05; 'cluster_qa_review' = 0.05 }
    'creative' = @{ 'cluster_drafting' = 0.10; 'cluster_client_interaction' = 0.04 }
    'data' = @{ 'cluster_analysis' = 0.08; 'cluster_decision_support' = 0.10; 'cluster_qa_review' = 0.06 }
    'finance' = @{ 'cluster_qa_review' = 0.06; 'cluster_decision_support' = 0.07; 'cluster_oversight_strategy' = 0.06 }
    'journalism' = @{ 'cluster_research_synthesis' = 0.08; 'cluster_client_interaction' = 0.05; 'cluster_drafting' = 0.04 }
    'legal' = @{ 'cluster_drafting' = -0.08; 'cluster_research_synthesis' = 0.06; 'cluster_decision_support' = 0.08; 'cluster_client_interaction' = 0.10; 'cluster_oversight_strategy' = 0.10 }
    'operations' = @{ 'cluster_coordination' = 0.08; 'cluster_oversight_strategy' = 0.06; 'cluster_workflow_admin' = 0.02 }
    'product_management' = @{ 'cluster_coordination' = 0.08; 'cluster_oversight_strategy' = 0.08; 'cluster_decision_support' = 0.08 }
    'sales' = @{ 'cluster_relationship_management' = 0.12; 'cluster_client_interaction' = 0.10; 'cluster_coordination' = 0.04; 'cluster_drafting' = -0.06 }
    'software' = @{ 'cluster_analysis' = 0.05; 'cluster_qa_review' = 0.08; 'cluster_coordination' = 0.03; 'cluster_documentation' = -0.02 }
}

$roleFunctions = New-Object System.Collections.Generic.List[object]
$functionMapRows = New-Object System.Collections.Generic.List[object]
$functionProfiles = New-Object System.Collections.Generic.List[object]
$taskFunctionEdges = New-Object System.Collections.Generic.List[object]

foreach ($occupation in $occupations) {
    if (-not $defaultsByRoleFamily.ContainsKey($occupation.role_family)) {
        continue
    }

    $defaultRow = $defaultsByRoleFamily[$occupation.role_family]
    $overrideRow = if ($overridesByOccupation.ContainsKey($occupation.occupation_id)) { $overridesByOccupation[$occupation.occupation_id] } else { $null }
    $functionSpecs = New-Object System.Collections.Generic.List[object]

    $primarySourceMix = if ($overrideRow) {
        'src_role_function_seed_2026_03|src_manual_role_graph_review_2026_03'
    } else {
        'src_role_function_seed_2026_03'
    }
    $primarySourceConfidence = if ($overrideRow) { 0.88 } else { 0.74 }
    $functionSpecs.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        function_id = New-FunctionId -OccupationId $occupation.occupation_id -Suffix 'primary'
        function_type = 'primary_function_anchor'
        role_summary = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'role_summary'
        function_category = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'function_category'
        function_statement = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'function_statement'
        accountability_statement = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'accountability_statement'
        primary_output = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'primary_output'
        primary_stakeholder = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'primary_stakeholder'
        judgment_requirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'judgment_requirement'
        trust_requirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'trust_requirement'
        regulatory_liability_weight = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'regulatory_liability_weight'
        human_authority_requirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'human_authority_requirement'
        bargaining_power_retention = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'bargaining_power_retention'
        raw_function_weight = 1.0
        priority_task_families = @()
        is_primary = $true
        source_mix = $primarySourceMix
        source_confidence = $primarySourceConfidence
        notes = if ($overrideRow) { 'occupation_override_promoted' } else { 'role_family_default_promoted' }
    })

    if ($secondaryByOccupation.ContainsKey($occupation.occupation_id)) {
        foreach ($secondaryRow in $secondaryByOccupation[$occupation.occupation_id]) {
            $functionSpecs.Add([PSCustomObject]@{
                occupation_id = $occupation.occupation_id
                function_id = New-FunctionId -OccupationId $occupation.occupation_id -Suffix $secondaryRow.function_key
                function_type = 'supplemental_function_anchor'
                role_summary = [string]$secondaryRow.role_summary
                function_category = [string]$secondaryRow.function_category
                function_statement = [string]$secondaryRow.function_statement
                accountability_statement = [string]$secondaryRow.accountability_statement
                primary_output = [string]$secondaryRow.primary_output
                primary_stakeholder = [string]$secondaryRow.primary_stakeholder
                judgment_requirement = [double]$secondaryRow.judgment_requirement
                trust_requirement = [double]$secondaryRow.trust_requirement
                regulatory_liability_weight = [double]$secondaryRow.regulatory_liability_weight
                human_authority_requirement = [double]$secondaryRow.human_authority_requirement
                bargaining_power_retention = [double]$secondaryRow.bargaining_power_retention
                raw_function_weight = Clamp ([double]$secondaryRow.function_weight) 0.15 0.70
                priority_task_families = Parse-ListValue -Value $secondaryRow.priority_task_families
                is_primary = $false
                source_mix = "src_role_function_seed_2026_03|src_role_function_expansion_2026_03"
                source_confidence = 0.86
                notes = [string]$secondaryRow.notes
            })
        }
    }

    $weightTotal = ($functionSpecs | Measure-Object -Property raw_function_weight -Sum).Sum
    if (-not $weightTotal -or $weightTotal -le 0) {
        $weightTotal = 1.0
    }

    foreach ($functionSpec in $functionSpecs) {
        $normalizedFunctionWeight = Clamp (([double]$functionSpec.raw_function_weight) / $weightTotal) 0.05 0.95
        $delegabilityGuardrail = Clamp (
            (0.28 * [double]$functionSpec.judgment_requirement) +
            (0.25 * [double]$functionSpec.trust_requirement) +
            (0.22 * [double]$functionSpec.regulatory_liability_weight) +
            (0.25 * [double]$functionSpec.human_authority_requirement)
        ) 0.05 0.99

        $roleFunctions.Add([PSCustomObject]@{
            occupation_id = $occupation.occupation_id
            function_id = $functionSpec.function_id
            function_category = $functionSpec.function_category
            role_summary = $functionSpec.role_summary
            function_statement = $functionSpec.function_statement
            function_weight = Format-Decimal -Value $normalizedFunctionWeight -Digits 4
            source_mix = $functionSpec.source_mix
            source_confidence = Format-Decimal -Value ([double]$functionSpec.source_confidence) -Digits 4
            notes = $functionSpec.notes
        })

        $functionMapRows.Add([PSCustomObject]@{
            occupation_id = $occupation.occupation_id
            function_id = $functionSpec.function_id
            function_type = $functionSpec.function_type
            function_weight = Format-Decimal -Value $normalizedFunctionWeight -Digits 4
            delegability_guardrail = Format-Decimal -Value $delegabilityGuardrail -Digits 4
            source_mix = $functionSpec.source_mix
            source_confidence = Format-Decimal -Value ([double]$functionSpec.source_confidence) -Digits 4
            notes = if ($functionSpec.is_primary) { 'reviewed_primary_function_anchor' } else { 'reviewed_supplemental_function_anchor' }
        })

        $functionProfiles.Add([PSCustomObject]@{
            occupation_id = $occupation.occupation_id
            function_id = $functionSpec.function_id
            accountability_statement = $functionSpec.accountability_statement
            primary_output = $functionSpec.primary_output
            primary_stakeholder = $functionSpec.primary_stakeholder
            judgment_requirement = Format-Decimal -Value ([double]$functionSpec.judgment_requirement) -Digits 4
            trust_requirement = Format-Decimal -Value ([double]$functionSpec.trust_requirement) -Digits 4
            regulatory_liability_weight = Format-Decimal -Value ([double]$functionSpec.regulatory_liability_weight) -Digits 4
            human_authority_requirement = Format-Decimal -Value ([double]$functionSpec.human_authority_requirement) -Digits 4
            bargaining_power_retention = Format-Decimal -Value ([double]$functionSpec.bargaining_power_retention) -Digits 4
            source_mix = $functionSpec.source_mix
            source_confidence = Format-Decimal -Value ([double]$functionSpec.source_confidence) -Digits 4
            notes = if ($functionSpec.is_primary) { 'reviewed_primary_accountability_profile' } else { 'reviewed_supplemental_accountability_profile' }
        })
    }

    $tasks = if ($inventoryByOccupation.ContainsKey($occupation.occupation_id)) { $inventoryByOccupation[$occupation.occupation_id] } else { @() }
    $maxDegree = if ($degreeMaxByOccupation.ContainsKey($occupation.occupation_id)) { [double]$degreeMaxByOccupation[$occupation.occupation_id] } else { 1.0 }
    foreach ($task in $tasks) {
        $degreeKey = "$($occupation.occupation_id)|$($task.task_id)"
        $degreeNorm = if ($taskDegreeMap.ContainsKey($degreeKey)) {
            [double]$taskDegreeMap[$degreeKey] / [Math]::Max(1.0, $maxDegree)
        } else {
            0.0
        }

        $taskFamilyId = $task.task_family_id
        $baseBias = if ($clusterFunctionBias.ContainsKey($taskFamilyId)) { $clusterFunctionBias[$taskFamilyId] } else { 0.0 }
        $familyBias = if ($roleFamilyBias.ContainsKey($occupation.role_family) -and $roleFamilyBias[$occupation.role_family].ContainsKey($taskFamilyId)) {
            $roleFamilyBias[$occupation.role_family][$taskFamilyId]
        } else {
            0.0
        }
        $taskWeight = [double]$task.value_centrality
        $timeShare = [double]$task.time_share_prior
        $bargainingWeight = [double]$task.bargaining_power_weight
        $typeBoost = if ($task.role_criticality -eq 'core') { 0.10 } elseif ($task.role_criticality -eq 'supporting') { 0.04 } else { -0.05 }
        $accountabilityBias = if ($clusterAccountabilityBias.ContainsKey($taskFamilyId)) { $clusterAccountabilityBias[$taskFamilyId] } else { 0.0 }
        $judgmentBias = if ($clusterJudgmentBias.ContainsKey($taskFamilyId)) { $clusterJudgmentBias[$taskFamilyId] } else { 0.0 }
        $trustBias = if ($clusterTrustBias.ContainsKey($taskFamilyId)) { $clusterTrustBias[$taskFamilyId] } else { 0.0 }
        $regBias = if ($clusterRegulatoryBias.ContainsKey($taskFamilyId)) { $clusterRegulatoryBias[$taskFamilyId] } else { 0.0 }
        $authorityBias = if ($clusterAuthorityBias.ContainsKey($taskFamilyId)) { $clusterAuthorityBias[$taskFamilyId] } else { 0.0 }

        $edgeCandidates = New-Object System.Collections.Generic.List[object]
        foreach ($functionSpec in $functionSpecs) {
            $priorityBoost = if ($functionSpec.priority_task_families -contains $taskFamilyId) {
                0.22
            } elseif ($functionSpec.is_primary) {
                0.06
            } else {
                -0.03
            }
            $taskToFunctionScore = Clamp ((0.42 * $taskWeight) + (0.18 * $timeShare) + (0.18 * $bargainingWeight) + (0.12 * $degreeNorm) + $typeBoost + $baseBias + $familyBias + $priorityBoost) 0.02 0.98
            $edgeCandidates.Add([PSCustomObject]@{
                function_id = $functionSpec.function_id
                function_type = $functionSpec.function_type
                raw_score = $taskToFunctionScore
                judgment_requirement = [double]$functionSpec.judgment_requirement
                trust_requirement = [double]$functionSpec.trust_requirement
                regulatory_liability_weight = [double]$functionSpec.regulatory_liability_weight
                human_authority_requirement = [double]$functionSpec.human_authority_requirement
                source_mix = $functionSpec.source_mix
                source_confidence = [double]$functionSpec.source_confidence
            })
        }

        $rankedCandidates = $edgeCandidates | Sort-Object raw_score -Descending
        $topScore = if ($rankedCandidates.Count -gt 0) { [double]$rankedCandidates[0].raw_score } else { 0.0 }
        $selectedCandidates = $rankedCandidates | Where-Object { ([double]$_.raw_score -ge 0.18) -and ([double]$_.raw_score -ge ($topScore * 0.62)) } | Select-Object -First 2
        if (-not $selectedCandidates -or $selectedCandidates.Count -eq 0) {
            $selectedCandidates = $rankedCandidates | Select-Object -First 1
        }
        $selectedWeightTotal = ($selectedCandidates | Measure-Object -Property raw_score -Sum).Sum
        if (-not $selectedWeightTotal -or $selectedWeightTotal -le 0) {
            $selectedWeightTotal = 1.0
        }

        foreach ($candidate in $selectedCandidates) {
            $taskToFunctionWeight = Clamp (([double]$candidate.raw_score / $selectedWeightTotal)) 0.05 0.98
            $accountabilityWeight = Clamp ((0.35 * $taskToFunctionWeight) + (0.20 * $bargainingWeight) + (0.20 * [double]$candidate.human_authority_requirement) + (0.15 * [double]$candidate.regulatory_liability_weight) + (0.10 * [double]$candidate.trust_requirement) + $accountabilityBias) 0.02 0.99
            $taskJudgment = Clamp ((0.55 * [double]$candidate.judgment_requirement) + (0.20 * $taskToFunctionWeight) + (0.10 * $degreeNorm) + $judgmentBias) 0.02 0.99
            $taskTrust = Clamp ((0.60 * [double]$candidate.trust_requirement) + (0.20 * $bargainingWeight) + $trustBias) 0.02 0.99
            $taskRegulatory = Clamp ((0.75 * [double]$candidate.regulatory_liability_weight) + (0.10 * $taskToFunctionWeight) + $regBias) 0.00 0.99
            $taskAuthority = Clamp ((0.65 * [double]$candidate.human_authority_requirement) + (0.15 * $taskToFunctionWeight) + (0.10 * $accountabilityWeight) + $authorityBias) 0.02 0.99
            $edgeType = if ($taskToFunctionWeight -ge 0.72) {
                'delivers'
            } elseif ($task.role_criticality -eq 'core') {
                'directly_supports'
            } else {
                'supports'
            }
            $edgeConfidence = Clamp ((0.55 * [double]$task.source_confidence) + (0.45 * [double]$candidate.source_confidence)) 0.20 0.98

            $taskFunctionEdges.Add([PSCustomObject]@{
                occupation_id = $occupation.occupation_id
                task_id = $task.task_id
                function_id = $candidate.function_id
                edge_type = $edgeType
                task_to_function_weight = Format-Decimal -Value $taskToFunctionWeight -Digits 4
                accountability_weight = Format-Decimal -Value $accountabilityWeight -Digits 4
                judgment_requirement = Format-Decimal -Value $taskJudgment -Digits 4
                trust_requirement = Format-Decimal -Value $taskTrust -Digits 4
                regulatory_liability_weight = Format-Decimal -Value $taskRegulatory -Digits 4
                human_authority_requirement = Format-Decimal -Value $taskAuthority -Digits 4
                source_mix = $candidate.source_mix
                source_confidence = Format-Decimal -Value $edgeConfidence -Digits 4
                notes = if ($candidate.function_type -eq 'primary_function_anchor') { 'reviewed_primary_task_function_edge' } else { 'reviewed_multi_anchor_task_function_edge' }
            })
        }
    }
}

$roleFunctions | Sort-Object occupation_id, function_id | Export-Csv -Path (Join-Path $OutputDir 'role_functions.csv') -NoTypeInformation -Encoding UTF8
$functionMapRows | Sort-Object occupation_id, function_id | Export-Csv -Path (Join-Path $OutputDir 'occupation_function_map.csv') -NoTypeInformation -Encoding UTF8
$taskFunctionEdges | Sort-Object occupation_id, task_id, function_id | Export-Csv -Path (Join-Path $OutputDir 'task_function_edges.csv') -NoTypeInformation -Encoding UTF8
$functionProfiles | Sort-Object occupation_id, function_id | Export-Csv -Path (Join-Path $OutputDir 'function_accountability_profiles.csv') -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        role_functions = $roleFunctions.Count
        task_function_edges = $taskFunctionEdges.Count
        accountability_profiles = $functionProfiles.Count
    }
}
