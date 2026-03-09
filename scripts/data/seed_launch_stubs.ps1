param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [switch]$IncludeCandidates,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Get-RowMap {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key
    )

    $map = @{}
    foreach ($row in $Rows) {
        $map[$row.$Key] = $row
    }
    return $map
}

function New-Csv {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [object[]]$Rows
    )

    $Rows | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

$normalizedDir = Join-Path $Root 'data\normalized'
$metadataDir = Join-Path $Root 'data\metadata'

$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv') | Sort-Object { [int]$_.launch_rank }
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}

$roleDefaults = Import-Csv (Join-Path $metadataDir 'role_family_stub_profiles.csv')
$clusterProfiles = Import-Csv (Join-Path $metadataDir 'role_family_cluster_profiles.csv')
$overrides = Import-Csv (Join-Path $metadataDir 'occupation_stub_overrides.csv')
$taskClusters = Import-Csv (Join-Path $normalizedDir 'task_clusters.csv')

$roleDefaultsByFamily = Get-RowMap -Rows $roleDefaults -Key 'role_family'
$overridesBySoc = Get-RowMap -Rows $overrides -Key 'provisional_onet_soc_code'
$taskClusterIds = $taskClusters | Select-Object -ExpandProperty task_cluster_id

$clusterExposureMod = @{
    cluster_drafting = 0.10
    cluster_analysis = 0.08
    cluster_research_synthesis = 0.06
    cluster_coordination = -0.08
    cluster_client_interaction = -0.12
    cluster_qa_review = -0.02
    cluster_decision_support = -0.06
    cluster_execution_routine = 0.12
    cluster_oversight_strategy = -0.14
    cluster_relationship_management = -0.18
    cluster_documentation = 0.04
    cluster_workflow_admin = 0.08
}

$clusterAugmentationMod = @{
    cluster_drafting = -0.02
    cluster_analysis = 0.04
    cluster_research_synthesis = 0.02
    cluster_coordination = 0.10
    cluster_client_interaction = 0.08
    cluster_qa_review = 0.10
    cluster_decision_support = 0.12
    cluster_execution_routine = -0.10
    cluster_oversight_strategy = 0.08
    cluster_relationship_management = 0.06
    cluster_documentation = -0.02
    cluster_workflow_admin = -0.04
}

$clusterAutomationMod = @{
    cluster_drafting = 0.12
    cluster_analysis = 0.05
    cluster_research_synthesis = 0.04
    cluster_coordination = -0.12
    cluster_client_interaction = -0.16
    cluster_qa_review = 0.01
    cluster_decision_support = -0.10
    cluster_execution_routine = 0.16
    cluster_oversight_strategy = -0.18
    cluster_relationship_management = -0.20
    cluster_documentation = 0.08
    cluster_workflow_admin = 0.12
}

$readinessAdjust = @{ high = 0.10; medium = 0.05; low = 0.00 }
$bandAdjust = @{ core = 0.05; stretch = 0.00 }
$count = [Math]::Max(1, $launchSeed.Count - 1)

$occupations = New-Object System.Collections.Generic.List[object]
$aliases = New-Object System.Collections.Generic.List[object]
$occupationTasks = New-Object System.Collections.Generic.List[object]
$occClusters = New-Object System.Collections.Generic.List[object]
$exposurePriors = New-Object System.Collections.Generic.List[object]
$taskPriors = New-Object System.Collections.Generic.List[object]
$taskMembership = New-Object System.Collections.Generic.List[object]
$taskEvidence = New-Object System.Collections.Generic.List[object]
$adaptation = New-Object System.Collections.Generic.List[object]
$quality = New-Object System.Collections.Generic.List[object]
$labor = New-Object System.Collections.Generic.List[object]
$transitions = New-Object System.Collections.Generic.List[object]

$selectedByFamily = @{}
foreach ($row in $launchSeed) {
    if (-not $selectedByFamily.ContainsKey($row.role_family)) {
        $selectedByFamily[$row.role_family] = New-Object System.Collections.Generic.List[object]
    }
    $selectedByFamily[$row.role_family].Add($row)
}

$transitionTargets = @{
    admin = @('operations','admin')
    software = @('software','data')
    data = @('data','software')
    operations = @('operations','consulting')
    consulting = @('consulting','operations')
    marketing = @('marketing','communications')
    finance = @('finance','consulting')
    legal = @('legal','consulting')
    creative = @('creative','content')
    content = @('content','communications')
    communications = @('communications','marketing')
    journalism = @('journalism','communications')
    hr = @('hr','consulting')
    sales = @('sales','marketing')
    engineering = @('engineering','operations')
    product_management = @('product_management','consulting')
}

foreach ($seed in $launchSeed) {
    if (-not $roleDefaultsByFamily.ContainsKey($seed.role_family)) {
        throw "Missing role family defaults for $($seed.role_family)"
    }

    $defaults = $roleDefaultsByFamily[$seed.role_family]
    $override = $overridesBySoc[$seed.provisional_onet_soc_code]
    $occupationId = Convert-ToOccupationId $seed.provisional_onet_soc_code
    $rank = [int]$seed.launch_rank
    $rankNorm = ($launchSeed.Count - $rank) / [double]$count
    $selectionPriorityRaw = 0.55 + (0.25 * $rankNorm) + $readinessAdjust[$seed.data_readiness] + $bandAdjust[$seed.priority_band]
    $selectionPriority = Clamp $selectionPriorityRaw 0.55 0.95
    $titleShort = if ($override.title_short) { $override.title_short } else { $seed.title }
    $employment = if ($override.employment_us_stub) { [int]$override.employment_us_stub } else { 100000 }
    $wage = if ($override.median_wage_usd_stub) { [int]$override.median_wage_usd_stub } else { 75000 }
    $growth = if ($override.projection_growth_pct_stub) { [double]$override.projection_growth_pct_stub } else { 6.0 }
    $openings = [Math]::Max(1200, [Math]::Round($employment * 0.07))

    $occupations.Add([PSCustomObject]@{
        occupation_id = $occupationId
        onet_soc_code = $seed.provisional_onet_soc_code
        title = $seed.title
        title_short = $titleShort
        role_family = $seed.role_family
        is_active = 1
        selection_priority = ('{0:N2}' -f $selectionPriority)
        notes = 'launch_stub_generated'
    })

    foreach ($alias in @($override.alias_primary, $override.alias_secondary)) {
        if ($alias) {
            $aliases.Add([PSCustomObject]@{
                occupation_id = $occupationId
                alias = $alias
                alias_type = 'manual_seed'
                source = 'launch_stub'
                weight = '0.85'
            })
        }
    }

    $aliases.Add([PSCustomObject]@{
        occupation_id = $occupationId
        alias = $titleShort.ToLowerInvariant()
        alias_type = 'short_title'
        source = 'launch_stub'
        weight = '0.95'
    })

    $clustersForFamily = $clusterProfiles | Where-Object { $_.role_family -eq $seed.role_family }
    foreach ($cluster in $clustersForFamily) {
        $clusterId = $cluster.task_cluster_id
        $clusterLabel = ($clusterId -replace '^cluster_', '') -replace '_', ' '
        $share = [double]$cluster.share_prior
        $importance = [double]$cluster.importance_prior
        $confidence = [double]$cluster.evidence_confidence
        $clusterKey = $clusterId
        $taskId = ('stub_{0}_{1}' -f (($seed.provisional_onet_soc_code -replace '[-\.]', '_').ToLowerInvariant()), ($clusterId -replace '^cluster_', ''))

        $occClusters.Add([PSCustomObject]@{
            occupation_id = $occupationId
            task_cluster_id = $clusterId
            share_prior = ('{0:N2}' -f $share)
            importance_prior = ('{0:N2}' -f $importance)
            evidence_confidence = ('{0:N2}' -f $confidence)
            source_mix = $cluster.source_mix
            notes = 'launch_stub_generated'
        })

        $clusterExposure = Clamp ([double]$defaults.exposure_score + $clusterExposureMod[$clusterKey]) 0.12 0.95
        $clusterAug = Clamp ([double]$defaults.augmentation_score + $clusterAugmentationMod[$clusterKey]) 0.08 0.95
        $clusterPartialAuto = Clamp ([double]$defaults.automation_score + $clusterAutomationMod[$clusterKey]) 0.04 0.95
        $clusterHighAuto = Clamp ($clusterPartialAuto - 0.12) 0.02 0.90
        $observedUsage = Clamp ($share + 0.08) 0.05 0.60

        $taskPriors.Add([PSCustomObject]@{
            occupation_id = $occupationId
            task_cluster_id = $clusterId
            exposure_score = ('{0:N2}' -f $clusterExposure)
            augmentation_likelihood = ('{0:N2}' -f $clusterAug)
            partial_automation_likelihood = ('{0:N2}' -f $clusterPartialAuto)
            high_automation_likelihood = ('{0:N2}' -f $clusterHighAuto)
            evidence_confidence = ('{0:N2}' -f $confidence)
            primary_sources = 'src_onet_30_1|src_internal_stub_2026_03'
            notes = 'launch_stub_generated'
        })

        $taskMembership.Add([PSCustomObject]@{
            occupation_id = $occupationId
            onet_task_id = $taskId
            task_cluster_id = $clusterId
            membership_weight = '1.00'
            mapping_method = 'generated_cluster_proxy'
            mapping_confidence = ('{0:N2}' -f (Clamp ($confidence - 0.10) 0.35 0.80))
            notes = 'launch_stub_generated'
        })

        $occupationTasks.Add([PSCustomObject]@{
            occupation_id = $occupationId
            onet_task_id = $taskId
            task_statement = ('Representative {0} task for {1}' -f $clusterLabel, $titleShort.ToLowerInvariant())
            task_type = 'generated_proxy'
            importance = ('{0:N2}' -f $importance)
            frequency = ('{0:N2}' -f (Clamp ($share + 0.40) 0.20 0.95))
            source_mix = 'src_internal_stub_2026_03'
            notes = 'launch_stub_generated'
        })

        $taskEvidence.Add([PSCustomObject]@{
            occupation_id = $occupationId
            onet_task_id = $taskId
            task_cluster_id = $clusterId
            source_id = 'src_internal_stub_2026_03'
            exposure_score = ('{0:N2}' -f $clusterExposure)
            augmentation_score = ('{0:N2}' -f $clusterAug)
            automation_score = ('{0:N2}' -f $clusterPartialAuto)
            observed_usage_share = ('{0:N2}' -f $observedUsage)
            evidence_type = 'generated_task_proxy'
            confidence = ('{0:N2}' -f (Clamp ($confidence - 0.08) 0.30 0.78))
            notes = 'launch_stub_generated'
        })
    }

    $exposurePriors.Add([PSCustomObject]@{
        occupation_id = $occupationId
        source_id = 'src_internal_stub_2026_03'
        exposure_score = ('{0:N2}' -f [double]$defaults.exposure_score)
        augmentation_score = ('{0:N2}' -f [double]$defaults.augmentation_score)
        automation_score = ('{0:N2}' -f [double]$defaults.automation_score)
        adaptive_capacity_score = ('{0:N2}' -f [double]$defaults.adaptive_capacity_score)
        confidence = '0.45'
        release_date = '2026-01-01'
        notes = 'launch_stub_generated|occupation_prior_stub'
    })

    $adaptation.Add([PSCustomObject]@{
        occupation_id = $occupationId
        adaptive_capacity_score = ('{0:N2}' -f [double]$defaults.adaptive_capacity_score)
        transferability_score = ('{0:N2}' -f [double]$defaults.transferability_score)
        learning_intensity_score = ('{0:N2}' -f [double]$defaults.learning_intensity_score)
        transition_option_count = [Math]::Max(6, [Math]::Round((([double]$defaults.transferability_score + [double]$defaults.adaptive_capacity_score) * 12)))
        job_zone = [int]$defaults.job_zone
        source_mix = 'src_onet_30_1|src_internal_stub_2026_03'
        confidence = '0.46'
        notes = 'launch_stub_generated'
    })

    $quality.Add([PSCustomObject]@{
        occupation_id = $occupationId
        earnings_quality_proxy = ('{0:N2}' -f [double]$defaults.earnings_quality_proxy)
        labor_market_security_proxy = ('{0:N2}' -f [double]$defaults.labor_market_security_proxy)
        working_environment_quality_proxy = ('{0:N2}' -f [double]$defaults.working_environment_quality_proxy)
        autonomy_proxy = ('{0:N2}' -f [double]$defaults.autonomy_proxy)
        learning_opportunity_proxy = ('{0:N2}' -f [double]$defaults.learning_opportunity_proxy)
        social_interaction_intensity = ('{0:N2}' -f [double]$defaults.social_interaction_intensity)
        time_pressure_proxy = ('{0:N2}' -f [double]$defaults.time_pressure_proxy)
        quality_confidence = '0.42'
        source_mix = 'src_oecd_job_quality_2014|src_onet_30_1|src_internal_stub_2026_03'
        notes = 'launch_stub_generated'
    })

    $labor.Add([PSCustomObject]@{
        occupation_id = $occupationId
        employment_us = $employment
        annual_openings = $openings
        median_wage_usd = $wage
        wage_p25_usd = [Math]::Round($wage * 0.72)
        wage_p75_usd = [Math]::Round($wage * 1.28)
        projection_growth_pct = ('{0:N0}' -f $growth)
        unemployment_group_id = $null
        unemployment_group_label = $null
        unemployment_series_id = $null
        latest_unemployment_rate = $null
        latest_unemployment_period = $null
        labor_market_confidence = ('{0:N2}' -f [double]$defaults.labor_market_confidence)
        release_year = 2024
    })
}

foreach ($seed in $launchSeed) {
    $targetFamilies = $transitionTargets[$seed.role_family]
    if (-not $targetFamilies) {
        continue
    }

    $target = $null
    foreach ($family in $targetFamilies) {
        $candidates = $launchSeed |
            Where-Object { $_.role_family -eq $family -and $_.provisional_onet_soc_code -ne $seed.provisional_onet_soc_code } |
            Sort-Object { [int]$_.launch_rank }
        if ($candidates) {
            $target = $candidates | Select-Object -First 1
            break
        }
    }

    if ($target) {
        $sameFamily = $target.role_family -eq $seed.role_family
        $transitions.Add([PSCustomObject]@{
            from_occupation_id = Convert-ToOccupationId $seed.provisional_onet_soc_code
            to_occupation_id = Convert-ToOccupationId $target.provisional_onet_soc_code
            adjacency_score = if ($sameFamily) { '0.55' } else { '0.45' }
            adjacency_type = if ($sameFamily) { 'family_adjacent' } else { 'cross_family_adjacent' }
            source = 'generated_stub'
            confidence = if ($sameFamily) { '0.42' } else { '0.34' }
            notes = 'launch_stub_generated'
        })
    }
}

New-Csv -Path (Join-Path $normalizedDir 'occupations.csv') -Rows $occupations
New-Csv -Path (Join-Path $normalizedDir 'occupation_aliases.csv') -Rows ($aliases | Sort-Object occupation_id, alias)
New-Csv -Path (Join-Path $normalizedDir 'occupation_tasks.csv') -Rows ($occupationTasks | Sort-Object occupation_id, onet_task_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_task_clusters.csv') -Rows ($occClusters | Sort-Object occupation_id, task_cluster_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_exposure_priors.csv') -Rows ($exposurePriors | Sort-Object occupation_id)
New-Csv -Path (Join-Path $normalizedDir 'task_augmentation_automation_priors.csv') -Rows ($taskPriors | Sort-Object occupation_id, task_cluster_id)
New-Csv -Path (Join-Path $normalizedDir 'task_cluster_membership.csv') -Rows ($taskMembership | Sort-Object occupation_id, onet_task_id)
New-Csv -Path (Join-Path $normalizedDir 'task_exposure_evidence.csv') -Rows ($taskEvidence | Sort-Object occupation_id, onet_task_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_adaptation_priors.csv') -Rows ($adaptation | Sort-Object occupation_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_quality_indicators.csv') -Rows ($quality | Sort-Object occupation_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_labor_market_context.csv') -Rows ($labor | Sort-Object occupation_id)
New-Csv -Path (Join-Path $normalizedDir 'occupation_transition_adjacency.csv') -Rows ($transitions | Sort-Object from_occupation_id)

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    occupations_seeded = $occupations.Count
    aliases_seeded = $aliases.Count
    occupation_tasks_seeded = $occupationTasks.Count
    task_cluster_rows = $occClusters.Count
    synthetic_task_rows = $taskEvidence.Count
    transitions_seeded = $transitions.Count
} | Format-List
