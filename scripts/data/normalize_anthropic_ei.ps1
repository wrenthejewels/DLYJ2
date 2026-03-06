param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir,
    [switch]$IncludeCandidates
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\anthropic_economic_index'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Import-RequiredCsv([string]$Path) {
    if (!(Test-Path $Path)) {
        throw "Missing required Anthropic extract: $Path"
    }
    return Import-Csv $Path
}

function Normalize-Text([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
    return ($Text.ToLowerInvariant() -replace '[^a-z0-9\s]', ' ' -replace '\s+', ' ').Trim()
}

function Infer-ClusterId {
    param(
        [string]$TaskStatement,
        [string]$OccupationId,
        [hashtable]$KeywordRowsByCluster,
        [hashtable]$RoleClusterBias,
        [string]$RoleFamily
    )

    $normalizedTask = Normalize-Text $TaskStatement
    $scores = @{}
    foreach ($clusterId in $KeywordRowsByCluster.Keys) {
        $bias = 0.0
        if ($RoleClusterBias.ContainsKey($RoleFamily) -and $RoleClusterBias[$RoleFamily].ContainsKey($clusterId)) {
            $bias = [double]$RoleClusterBias[$RoleFamily][$clusterId] * 0.35
        }
        $scores[$clusterId] = $bias
        foreach ($keywordRow in $KeywordRowsByCluster[$clusterId]) {
            if ($normalizedTask -like "*$(Normalize-Text $keywordRow.keyword)*") {
                $scores[$clusterId] += [double]$keywordRow.weight
            }
        }
    }
    return ($scores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
}

$metadataDir = Join-Path $Root 'data\metadata'
$normalizedDir = Join-Path $Root 'data\normalized'
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}
$seedCodes = $launchSeed | Select-Object -ExpandProperty provisional_onet_soc_code
$seedBySoc = @{}
foreach ($row in $launchSeed) { $seedBySoc[$row.provisional_onet_soc_code] = $row }

$taskMembership = Import-Csv (Join-Path $normalizedDir 'task_cluster_membership.csv')
$existingEvidence = Import-Csv (Join-Path $normalizedDir 'task_exposure_evidence.csv')
$existingPriors = Import-Csv (Join-Path $normalizedDir 'task_augmentation_automation_priors.csv')
$keywordRows = Import-Csv (Join-Path $metadataDir 'task_cluster_keywords.csv')
$roleProfiles = Import-Csv (Join-Path $metadataDir 'role_family_cluster_profiles.csv')

$membershipByKey = @{}
foreach ($row in $taskMembership) {
    $membershipByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}

$keywordRowsByCluster = @{}
foreach ($row in $keywordRows) {
    if (-not $keywordRowsByCluster.ContainsKey($row.task_cluster_id)) { $keywordRowsByCluster[$row.task_cluster_id] = @() }
    $keywordRowsByCluster[$row.task_cluster_id] += $row
}

$roleClusterBias = @{}
foreach ($row in $roleProfiles) {
    if (-not $roleClusterBias.ContainsKey($row.role_family)) { $roleClusterBias[$row.role_family] = @{} }
    $roleClusterBias[$row.role_family][$row.task_cluster_id] = [double]$row.share_prior
}

$rawRows = Import-RequiredCsv (Join-Path $SourceDir 'automation_vs_augmentation_by_task.csv')
$newEvidence = New-Object System.Collections.Generic.List[object]

if ($rawRows.Count -gt 0 -and $rawRows[0].PSObject.Properties['onet_soc_code']) {
    foreach ($row in $rawRows) {
        if (-not $row.onet_soc_code -or $row.onet_soc_code -notin $seedCodes) {
            continue
        }

        $occupationId = Convert-ToOccupationId $row.onet_soc_code
        $taskId = $row.onet_task_id
        $mapping = $membershipByKey["$occupationId|$taskId"]
        $clusterId = if ($row.task_cluster_id) { $row.task_cluster_id } elseif ($mapping) { $mapping.task_cluster_id } else { $null }
        if (-not $clusterId) {
            continue
        }

        $newEvidence.Add([PSCustomObject]@{
            occupation_id = $occupationId
            onet_task_id = $taskId
            task_cluster_id = $clusterId
            source_id = 'src_anthropic_ei_2025_03_27'
            exposure_score = ('{0:N2}' -f [double]$row.exposure_score)
            augmentation_score = ('{0:N2}' -f [double]$row.augmentation_score)
            automation_score = ('{0:N2}' -f [double]$row.automation_score)
            observed_usage_share = if ($row.observed_usage_share) { ('{0:N2}' -f [double]$row.observed_usage_share) } else { '0.10' }
            evidence_type = 'anthropic_task_usage'
            confidence = if ($row.confidence) { ('{0:N2}' -f [double]$row.confidence) } else { '0.75' }
            notes = 'anthropic_normalized'
        })
    }
} else {
    $taskPctRows = Import-RequiredCsv (Join-Path $SourceDir 'task_pct_v2.csv')
    $onetTaskStatements = Import-RequiredCsv (Join-Path $SourceDir 'onet_task_statements.csv')

    $pctByTaskName = @{}
    foreach ($row in $taskPctRows) {
        $pctByTaskName[(Normalize-Text $row.task_name)] = [double]$row.pct
    }
    $maxPct = ($taskPctRows | Measure-Object -Property pct -Maximum).Maximum
    if (-not $maxPct -or [double]$maxPct -le 0) { $maxPct = 0.01 }

    $statementRowsByTaskName = @{}
    foreach ($row in $onetTaskStatements) {
        if (-not $row.'O*NET-SOC Code' -or $row.'O*NET-SOC Code' -notin $seedCodes) {
            continue
        }
        $taskNameKey = Normalize-Text $row.Task
        if (-not $statementRowsByTaskName.ContainsKey($taskNameKey)) {
            $statementRowsByTaskName[$taskNameKey] = @()
        }
        $statementRowsByTaskName[$taskNameKey] += $row
    }

    foreach ($row in $rawRows) {
        $taskNameKey = Normalize-Text $row.task_name
        if (-not $statementRowsByTaskName.ContainsKey($taskNameKey)) {
            continue
        }

        $augmentation = [double]$row.feedback_loop + [double]$row.task_iteration + [double]$row.validation + [double]$row.learning
        $automation = [double]$row.directive
        $pct = if ($pctByTaskName.ContainsKey($taskNameKey)) { [double]$pctByTaskName[$taskNameKey] } else { 0.0 }
        $exposure = Clamp ([Math]::Sqrt($pct / [double]$maxPct)) 0.05 0.95

        foreach ($statementRow in $statementRowsByTaskName[$taskNameKey]) {
            $soc = $statementRow.'O*NET-SOC Code'
            $occupationId = Convert-ToOccupationId $soc
            $taskId = $statementRow.'Task ID'
            $mapping = $membershipByKey["$occupationId|$taskId"]
            $clusterId = if ($mapping) {
                $mapping.task_cluster_id
            } else {
                Infer-ClusterId -TaskStatement $statementRow.Task -OccupationId $occupationId -KeywordRowsByCluster $keywordRowsByCluster -RoleClusterBias $roleClusterBias -RoleFamily $seedBySoc[$soc].role_family
            }
            if (-not $clusterId) { continue }

            $newEvidence.Add([PSCustomObject]@{
                occupation_id = $occupationId
                onet_task_id = $taskId
                task_cluster_id = $clusterId
                source_id = 'src_anthropic_ei_2025_03_27'
                exposure_score = ('{0:N2}' -f $exposure)
                augmentation_score = ('{0:N2}' -f (Clamp $augmentation 0.00 0.98))
                automation_score = ('{0:N2}' -f (Clamp $automation 0.00 0.98))
                observed_usage_share = ('{0:N4}' -f $pct)
                evidence_type = 'anthropic_task_usage'
                confidence = '0.78'
                notes = 'anthropic_normalized'
            })
        }
    }
}

$evidenceByKey = @{}
foreach ($row in $existingEvidence) {
    $evidenceByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}
foreach ($row in $newEvidence) {
    $evidenceByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}
$mergedEvidence = $evidenceByKey.Values | Sort-Object occupation_id, onet_task_id
$mergedEvidence | Export-Csv -Path (Join-Path $OutputDir 'task_exposure_evidence.csv') -NoTypeInformation -Encoding UTF8

$aggregates = @{}
foreach ($row in $newEvidence) {
    $key = "$($row.occupation_id)|$($row.task_cluster_id)"
    if (-not $aggregates.ContainsKey($key)) {
        $aggregates[$key] = [PSCustomObject]@{
            occupation_id = $row.occupation_id
            task_cluster_id = $row.task_cluster_id
            weighted_exposure = 0.0
            weighted_augmentation = 0.0
            weighted_automation = 0.0
            weighted_confidence = 0.0
            total_weight = 0.0
        }
    }

    $usageWeight = [double]$row.observed_usage_share
    if ($usageWeight -le 0) { $usageWeight = 0.01 }
    $aggregate = $aggregates[$key]
    $aggregate.weighted_exposure += ([double]$row.exposure_score * $usageWeight)
    $aggregate.weighted_augmentation += ([double]$row.augmentation_score * $usageWeight)
    $aggregate.weighted_automation += ([double]$row.automation_score * $usageWeight)
    $aggregate.weighted_confidence += ([double]$row.confidence * $usageWeight)
    $aggregate.total_weight += $usageWeight
}

$newPriors = New-Object System.Collections.Generic.List[object]
foreach ($aggregate in $aggregates.Values) {
    $weight = [Math]::Max($aggregate.total_weight, 0.01)
    $partialAuto = $aggregate.weighted_automation / $weight
    $newPriors.Add([PSCustomObject]@{
        occupation_id = $aggregate.occupation_id
        task_cluster_id = $aggregate.task_cluster_id
        exposure_score = ('{0:N2}' -f ($aggregate.weighted_exposure / $weight))
        augmentation_likelihood = ('{0:N2}' -f ($aggregate.weighted_augmentation / $weight))
        partial_automation_likelihood = ('{0:N2}' -f $partialAuto)
        high_automation_likelihood = ('{0:N2}' -f (Clamp ($partialAuto - 0.08) 0.02 0.90))
        evidence_confidence = ('{0:N2}' -f ($aggregate.weighted_confidence / $weight))
        primary_sources = 'src_anthropic_ei_2025_03_27|src_onet_30_1'
        notes = 'anthropic_normalized'
    })
}

$priorByKey = @{}
foreach ($row in $existingPriors) {
    $priorByKey["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}
foreach ($row in $newPriors) {
    $priorByKey["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}
$mergedPriors = $priorByKey.Values | Sort-Object occupation_id, task_cluster_id
$mergedPriors | Export-Csv -Path (Join-Path $OutputDir 'task_augmentation_automation_priors.csv') -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    anthropic_task_rows = $newEvidence.Count
    merged_task_evidence_rows = $mergedEvidence.Count
    merged_task_prior_rows = $mergedPriors.Count
    source_dir = $SourceDir
} | Format-List
