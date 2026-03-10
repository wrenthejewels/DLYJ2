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

function Get-ConfidenceBand([double]$Value) {
    if ($Value -ge 0.72) { return 'high' }
    if ($Value -ge 0.50) { return 'medium' }
    return 'low'
}

function Get-TransformationLabel([string]$Type) {
    switch ($Type) {
        'limited_near_term_change' { return 'limited near-term change' }
        'augmented_core_role' { return 'augmented core role' }
        'workflow_recomposition' { return 'workflow recomposition' }
        'workflow_fragmentation' { return 'workflow fragmentation' }
        'delegated_but_retained_function' { return 'delegated but retained function' }
        'substitution_pressure' { return 'substitution pressure' }
        default { return ($Type -replace '_', ' ') }
    }
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$roleTransformation = Import-Csv (Join-Path $OutputDir 'occupation_role_transformation.csv')
$taskSourceEvidence = Import-Csv (Join-Path $OutputDir 'task_source_evidence.csv')
$occupationFunctionMap = Import-Csv (Join-Path $OutputDir 'occupation_function_map.csv')
$roleFunctions = Import-Csv (Join-Path $OutputDir 'role_functions.csv')

$occupationById = @{}
foreach ($row in $occupations) {
    $occupationById[$row.occupation_id] = $row
}

$taskEvidenceByOccupation = @{}
foreach ($row in $taskSourceEvidence) {
    if (-not $taskEvidenceByOccupation.ContainsKey($row.occupation_id)) {
        $taskEvidenceByOccupation[$row.occupation_id] = New-Object System.Collections.Generic.List[object]
    }
    $taskEvidenceByOccupation[$row.occupation_id].Add($row)
}

$functionMapByOccupation = @{}
foreach ($row in $occupationFunctionMap) {
    if (-not $functionMapByOccupation.ContainsKey($row.occupation_id)) {
        $functionMapByOccupation[$row.occupation_id] = New-Object System.Collections.Generic.List[object]
    }
    $functionMapByOccupation[$row.occupation_id].Add($row)
}

$roleFunctionsByOccupation = @{}
foreach ($row in $roleFunctions) {
    if (-not $roleFunctionsByOccupation.ContainsKey($row.occupation_id)) {
        $roleFunctionsByOccupation[$row.occupation_id] = New-Object System.Collections.Generic.List[object]
    }
    $roleFunctionsByOccupation[$row.occupation_id].Add($row)
}

$driverLabels = @{
    direct_task_pressure = 'direct task pressure'
    function_exposure_pressure = 'core-function pressure'
    indirect_dependency_pressure = 'dependency spillover'
    role_fragmentation_risk = 'workflow fragmentation'
    role_compressibility = 'workflow compressibility'
    headcount_displacement_risk = 'headcount displacement risk'
    delegation_likelihood = 'delegation pressure'
    demand_expansion_signal = 'demand expansion'
}

$counterweightLabels = @{
    retained_function_strength = 'retained function'
    retained_accountability_strength = 'human accountability'
    retained_bargaining_power = 'bargaining leverage'
    demand_expansion_signal = 'demand expansion'
}

$csvRows = New-Object System.Collections.Generic.List[object]
$markdownLines = New-Object System.Collections.Generic.List[string]
$markdownLines.Add('# Occupation Role Explanations')
$markdownLines.Add('')
$markdownLines.Add('This file summarizes, in plain English, what is currently driving each occupation-level role-transformation output.')
$markdownLines.Add('')

foreach ($row in ($roleTransformation | Sort-Object occupation_id)) {
    $occupation = $occupationById[$row.occupation_id]
    if (-not $occupation) {
        continue
    }

    $metricValues = @{
        direct_task_pressure = [double]$row.direct_task_pressure
        function_exposure_pressure = [double]$row.function_exposure_pressure
        indirect_dependency_pressure = [double]$row.indirect_dependency_pressure
        role_fragmentation_risk = [double]$row.role_fragmentation_risk
        role_compressibility = [double]$row.role_compressibility
        headcount_displacement_risk = [double]$row.headcount_displacement_risk
        delegation_likelihood = [double]$row.delegation_likelihood
        demand_expansion_signal = [double]$row.demand_expansion_signal
        retained_function_strength = [double]$row.retained_function_strength
        retained_accountability_strength = [double]$row.retained_accountability_strength
        retained_bargaining_power = [double]$row.retained_bargaining_power
    }

    $driverKeys = switch ($row.role_transformation_type) {
        'augmented_core_role' { @('demand_expansion_signal','delegation_likelihood','direct_task_pressure','function_exposure_pressure') }
        'delegated_but_retained_function' { @('delegation_likelihood','function_exposure_pressure','direct_task_pressure','indirect_dependency_pressure') }
        'workflow_fragmentation' { @('role_fragmentation_risk','indirect_dependency_pressure','function_exposure_pressure','direct_task_pressure') }
        'substitution_pressure' { @('headcount_displacement_risk','role_compressibility','direct_task_pressure','function_exposure_pressure') }
        'limited_near_term_change' { @('direct_task_pressure','function_exposure_pressure','role_compressibility','headcount_displacement_risk') }
        default { @('role_compressibility','function_exposure_pressure','direct_task_pressure','headcount_displacement_risk') }
    }
    $driverMetrics = $driverKeys | ForEach-Object { @{ key = $_; value = $metricValues[$_] } }

    $counterweightKeys = switch ($row.role_transformation_type) {
        'augmented_core_role' { @('retained_function_strength','retained_accountability_strength','demand_expansion_signal','retained_bargaining_power') }
        'delegated_but_retained_function' { @('retained_accountability_strength','retained_function_strength','retained_bargaining_power','demand_expansion_signal') }
        'limited_near_term_change' { @('retained_function_strength','retained_accountability_strength','retained_bargaining_power','demand_expansion_signal') }
        default { @('retained_bargaining_power','retained_function_strength','retained_accountability_strength','demand_expansion_signal') }
    }
    $counterweightMetrics = $counterweightKeys | ForEach-Object { @{ key = $_; value = $metricValues[$_] } }

    $topDrivers = $driverMetrics | Sort-Object value -Descending | Select-Object -First 2
    $topCounterweight = $counterweightMetrics | Sort-Object value -Descending | Select-Object -First 1

    $functionRows = if ($roleFunctionsByOccupation.ContainsKey($row.occupation_id)) { $roleFunctionsByOccupation[$row.occupation_id] } else { @() }
    $topFunctions = $functionRows | Sort-Object {[double]$_.function_weight} -Descending | Select-Object -First 2
    $functionSummary = ($topFunctions | ForEach-Object {
        '{0} ({1:P0})' -f $_.function_category, ([double]$_.function_weight)
    }) -join '; '

    $evidenceRows = if ($taskEvidenceByOccupation.ContainsKey($row.occupation_id)) { $taskEvidenceByOccupation[$row.occupation_id] } else { @() }
    $evidenceWeightTotal = 0.0
    $directWeight = 0.0
    $reviewedWeight = 0.0
    $benchmarkWeight = 0.0
    $proxyWeight = 0.0
    foreach ($evidenceRow in $evidenceRows) {
        $weight = [double]$evidenceRow.evidence_weight
        $evidenceWeightTotal += $weight
        switch ($evidenceRow.source_role) {
            'live_task_evidence' { $directWeight += $weight }
            'reviewed_task_estimate' { $reviewedWeight += $weight }
            'benchmark_task_label' { $benchmarkWeight += $weight }
            'cluster_prior_proxy' { $proxyWeight += $weight }
            'fallback_task_proxy' { $proxyWeight += $weight }
        }
    }
    if ($evidenceWeightTotal -le 0) {
        $evidenceWeightTotal = 1.0
    }
    $directShare = $directWeight / $evidenceWeightTotal
    $reviewedShare = $reviewedWeight / $evidenceWeightTotal
    $benchmarkShare = $benchmarkWeight / $evidenceWeightTotal
    $proxyShare = $proxyWeight / $evidenceWeightTotal
    $evidenceProfile = 'direct {0:P0} | reviewed {1:P0} | benchmark {2:P0} | proxy {3:P0}' -f $directShare, $reviewedShare, $benchmarkShare, $proxyShare
    $reviewPriority = if ($proxyShare -ge 0.45 -or [double]$row.confidence -lt 0.50) {
        'high'
    } elseif ($proxyShare -ge 0.28 -or [double]$row.confidence -lt 0.62) {
        'medium'
    } else {
        'low'
    }

    $summary = '{0} currently reads as {1} because {2} and {3} are the strongest pressure signals, while {4} is the main counterweight. Function mix: {5}. Evidence mix: {6}.' -f `
        $occupation.title, `
        (Get-TransformationLabel -Type $row.role_transformation_type), `
        $driverLabels[$topDrivers[0].key], `
        $driverLabels[$topDrivers[1].key], `
        $counterweightLabels[$topCounterweight.key], `
        $functionSummary, `
        $evidenceProfile

    $csvRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        title = $occupation.title
        role_transformation_type = $row.role_transformation_type
        function_anchor_count = if ($functionMapByOccupation.ContainsKey($row.occupation_id)) { $functionMapByOccupation[$row.occupation_id].Count } else { 0 }
        primary_driver = $driverLabels[$topDrivers[0].key]
        secondary_driver = $driverLabels[$topDrivers[1].key]
        primary_counterweight = $counterweightLabels[$topCounterweight.key]
        evidence_profile = $evidenceProfile
        confidence_band = Get-ConfidenceBand -Value ([double]$row.confidence)
        review_priority = $reviewPriority
        explanation_summary = $summary
    })

    $markdownLines.Add("## $($occupation.title)")
    $markdownLines.Add('')
    $markdownLines.Add(('- Current output: `{0}`' -f (Get-TransformationLabel -Type $row.role_transformation_type)))
    $markdownLines.Add(('- Main pressure signals: `{0}` and `{1}`' -f $driverLabels[$topDrivers[0].key], $driverLabels[$topDrivers[1].key]))
    $markdownLines.Add(('- Main counterweight: `{0}`' -f $counterweightLabels[$topCounterweight.key]))
    $markdownLines.Add("- Function anchors: $functionSummary")
    $markdownLines.Add("- Evidence mix: $evidenceProfile")
    $markdownLines.Add(('- Review priority: `{0}`' -f $reviewPriority))
    $markdownLines.Add("- Summary: $summary")
    $markdownLines.Add('')
}

$csvRows |
    Sort-Object occupation_id |
    Export-Csv -Path (Join-Path $OutputDir 'occupation_role_explanations.csv') -NoTypeInformation -Encoding UTF8

$markdownPath = Join-Path $Root 'docs\data\occupation_role_explanations.md'
$markdownLines | Set-Content -Path $markdownPath -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        explanation_rows = $csvRows.Count
        high_review_priority = ($csvRows | Where-Object { $_.review_priority -eq 'high' }).Count
    }
}
