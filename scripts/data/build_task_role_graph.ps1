param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

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

function Get-TaskId([string]$OccupationId, [string]$OnetTaskId) {
    return "task_{0}_{1}" -f ($OccupationId -replace '[^a-zA-Z0-9_]', '_'), ($OnetTaskId -replace '[^a-zA-Z0-9_]', '_')
}

$occupationTasks = Import-Csv (Join-Path $OutputDir 'occupation_tasks.csv')
$taskMembership = Import-Csv (Join-Path $OutputDir 'task_cluster_membership.csv')
$taskPriors = Import-Csv (Join-Path $OutputDir 'task_augmentation_automation_priors.csv')
$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')

$occupationIds = $occupations | Select-Object -ExpandProperty occupation_id

$membershipByTask = @{}
foreach ($row in $taskMembership) {
    $key = "$($row.occupation_id)|$($row.onet_task_id)"
    if (-not $membershipByTask.ContainsKey($key)) {
        $membershipByTask[$key] = @()
    }
    $membershipByTask[$key] += $row
}

$priorsByOccCluster = @{}
foreach ($row in $taskPriors) {
    $priorsByOccCluster["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}

$clusterValueBias = @{
    'cluster_oversight_strategy' = 0.30
    'cluster_relationship_management' = 0.22
    'cluster_client_interaction' = 0.18
    'cluster_decision_support' = 0.22
    'cluster_coordination' = 0.16
    'cluster_analysis' = 0.12
    'cluster_research_synthesis' = 0.10
    'cluster_qa_review' = 0.08
    'cluster_drafting' = 0.02
    'cluster_documentation' = -0.03
    'cluster_workflow_admin' = -0.05
    'cluster_execution_routine' = -0.08
}

$clusterBargainingBias = @{
    'cluster_oversight_strategy' = 0.18
    'cluster_relationship_management' = 0.20
    'cluster_client_interaction' = 0.17
    'cluster_decision_support' = 0.15
    'cluster_coordination' = 0.12
    'cluster_analysis' = 0.06
    'cluster_research_synthesis' = 0.07
    'cluster_qa_review' = 0.04
    'cluster_drafting' = -0.02
    'cluster_documentation' = -0.07
    'cluster_workflow_admin' = -0.08
    'cluster_execution_routine' = -0.10
}

$clusterDependencyMatrix = @{
    'cluster_drafting' = @{ 'cluster_qa_review' = 0.18; 'cluster_decision_support' = 0.14; 'cluster_coordination' = 0.10; 'cluster_client_interaction' = 0.08 }
    'cluster_analysis' = @{ 'cluster_qa_review' = 0.16; 'cluster_decision_support' = 0.12; 'cluster_documentation' = 0.06 }
    'cluster_research_synthesis' = @{ 'cluster_analysis' = 0.12; 'cluster_decision_support' = 0.12; 'cluster_qa_review' = 0.10 }
    'cluster_execution_routine' = @{ 'cluster_workflow_admin' = 0.12; 'cluster_qa_review' = 0.08 }
    'cluster_documentation' = @{ 'cluster_qa_review' = 0.08; 'cluster_coordination' = 0.06 }
    'cluster_workflow_admin' = @{ 'cluster_coordination' = 0.12; 'cluster_client_interaction' = 0.08 }
    'cluster_decision_support' = @{ 'cluster_oversight_strategy' = 0.12; 'cluster_client_interaction' = 0.08 }
    'cluster_coordination' = @{ 'cluster_client_interaction' = 0.12; 'cluster_relationship_management' = 0.10; 'cluster_oversight_strategy' = 0.12 }
    'cluster_client_interaction' = @{ 'cluster_relationship_management' = 0.10; 'cluster_decision_support' = 0.08 }
    'cluster_oversight_strategy' = @{ 'cluster_decision_support' = 0.10; 'cluster_coordination' = 0.10 }
}

$dependencyTypeByClusterPair = @{
    'cluster_drafting|cluster_qa_review' = 'feeds'
    'cluster_drafting|cluster_decision_support' = 'feeds'
    'cluster_drafting|cluster_coordination' = 'supports'
    'cluster_drafting|cluster_client_interaction' = 'supports'
    'cluster_analysis|cluster_qa_review' = 'feeds'
    'cluster_analysis|cluster_decision_support' = 'feeds'
    'cluster_analysis|cluster_documentation' = 'feeds'
    'cluster_research_synthesis|cluster_analysis' = 'feeds'
    'cluster_research_synthesis|cluster_decision_support' = 'feeds'
    'cluster_research_synthesis|cluster_qa_review' = 'feeds'
    'cluster_execution_routine|cluster_workflow_admin' = 'feeds'
    'cluster_execution_routine|cluster_qa_review' = 'feeds'
    'cluster_documentation|cluster_qa_review' = 'supports'
    'cluster_documentation|cluster_coordination' = 'supports'
    'cluster_workflow_admin|cluster_coordination' = 'supports'
    'cluster_workflow_admin|cluster_client_interaction' = 'enables'
    'cluster_decision_support|cluster_oversight_strategy' = 'supports'
    'cluster_decision_support|cluster_client_interaction' = 'supports'
    'cluster_coordination|cluster_client_interaction' = 'enables'
    'cluster_coordination|cluster_relationship_management' = 'enables'
    'cluster_coordination|cluster_oversight_strategy' = 'supports'
    'cluster_client_interaction|cluster_relationship_management' = 'enables'
    'cluster_client_interaction|cluster_decision_support' = 'feeds'
    'cluster_oversight_strategy|cluster_decision_support' = 'reviews'
    'cluster_oversight_strategy|cluster_coordination' = 'enables'
}

$weightedTasksByOccupation = @{}
foreach ($task in $occupationTasks) {
    $importance = [double]$task.importance
    $frequency = [double]$task.frequency
    $taskWeight = [Math]::Max(0.05, $importance * [Math]::Max(0.20, $frequency))
    if (-not $weightedTasksByOccupation.ContainsKey($task.occupation_id)) {
        $weightedTasksByOccupation[$task.occupation_id] = 0.0
    }
    $weightedTasksByOccupation[$task.occupation_id] += $taskWeight
}

$inventory = New-Object System.Collections.Generic.List[object]
$tasksByOccCluster = @{}
$taskIdsByOccupation = @{}

foreach ($task in $occupationTasks) {
    $membershipKey = "$($task.occupation_id)|$($task.onet_task_id)"
    $membership = $null
    if ($membershipByTask.ContainsKey($membershipKey)) {
        $membership = $membershipByTask[$membershipKey] |
            Sort-Object @{ Expression = { [double]$_.mapping_confidence }; Descending = $true } |
            Select-Object -First 1
    }

    $taskClusterId = if ($membership) { $membership.task_cluster_id } else { 'cluster_execution_routine' }
    $membershipConfidence = if ($membership) { [double]$membership.mapping_confidence } else { 0.30 }
    $taskId = Get-TaskId -OccupationId $task.occupation_id -OnetTaskId $task.onet_task_id
    $importance = [double]$task.importance
    $frequency = [double]$task.frequency
    $taskWeight = [Math]::Max(0.05, $importance * [Math]::Max(0.20, $frequency))
    $timeShare = $taskWeight / [Math]::Max(0.01, $weightedTasksByOccupation[$task.occupation_id])
    $typeBoost = if ($task.task_type -eq 'Core') { 0.12 } elseif ($task.task_type -eq 'Supplemental') { -0.05 } else { 0.00 }
    $valueBias = if ($clusterValueBias.ContainsKey($taskClusterId)) { $clusterValueBias[$taskClusterId] } else { 0.00 }
    $valueCentrality = Clamp ((0.62 * $importance) + (0.16 * $frequency) + $typeBoost + $valueBias) 0.05 0.98

    $priorKey = "$($task.occupation_id)|$taskClusterId"
    $prior = if ($priorsByOccCluster.ContainsKey($priorKey)) { $priorsByOccCluster[$priorKey] } else { $null }
    $augmentation = if ($prior) { [double]$prior.augmentation_likelihood } else { 0.35 }
    $partialAutomation = if ($prior) { [double]$prior.partial_automation_likelihood } else { 0.25 }
    $highAutomation = if ($prior) { [double]$prior.high_automation_likelihood } else { 0.15 }
    $exposure = if ($prior) { [double]$prior.exposure_score } else { 0.30 }
    $priorConfidence = if ($prior) { [double]$prior.evidence_confidence } else { 0.35 }

    $bargainingBias = if ($clusterBargainingBias.ContainsKey($taskClusterId)) { $clusterBargainingBias[$taskClusterId] } else { 0.00 }
    $bargainingPowerWeight = Clamp ((0.58 * $valueCentrality) + (0.16 * (1 - $highAutomation)) + (0.10 * (1 - $partialAutomation)) + $bargainingBias) 0.03 0.99

    $roleCriticality = if ($valueCentrality -ge 0.70 -or $bargainingPowerWeight -ge 0.72) {
        'core'
    } elseif ($valueCentrality -ge 0.42 -or $task.task_type -eq 'Core') {
        'supporting'
    } else {
        'optional'
    }

    $aiSupportObservability = Clamp ((0.55 * $augmentation) + (0.25 * $exposure) + (0.20 * $partialAutomation)) 0.00 1.00
    $sourceConfidence = Clamp ((0.45 * $membershipConfidence) + (0.35 * $priorConfidence) + (0.20 * $(if ($task.task_type -eq 'Core') { 0.85 } else { 0.65 }))) 0.20 0.98
    $sourceMix = $task.source_mix
    if ([string]::IsNullOrWhiteSpace($sourceMix)) {
        $sourceMix = 'src_v2_role_graph_seed_2026_03'
    } else {
        $sourceMix = "$sourceMix|src_v2_role_graph_seed_2026_03"
    }

    $row = [PSCustomObject]@{
        occupation_id = $task.occupation_id
        task_id = $taskId
        onet_task_id = $task.onet_task_id
        task_statement = $task.task_statement
        task_family_id = $taskClusterId
        task_type = $task.task_type
        time_share_prior = Format-Decimal -Value $timeShare -Digits 4
        value_centrality = Format-Decimal -Value $valueCentrality -Digits 4
        bargaining_power_weight = Format-Decimal -Value $bargainingPowerWeight -Digits 4
        role_criticality = $roleCriticality
        ai_support_observability = Format-Decimal -Value $aiSupportObservability -Digits 4
        source_mix = $sourceMix
        source_confidence = Format-Decimal -Value $sourceConfidence -Digits 4
        notes = 'seeded_from_onet_task_inventory'
    }
    $inventory.Add($row)

    if (-not $tasksByOccCluster.ContainsKey($task.occupation_id)) {
        $tasksByOccCluster[$task.occupation_id] = @{}
    }
    if (-not $tasksByOccCluster[$task.occupation_id].ContainsKey($taskClusterId)) {
        $tasksByOccCluster[$task.occupation_id][$taskClusterId] = New-Object System.Collections.Generic.List[object]
    }
    $tasksByOccCluster[$task.occupation_id][$taskClusterId].Add($row)

    if (-not $taskIdsByOccupation.ContainsKey($task.occupation_id)) {
        $taskIdsByOccupation[$task.occupation_id] = New-Object System.Collections.Generic.List[string]
    }
    $taskIdsByOccupation[$task.occupation_id].Add($taskId)
}

$edges = New-Object System.Collections.Generic.List[object]
$edgeSeen = @{}
foreach ($occupationId in $tasksByOccCluster.Keys) {
    foreach ($sourceClusterId in $clusterDependencyMatrix.Keys) {
        if (-not $tasksByOccCluster[$occupationId].ContainsKey($sourceClusterId)) {
            continue
        }

        $sourceTasks = $tasksByOccCluster[$occupationId][$sourceClusterId] |
            Sort-Object @{ Expression = { [double]$_.time_share_prior }; Descending = $true },
                        @{ Expression = { [double]$_.value_centrality }; Descending = $true } |
            Select-Object -First 2

        foreach ($targetClusterId in $clusterDependencyMatrix[$sourceClusterId].Keys) {
            if (-not $tasksByOccCluster[$occupationId].ContainsKey($targetClusterId)) {
                continue
            }

            $targetTasks = $tasksByOccCluster[$occupationId][$targetClusterId] |
                Sort-Object @{ Expression = { [double]$_.value_centrality }; Descending = $true },
                            @{ Expression = { [double]$_.bargaining_power_weight }; Descending = $true } |
                Select-Object -First 2

            foreach ($sourceTask in $sourceTasks) {
                foreach ($targetTask in $targetTasks) {
                    if ($sourceTask.task_id -eq $targetTask.task_id) {
                        continue
                    }

                    $edgeKey = "$occupationId|$($sourceTask.task_id)|$($targetTask.task_id)"
                    if ($edgeSeen.ContainsKey($edgeKey)) {
                        continue
                    }

                    $dependencyStrength = Clamp (
                        $clusterDependencyMatrix[$sourceClusterId][$targetClusterId] *
                        (0.70 + (0.30 * [double]$targetTask.value_centrality))
                    ) 0.02 0.95
                    $edgeConfidence = Clamp (
                        (0.45 * [double]$sourceTask.source_confidence) +
                        (0.45 * [double]$targetTask.source_confidence) +
                        0.10
                    ) 0.20 0.98
                    $pairKey = "$sourceClusterId|$targetClusterId"
                    $dependencyType = if ($dependencyTypeByClusterPair.ContainsKey($pairKey)) {
                        $dependencyTypeByClusterPair[$pairKey]
                    } else {
                        'supports'
                    }

                    $edges.Add([PSCustomObject]@{
                        occupation_id = $occupationId
                        from_task_id = $sourceTask.task_id
                        to_task_id = $targetTask.task_id
                        dependency_type = $dependencyType
                        dependency_strength = Format-Decimal -Value $dependencyStrength -Digits 4
                        edge_source = 'src_v2_role_graph_seed_2026_03'
                        edge_confidence = Format-Decimal -Value $edgeConfidence -Digits 4
                        notes = 'seeded_from_cluster_dependency_proxy'
                    })
                    $edgeSeen[$edgeKey] = $true
                }
            }
        }
    }
}

$profiles = foreach ($occupationId in $occupationIds) {
    $rows = $inventory | Where-Object { $_.occupation_id -eq $occupationId }
    $rowCount = ($rows | Measure-Object).Count
    $occupationEdges = $edges | Where-Object { $_.occupation_id -eq $occupationId }

    if (-not $rowCount) {
        [PSCustomObject]@{
            occupation_id = $occupationId
            core_task_share = Format-Decimal -Value 0.0 -Digits 4
            support_task_share = Format-Decimal -Value 0.0 -Digits 4
            mean_value_centrality = Format-Decimal -Value 0.0 -Digits 4
            mean_bargaining_power_weight = Format-Decimal -Value 0.0 -Digits 4
            dependency_density = Format-Decimal -Value 0.0 -Digits 4
            coverage_gap_flag = 'true'
            review_status = 'missing_task_inventory'
            notes = 'no_normalized_task_rows_present'
        }
        continue
    }

    $coreShare = ($rows | Where-Object { $_.role_criticality -eq 'core' } | Measure-Object -Property time_share_prior -Sum).Sum
    $supportShare = ($rows | Where-Object { $_.role_criticality -eq 'supporting' } | Measure-Object -Property time_share_prior -Sum).Sum
    $meanValue = 0.0
    $meanBargaining = 0.0
    foreach ($row in $rows) {
        $meanValue += ([double]$row.time_share_prior * [double]$row.value_centrality)
        $meanBargaining += ([double]$row.time_share_prior * [double]$row.bargaining_power_weight)
    }

    $possibleEdges = [Math]::Max(1, $rowCount * [Math]::Max(1, ($rowCount - 1)))
    $dependencyDensity = [Math]::Min(1.0, (($occupationEdges.Count) / $possibleEdges) * 10.0)
    $coverageGap = ($rowCount -lt 16)
    $reviewStatus = if ($coverageGap) { 'needs_task_expansion' } else { 'seeded_role_graph' }

    [PSCustomObject]@{
        occupation_id = $occupationId
        core_task_share = Format-Decimal -Value $coreShare -Digits 4
        support_task_share = Format-Decimal -Value $supportShare -Digits 4
        mean_value_centrality = Format-Decimal -Value $meanValue -Digits 4
        mean_bargaining_power_weight = Format-Decimal -Value $meanBargaining -Digits 4
        dependency_density = Format-Decimal -Value $dependencyDensity -Digits 4
        coverage_gap_flag = if ($coverageGap) { 'true' } else { 'false' }
        review_status = $reviewStatus
        notes = if ($coverageGap) { 'seeded_role_graph_thin_task_coverage' } else { 'seeded_role_graph_ready_for_review' }
    }
}

$inventory | Sort-Object occupation_id, onet_task_id | Export-Csv -Path (Join-Path $OutputDir 'occupation_task_inventory.csv') -NoTypeInformation -Encoding UTF8
$edges | Sort-Object occupation_id, from_task_id, to_task_id | Export-Csv -Path (Join-Path $OutputDir 'task_dependency_edges.csv') -NoTypeInformation -Encoding UTF8
$profiles | Sort-Object occupation_id | Export-Csv -Path (Join-Path $OutputDir 'occupation_task_role_profiles.csv') -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        inventory_rows = $inventory.Count
        dependency_edges = $edges.Count
        profile_rows = $profiles.Count
    }
}
