param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'

function Get-Map {
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

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

$normalizedDir = Join-Path $Root 'data\normalized'
$occupations = Import-Csv (Join-Path $normalizedDir 'occupations.csv')
$aliases = Import-Csv (Join-Path $normalizedDir 'occupation_aliases.csv')
$labor = Import-Csv (Join-Path $normalizedDir 'occupation_labor_market_context.csv')
$priors = Import-Csv (Join-Path $normalizedDir 'occupation_exposure_priors.csv')
$adaptation = Import-Csv (Join-Path $normalizedDir 'occupation_adaptation_priors.csv')

$laborByOcc = Get-Map -Rows $labor -Key 'occupation_id'
$adaptationByOcc = Get-Map -Rows $adaptation -Key 'occupation_id'

$priorsByOcc = @{}
foreach ($row in $priors) {
    if (-not $priorsByOcc.ContainsKey($row.occupation_id)) {
        $priorsByOcc[$row.occupation_id] = @()
    }
    $priorsByOcc[$row.occupation_id] += $row
}

$aliasesByOcc = @{}
foreach ($row in $aliases) {
    if (-not $aliasesByOcc.ContainsKey($row.occupation_id)) {
        $aliasesByOcc[$row.occupation_id] = New-Object System.Collections.Generic.List[string]
    }
    $aliasesByOcc[$row.occupation_id].Add($row.alias)
}

$employmentValues = $labor | ForEach-Object { [double]$_.employment_us }
$minEmployment = ($employmentValues | Measure-Object -Minimum).Minimum
$maxEmployment = ($employmentValues | Measure-Object -Maximum).Maximum
$employmentRange = [Math]::Max(1.0, ($maxEmployment - $minEmployment))

$output = foreach ($occupation in $occupations) {
    $occupationId = $occupation.occupation_id
    $aliasList = @()
    if ($aliasesByOcc.ContainsKey($occupationId)) {
        $aliasList = $aliasesByOcc[$occupationId]
    }

    $laborRow = $null
    if ($laborByOcc.ContainsKey($occupationId)) {
        $laborRow = $laborByOcc[$occupationId]
    }

    $priorRow = $null
    if ($priorsByOcc.ContainsKey($occupationId)) {
        $priorRow = $priorsByOcc[$occupationId] |
            Sort-Object @{ Expression = { - [double]($_.confidence) } } |
            Select-Object -First 1
    }
    $adaptationRow = if ($adaptationByOcc.ContainsKey($occupationId)) { $adaptationByOcc[$occupationId] } else { $null }

    $searchTerms = @($occupation.title_short, $occupation.title)
    $searchTerms += $aliasList
    $searchBlob = ($searchTerms |
        Where-Object { $_ } |
        ForEach-Object { $_.ToLowerInvariant().Trim() } |
        Select-Object -Unique) -join ' '

    $selectionPriority = [double]$occupation.selection_priority
    $employment = if ($laborRow) { [double]$laborRow.employment_us } else { 0 }
    $employmentNorm = if ($laborRow) { ($employment - $minEmployment) / $employmentRange } else { 0 }
    $exposure = if ($priorRow -and $priorRow.exposure_score) { [double]$priorRow.exposure_score } else { 0.5 }
    $adaptive = if ($adaptationRow -and $adaptationRow.adaptive_capacity_score) { [double]$adaptationRow.adaptive_capacity_score } elseif ($priorRow -and $priorRow.adaptive_capacity_score) { [double]$priorRow.adaptive_capacity_score } else { 0.5 }

    $selectorWeightRaw = [Math]::Round(($selectionPriority * 0.70) + ($employmentNorm * 0.15) + ($exposure * 0.10) + ($adaptive * 0.05), 2)
    $selectorWeight = Clamp $selectorWeightRaw 0.00 0.99
    $coverageTier = if ($occupation.notes -like '*sample_stub*') { 'starter_stub' } else { 'launch' }

    [PSCustomObject]@{
        occupation_id = $occupationId
        title = $occupation.title
        role_family = $occupation.role_family
        search_blob = $searchBlob
        employment_us = if ($laborRow) { [int]$laborRow.employment_us } else { $null }
        median_wage_usd = if ($laborRow) { [int]$laborRow.median_wage_usd } else { $null }
        projection_growth_pct = if ($laborRow) { [double]$laborRow.projection_growth_pct } else { $null }
        exposure_prior_score = if ($priorRow) { $priorRow.exposure_score } else { $null }
        adaptive_capacity_prior_score = if ($adaptationRow) { $adaptationRow.adaptive_capacity_score } elseif ($priorRow) { $priorRow.adaptive_capacity_score } else { $null }
        selector_weight = ('{0:N2}' -f $selectorWeight)
        coverage_tier = $coverageTier
    }
}

$output = $output | Sort-Object @{ Expression = { [double]$_.selector_weight }; Descending = $true }, title
$outputPath = Join-Path $normalizedDir 'occupation_selector_index.csv'
$output | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    $output
}
