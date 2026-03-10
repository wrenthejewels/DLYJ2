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

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$taskInventory = Import-Csv (Join-Path $OutputDir 'occupation_task_inventory.csv')
$dependencyEdges = Import-Csv (Join-Path $OutputDir 'task_dependency_edges.csv')
$roleDefaults = Import-Csv (Join-Path $metadataDir 'role_family_function_defaults.csv')
$roleOverrides = Import-Csv (Join-Path $metadataDir 'occupation_role_function_overrides.csv')

$defaultsByRoleFamily = @{}
foreach ($row in $roleDefaults) {
    $defaultsByRoleFamily[$row.role_family] = $row
}

$overridesByOccupation = @{}
foreach ($row in $roleOverrides) {
    $overridesByOccupation[$row.occupation_id] = $row
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
    $functionId = "fn_{0}_primary" -f ($occupation.occupation_id -replace '[^a-zA-Z0-9_]', '_')
    $roleSummary = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'role_summary'
    $functionCategory = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'function_category'
    $functionStatement = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'function_statement'
    $accountabilityStatement = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'accountability_statement'
    $primaryOutput = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'primary_output'
    $primaryStakeholder = Get-StringValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'primary_stakeholder'
    $judgmentRequirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'judgment_requirement'
    $trustRequirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'trust_requirement'
    $regulatoryWeight = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'regulatory_liability_weight'
    $humanAuthorityRequirement = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'human_authority_requirement'
    $bargainingRetention = Get-NumberValue -OverrideRow $overrideRow -DefaultRow $defaultRow -Property 'bargaining_power_retention'
    $sourceMix = if ($overrideRow) {
        'src_role_function_seed_2026_03|src_manual_role_graph_review_2026_03'
    } else {
        'src_role_function_seed_2026_03'
    }
    $sourceConfidence = if ($overrideRow) { 0.88 } else { 0.74 }
    $delegabilityGuardrail = Clamp ((0.28 * $judgmentRequirement) + (0.25 * $trustRequirement) + (0.22 * $regulatoryWeight) + (0.25 * $humanAuthorityRequirement)) 0.05 0.99

    $roleFunctions.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        function_id = $functionId
        function_category = $functionCategory
        role_summary = $roleSummary
        function_statement = $functionStatement
        function_weight = Format-Decimal -Value 1.0 -Digits 4
        source_mix = $sourceMix
        source_confidence = Format-Decimal -Value $sourceConfidence -Digits 4
        notes = if ($overrideRow) { 'occupation_override_promoted' } else { 'role_family_default_promoted' }
    })

    $functionMapRows.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        function_id = $functionId
        function_type = 'primary_function_anchor'
        function_weight = Format-Decimal -Value 1.0 -Digits 4
        delegability_guardrail = Format-Decimal -Value $delegabilityGuardrail -Digits 4
        source_mix = $sourceMix
        source_confidence = Format-Decimal -Value $sourceConfidence -Digits 4
        notes = 'first_pass_primary_function_anchor'
    })

    $functionProfiles.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        function_id = $functionId
        accountability_statement = $accountabilityStatement
        primary_output = $primaryOutput
        primary_stakeholder = $primaryStakeholder
        judgment_requirement = Format-Decimal -Value $judgmentRequirement -Digits 4
        trust_requirement = Format-Decimal -Value $trustRequirement -Digits 4
        regulatory_liability_weight = Format-Decimal -Value $regulatoryWeight -Digits 4
        human_authority_requirement = Format-Decimal -Value $humanAuthorityRequirement -Digits 4
        bargaining_power_retention = Format-Decimal -Value $bargainingRetention -Digits 4
        source_mix = $sourceMix
        source_confidence = Format-Decimal -Value $sourceConfidence -Digits 4
        notes = 'first_pass_accountability_profile'
    })

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
        $taskToFunctionWeight = Clamp ((0.42 * $taskWeight) + (0.18 * $timeShare) + (0.18 * $bargainingWeight) + (0.12 * $degreeNorm) + $typeBoost + $baseBias + $familyBias) 0.02 0.98

        $accountabilityBias = if ($clusterAccountabilityBias.ContainsKey($taskFamilyId)) { $clusterAccountabilityBias[$taskFamilyId] } else { 0.0 }
        $judgmentBias = if ($clusterJudgmentBias.ContainsKey($taskFamilyId)) { $clusterJudgmentBias[$taskFamilyId] } else { 0.0 }
        $trustBias = if ($clusterTrustBias.ContainsKey($taskFamilyId)) { $clusterTrustBias[$taskFamilyId] } else { 0.0 }
        $regBias = if ($clusterRegulatoryBias.ContainsKey($taskFamilyId)) { $clusterRegulatoryBias[$taskFamilyId] } else { 0.0 }
        $authorityBias = if ($clusterAuthorityBias.ContainsKey($taskFamilyId)) { $clusterAuthorityBias[$taskFamilyId] } else { 0.0 }

        $accountabilityWeight = Clamp ((0.35 * $taskToFunctionWeight) + (0.20 * $bargainingWeight) + (0.20 * $humanAuthorityRequirement) + (0.15 * $regulatoryWeight) + (0.10 * $trustRequirement) + $accountabilityBias) 0.02 0.99
        $taskJudgment = Clamp ((0.55 * $judgmentRequirement) + (0.20 * $taskToFunctionWeight) + (0.10 * $degreeNorm) + $judgmentBias) 0.02 0.99
        $taskTrust = Clamp ((0.60 * $trustRequirement) + (0.20 * $bargainingWeight) + $trustBias) 0.02 0.99
        $taskRegulatory = Clamp ((0.75 * $regulatoryWeight) + (0.10 * $taskToFunctionWeight) + $regBias) 0.00 0.99
        $taskAuthority = Clamp ((0.65 * $humanAuthorityRequirement) + (0.15 * $taskToFunctionWeight) + (0.10 * $accountabilityWeight) + $authorityBias) 0.02 0.99
        $edgeType = if ($taskToFunctionWeight -ge 0.72) {
            'delivers'
        } elseif ($task.role_criticality -eq 'core') {
            'directly_supports'
        } else {
            'supports'
        }
        $edgeConfidence = Clamp ((0.55 * [double]$task.source_confidence) + (0.45 * $sourceConfidence)) 0.20 0.98

        $taskFunctionEdges.Add([PSCustomObject]@{
            occupation_id = $occupation.occupation_id
            task_id = $task.task_id
            function_id = $functionId
            edge_type = $edgeType
            task_to_function_weight = Format-Decimal -Value $taskToFunctionWeight -Digits 4
            accountability_weight = Format-Decimal -Value $accountabilityWeight -Digits 4
            judgment_requirement = Format-Decimal -Value $taskJudgment -Digits 4
            trust_requirement = Format-Decimal -Value $taskTrust -Digits 4
            regulatory_liability_weight = Format-Decimal -Value $taskRegulatory -Digits 4
            human_authority_requirement = Format-Decimal -Value $taskAuthority -Digits 4
            source_mix = $sourceMix
            source_confidence = Format-Decimal -Value $edgeConfidence -Digits 4
            notes = 'first_pass_task_function_edge'
        })
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
