param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'

function Get-Headers {
    param([Parameter(Mandatory)] [string]$Path)
    return ((Get-Content -Path $Path -TotalCount 1) -split ',' | ForEach-Object { $_.Trim('"') })
}

function Assert-Headers {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [string[]]$Expected
    )

    $actual = Get-Headers -Path $Path
    if (($actual.Count -ne $Expected.Count) -or (Compare-Object -ReferenceObject $Expected -DifferenceObject $actual)) {
        throw "Header mismatch in $Path. Expected: $($Expected -join ', ') Actual: $($actual -join ', ')"
    }
}

function Assert-NoDuplicates {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key,
        [Parameter(Mandatory)] [string]$Label
    )

    $dupes = $Rows | Group-Object -Property $Key | Where-Object { $_.Count -gt 1 }
    if ($dupes) {
        $keys = $dupes | ForEach-Object { $_.Name }
        throw "Duplicate $Label values found: $($keys -join ', ')"
    }
}

function Assert-ForeignKey {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Column,
        [Parameter(Mandatory)] [string[]]$Allowed,
        [Parameter(Mandatory)] [string]$Label
    )

    $missing = $Rows |
        ForEach-Object { $_.$Column } |
        Where-Object { $_ -and ($_ -notin $Allowed) } |
        Select-Object -Unique
    if ($missing) {
        throw "Invalid $Label references: $($missing -join ', ')"
    }
}

function Assert-ShareSums {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$GroupColumn,
        [Parameter(Mandatory)] [string]$ShareColumn,
        [double]$Target = 1.0,
        [double]$Tolerance = 0.02
    )

    $violations = @()
    foreach ($group in ($Rows | Group-Object -Property $GroupColumn)) {
        $sum = ($group.Group | Measure-Object -Property $ShareColumn -Sum).Sum
        if ([Math]::Abs([double]$sum - $Target) -gt $Tolerance) {
            $violations += ('{0}={1:N3}' -f $group.Name, [double]$sum)
        }
    }

    if ($violations.Count -gt 0) {
        throw "Share sums out of tolerance: $($violations -join '; ')"
    }
}

$normalizedDir = Join-Path $Root 'data\normalized'
$crosswalkDir = Join-Path $Root 'data\crosswalks'
$metadataDir = Join-Path $Root 'data\metadata'

$headerMap = @{
    'occupations.csv' = @('occupation_id','onet_soc_code','title','title_short','role_family','is_active','selection_priority','notes')
    'occupation_aliases.csv' = @('occupation_id','alias','alias_type','source','weight')
    'occupation_selector_index.csv' = @('occupation_id','title','role_family','search_blob','employment_us','median_wage_usd','projection_growth_pct','exposure_prior_score','adaptive_capacity_prior_score','selector_weight','coverage_tier')
    'occupation_tasks.csv' = @('occupation_id','onet_task_id','task_statement','task_type','importance','frequency','source_mix','notes')
    'task_clusters.csv' = @('task_cluster_id','label','label_short','description','default_coupling_class','default_reviewability_class','default_human_advantage_class')
    'occupation_task_clusters.csv' = @('occupation_id','task_cluster_id','share_prior','importance_prior','evidence_confidence','source_mix','notes')
    'task_cluster_membership.csv' = @('occupation_id','onet_task_id','task_cluster_id','membership_weight','mapping_method','mapping_confidence','notes')
    'occupation_exposure_priors.csv' = @('occupation_id','source_id','exposure_score','augmentation_score','automation_score','adaptive_capacity_score','confidence','release_date','notes')
    'task_exposure_evidence.csv' = @('occupation_id','onet_task_id','task_cluster_id','source_id','exposure_score','augmentation_score','automation_score','observed_usage_share','evidence_type','confidence','notes')
    'task_augmentation_automation_priors.csv' = @('occupation_id','task_cluster_id','exposure_score','augmentation_likelihood','partial_automation_likelihood','high_automation_likelihood','evidence_confidence','primary_sources','notes')
    'occupation_adaptation_priors.csv' = @('occupation_id','adaptive_capacity_score','transferability_score','learning_intensity_score','transition_option_count','job_zone','source_mix','confidence','notes')
    'occupation_benchmark_scores.csv' = @('occupation_id','aioe_score','aioe_percentile','lm_aioe_score','lm_aioe_percentile','benchmark_mean_percentile','source_id','confidence','notes')
    'occupation_quality_indicators.csv' = @('occupation_id','earnings_quality_proxy','labor_market_security_proxy','working_environment_quality_proxy','autonomy_proxy','learning_opportunity_proxy','social_interaction_intensity','time_pressure_proxy','quality_confidence','source_mix','notes')
    'occupation_labor_market_context.csv' = @('occupation_id','employment_us','annual_openings','median_wage_usd','wage_p25_usd','wage_p75_usd','projection_growth_pct','unemployment_group_id','unemployment_group_label','unemployment_series_id','latest_unemployment_rate','latest_unemployment_period','labor_market_confidence','release_year')
    'occupation_unemployment_monthly.csv' = @('unemployment_group_id','unemployment_group_label','unemployment_series_id','year','month','period','month_label','unemployment_rate','is_missing','source_id','notes')
    'occupation_transition_adjacency.csv' = @('from_occupation_id','to_occupation_id','adjacency_score','adjacency_type','source','confidence','notes')
    'crosswalk_onet_to_bls.csv' = @('onet_soc_code','bls_occ_code','title_onet','title_bls','match_type','confidence')
    'crosswalk_onet_to_isco.csv' = @('onet_soc_code','isco_code','title_onet','title_isco','match_type','confidence')
    'launch_occupation_seed.csv' = @('launch_rank','provisional_onet_soc_code','title','role_family','priority_band','rationale','data_readiness','status','notes')
    'ui_role_category_map.csv' = @('ui_role_key','ui_role_label','onet_soc_code','title','fit_rank','fit_type','notes')
}

foreach ($entry in $headerMap.GetEnumerator()) {
    $path = if ($entry.Key -like 'crosswalk_*') {
        Join-Path $crosswalkDir $entry.Key
    } elseif ($entry.Key -in @('launch_occupation_seed.csv','ui_role_category_map.csv')) {
        Join-Path $metadataDir $entry.Key
    } else {
        Join-Path $normalizedDir $entry.Key
    }

    if (!(Test-Path $path)) {
        throw "Missing required file: $path"
    }

    Assert-Headers -Path $path -Expected $entry.Value
}

$occupations = Import-Csv (Join-Path $normalizedDir 'occupations.csv')
$taskClusters = Import-Csv (Join-Path $normalizedDir 'task_clusters.csv')
$selector = Import-Csv (Join-Path $normalizedDir 'occupation_selector_index.csv')
$occupationTasks = Import-Csv (Join-Path $normalizedDir 'occupation_tasks.csv')
$occTaskClusters = Import-Csv (Join-Path $normalizedDir 'occupation_task_clusters.csv')
$taskMembership = Import-Csv (Join-Path $normalizedDir 'task_cluster_membership.csv')
$exposurePriors = Import-Csv (Join-Path $normalizedDir 'occupation_exposure_priors.csv')
$taskEvidence = Import-Csv (Join-Path $normalizedDir 'task_exposure_evidence.csv')
$taskPriors = Import-Csv (Join-Path $normalizedDir 'task_augmentation_automation_priors.csv')
$adaptation = Import-Csv (Join-Path $normalizedDir 'occupation_adaptation_priors.csv')
$benchmarks = Import-Csv (Join-Path $normalizedDir 'occupation_benchmark_scores.csv')
$quality = Import-Csv (Join-Path $normalizedDir 'occupation_quality_indicators.csv')
$labor = Import-Csv (Join-Path $normalizedDir 'occupation_labor_market_context.csv')
$transitions = Import-Csv (Join-Path $normalizedDir 'occupation_transition_adjacency.csv')
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
$sourceIds = Select-String -Path (Join-Path $metadataDir 'source_registry.yaml') -Pattern '^\s*- source_id:\s*(.+)$' |
    ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() }

$occupationIds = $occupations | Select-Object -ExpandProperty occupation_id
$taskClusterIds = $taskClusters | Select-Object -ExpandProperty task_cluster_id

Assert-NoDuplicates -Rows $occupations -Key 'occupation_id' -Label 'occupation_id'
Assert-NoDuplicates -Rows $taskClusters -Key 'task_cluster_id' -Label 'task_cluster_id'
Assert-NoDuplicates -Rows $selector -Key 'occupation_id' -Label 'selector occupation_id'
Assert-NoDuplicates -Rows $labor -Key 'occupation_id' -Label 'labor occupation_id'
Assert-NoDuplicates -Rows $launchSeed -Key 'launch_rank' -Label 'launch_rank'

Assert-ForeignKey -Rows $selector -Column 'occupation_id' -Allowed $occupationIds -Label 'selector occupation_id'
Assert-ForeignKey -Rows $occupationTasks -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation tasks occupation_id'
Assert-ForeignKey -Rows $occTaskClusters -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation task cluster occupation_id'
Assert-ForeignKey -Rows $occTaskClusters -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'occupation task cluster task_cluster_id'
Assert-ForeignKey -Rows $taskMembership -Column 'occupation_id' -Allowed $occupationIds -Label 'task membership occupation_id'
Assert-ForeignKey -Rows $taskMembership -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task membership task_cluster_id'
Assert-ForeignKey -Rows $exposurePriors -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation exposure occupation_id'
Assert-ForeignKey -Rows $exposurePriors -Column 'source_id' -Allowed $sourceIds -Label 'occupation exposure source_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'occupation_id' -Allowed $occupationIds -Label 'task evidence occupation_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task evidence task_cluster_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'source_id' -Allowed $sourceIds -Label 'task evidence source_id'
Assert-ForeignKey -Rows $taskPriors -Column 'occupation_id' -Allowed $occupationIds -Label 'task priors occupation_id'
Assert-ForeignKey -Rows $taskPriors -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task priors task_cluster_id'
Assert-ForeignKey -Rows $adaptation -Column 'occupation_id' -Allowed $occupationIds -Label 'adaptation occupation_id'
Assert-ForeignKey -Rows $benchmarks -Column 'occupation_id' -Allowed $occupationIds -Label 'benchmark occupation_id'
Assert-ForeignKey -Rows $benchmarks -Column 'source_id' -Allowed $sourceIds -Label 'benchmark source_id'
Assert-ForeignKey -Rows $quality -Column 'occupation_id' -Allowed $occupationIds -Label 'quality occupation_id'
Assert-ForeignKey -Rows $labor -Column 'occupation_id' -Allowed $occupationIds -Label 'labor occupation_id'
Assert-ForeignKey -Rows $transitions -Column 'from_occupation_id' -Allowed $occupationIds -Label 'transition from_occupation_id'
Assert-ForeignKey -Rows $transitions -Column 'to_occupation_id' -Allowed $occupationIds -Label 'transition to_occupation_id'

Assert-ShareSums -Rows $occTaskClusters -GroupColumn 'occupation_id' -ShareColumn 'share_prior'

$coreCount = ($launchSeed | Where-Object { $_.status -eq 'selected' }).Count
$stretchCount = ($launchSeed | Where-Object { $_.status -eq 'candidate' }).Count

[PSCustomObject]@{
    occupations = $occupations.Count
    occupation_tasks = $occupationTasks.Count
    task_clusters = $taskClusters.Count
    sources = $sourceIds.Count
    selected_launch_occupations = $coreCount
    stretch_launch_occupations = $stretchCount
    validation = 'ok'
} | Format-List
