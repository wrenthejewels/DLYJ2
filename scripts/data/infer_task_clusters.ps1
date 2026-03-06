param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Normalize-Text([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
    return ($Text.ToLowerInvariant() -replace '[^a-z0-9\s]', ' ' -replace '\s+', ' ').Trim()
}

$metadataDir = Join-Path $Root 'data\metadata'
$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$occupationTasks = Import-Csv (Join-Path $OutputDir 'occupation_tasks.csv')
$roleProfiles = Import-Csv (Join-Path $metadataDir 'role_family_cluster_profiles.csv')
$keywords = Import-Csv (Join-Path $metadataDir 'task_cluster_keywords.csv')

$occupationById = @{}
foreach ($row in $occupations) { $occupationById[$row.occupation_id] = $row }

$roleClusterBias = @{}
foreach ($row in $roleProfiles) {
    if (-not $roleClusterBias.ContainsKey($row.role_family)) { $roleClusterBias[$row.role_family] = @{} }
    $roleClusterBias[$row.role_family][$row.task_cluster_id] = [double]$row.share_prior
}

$keywordsByCluster = @{}
foreach ($row in $keywords) {
    if (-not $keywordsByCluster.ContainsKey($row.task_cluster_id)) { $keywordsByCluster[$row.task_cluster_id] = @() }
    $keywordsByCluster[$row.task_cluster_id] += $row
}

$memberships = New-Object System.Collections.Generic.List[object]
$clusterWeights = @{}
foreach ($task in $occupationTasks) {
    $occupation = $occupationById[$task.occupation_id]
    if (-not $occupation) { continue }

    $roleFamily = $occupation.role_family
    $scores = @{}
    foreach ($clusterId in $keywordsByCluster.Keys) {
        $scores[$clusterId] = if ($roleClusterBias[$roleFamily].ContainsKey($clusterId)) { [double]$roleClusterBias[$roleFamily][$clusterId] * 0.35 } else { 0.0 }
        $normalizedTask = Normalize-Text $task.task_statement
        foreach ($keywordRow in $keywordsByCluster[$clusterId]) {
            if ($normalizedTask -like "*$(Normalize-Text $keywordRow.keyword)*") {
                $scores[$clusterId] += [double]$keywordRow.weight
            }
        }
    }

    $best = $scores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
    if (-not $best) { continue }

    $importance = [double]$task.importance
    $frequency = [double]$task.frequency
    $taskWeight = [Math]::Max(0.05, $importance * [Math]::Max(0.20, $frequency))
    $confidence = [Math]::Min(0.85, 0.35 + ($best.Value * 0.12))

    $memberships.Add([PSCustomObject]@{
        occupation_id = $task.occupation_id
        onet_task_id = $task.onet_task_id
        task_cluster_id = $best.Key
        membership_weight = '1.00'
        mapping_method = 'keyword_inference'
        mapping_confidence = ('{0:N2}' -f $confidence)
        notes = 'onet_keyword_inference'
    })

    $clusterKey = "$($task.occupation_id)|$($best.Key)"
    if (-not $clusterWeights.ContainsKey($clusterKey)) {
        $clusterWeights[$clusterKey] = [PSCustomObject]@{
            occupation_id = $task.occupation_id
            task_cluster_id = $best.Key
            total_weight = 0.0
            weighted_importance = 0.0
            weighted_confidence = 0.0
        }
    }
    $aggregate = $clusterWeights[$clusterKey]
    $aggregate.total_weight += $taskWeight
    $aggregate.weighted_importance += ($importance * $taskWeight)
    $aggregate.weighted_confidence += ($confidence * $taskWeight)
}

$totalByOccupation = @{}
foreach ($aggregate in $clusterWeights.Values) {
    if (-not $totalByOccupation.ContainsKey($aggregate.occupation_id)) { $totalByOccupation[$aggregate.occupation_id] = 0.0 }
    $totalByOccupation[$aggregate.occupation_id] += $aggregate.total_weight
}

$occupationTaskClusters = foreach ($aggregate in $clusterWeights.Values) {
    $total = [Math]::Max(0.01, $totalByOccupation[$aggregate.occupation_id])
    [PSCustomObject]@{
        occupation_id = $aggregate.occupation_id
        task_cluster_id = $aggregate.task_cluster_id
        share_prior = ('{0:N4}' -f ($aggregate.total_weight / $total))
        importance_prior = ('{0:N2}' -f ($aggregate.weighted_importance / [Math]::Max(0.01, $aggregate.total_weight)))
        evidence_confidence = ('{0:N2}' -f ($aggregate.weighted_confidence / [Math]::Max(0.01, $aggregate.total_weight)))
        source_mix = 'src_onet_30_1|src_internal_stub_2026_03'
        notes = 'onet_keyword_inference'
    }
}

$memberships | Sort-Object occupation_id, onet_task_id | Export-Csv -Path (Join-Path $OutputDir 'task_cluster_membership.csv') -NoTypeInformation -Encoding UTF8
$occupationTaskClusters | Sort-Object occupation_id, task_cluster_id | Export-Csv -Path (Join-Path $OutputDir 'occupation_task_clusters.csv') -NoTypeInformation -Encoding UTF8

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    tasks_clustered = $memberships.Count
    occupation_cluster_rows = ($occupationTaskClusters | Measure-Object).Count
} | Format-List
