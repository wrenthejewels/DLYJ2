param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Get-UnemploymentGroupId {
    param(
        [Parameter(Mandatory)] [string]$SocCode
    )

    $major = [int]($SocCode.Split('-')[0])
    switch ($major) {
        { $_ -in @(11, 13) } { return 'management_business_financial_operations' }
        { $_ -in @(15, 17, 23, 27) } { return 'professional_related' }
        { $_ -in @(41, 43) } { return 'sales_and_office' }
        default { return $null }
    }
}

$groupDefinitions = @(
    [PSCustomObject]@{
        unemployment_group_id = 'management_business_financial_operations'
        unemployment_group_label = 'Management, business, and financial operations occupations'
        unemployment_series_id = 'LNU04032216'
    },
    [PSCustomObject]@{
        unemployment_group_id = 'professional_related'
        unemployment_group_label = 'Professional and related occupations'
        unemployment_series_id = 'LNU04032217'
    },
    [PSCustomObject]@{
        unemployment_group_id = 'sales_and_office'
        unemployment_group_label = 'Sales and office occupations'
        unemployment_series_id = 'LNU04032219'
    }
)

$groupById = @{}
foreach ($group in $groupDefinitions) {
    $groupById[$group.unemployment_group_id] = $group
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$existingLabor = Import-Csv (Join-Path $OutputDir 'occupation_labor_market_context.csv')
$laborByOcc = @{}
foreach ($row in $existingLabor) {
    $laborByOcc[$row.occupation_id] = $row
}

$today = Get-Date
$requestBody = @{
    seriesid = @($groupDefinitions.unemployment_series_id)
    startyear = [string]($today.Year - 1)
    endyear = [string]$today.Year
} | ConvertTo-Json -Compress

$response = Invoke-RestMethod `
    -Method Post `
    -Uri 'https://api.bls.gov/publicAPI/v2/timeseries/data/' `
    -ContentType 'application/json' `
    -Body $requestBody

if ($response.status -ne 'REQUEST_SUCCEEDED') {
    throw "BLS unemployment request failed: $($response | ConvertTo-Json -Compress)"
}

$seriesById = @{}
foreach ($series in $response.Results.series) {
    $seriesById[$series.seriesID] = $series
}

$monthlyRows = New-Object System.Collections.Generic.List[object]
$latestByGroup = @{}

foreach ($group in $groupDefinitions) {
    $series = $seriesById[$group.unemployment_series_id]
    if (-not $series) {
        throw "Missing BLS series response for $($group.unemployment_series_id)"
    }

    $points = @(
        foreach ($entry in $series.data) {
            if ($entry.period -notmatch '^M(0[1-9]|1[0-2])$') {
                continue
            }

            $month = [int]$entry.period.Substring(1)
            $date = Get-Date -Year ([int]$entry.year) -Month $month -Day 1
            [PSCustomObject]@{
                date = $date
                year = [int]$entry.year
                month = $month
                period = $entry.period
                month_label = $date.ToString('MMM yyyy', [System.Globalization.CultureInfo]::InvariantCulture)
                unemployment_rate = if ($entry.value -eq '-') { $null } else { [double]$entry.value }
                is_missing = if ($entry.value -eq '-') { '1' } else { '0' }
                notes = @($entry.footnotes | Where-Object { $_.text } | ForEach-Object { $_.text }) -join ' | '
            }
        }
    ) | Sort-Object date -Descending | Select-Object -First 12 | Sort-Object date

    foreach ($point in $points) {
        $monthlyRows.Add([PSCustomObject]@{
            unemployment_group_id = $group.unemployment_group_id
            unemployment_group_label = $group.unemployment_group_label
            unemployment_series_id = $group.unemployment_series_id
            year = $point.year
            month = $point.month
            period = $point.period
            month_label = $point.month_label
            unemployment_rate = if ($null -ne $point.unemployment_rate) { ('{0:N1}' -f $point.unemployment_rate) } else { $null }
            is_missing = $point.is_missing
            source_id = 'src_bls_cps_occupation_unemployment_2026_03'
            notes = $point.notes
        })
    }

    $latestByGroup[$group.unemployment_group_id] = $points |
        Where-Object { $null -ne $_.unemployment_rate } |
        Select-Object -Last 1
}

$updatedLabor = foreach ($occupation in $occupations) {
    $existing = $laborByOcc[$occupation.occupation_id]
    if (-not $existing) {
        continue
    }

    $groupId = Get-UnemploymentGroupId -SocCode $occupation.onet_soc_code
    $group = if ($groupId) { $groupById[$groupId] } else { $null }
    $latest = if ($groupId) { $latestByGroup[$groupId] } else { $null }

    [PSCustomObject]@{
        occupation_id = $existing.occupation_id
        employment_us = $existing.employment_us
        annual_openings = $existing.annual_openings
        median_wage_usd = $existing.median_wage_usd
        wage_p25_usd = $existing.wage_p25_usd
        wage_p75_usd = $existing.wage_p75_usd
        projection_growth_pct = $existing.projection_growth_pct
        unemployment_group_id = if ($group) { $group.unemployment_group_id } else { $null }
        unemployment_group_label = if ($group) { $group.unemployment_group_label } else { $null }
        unemployment_series_id = if ($group) { $group.unemployment_series_id } else { $null }
        latest_unemployment_rate = if ($latest) { ('{0:N1}' -f [double]$latest.unemployment_rate) } else { $null }
        latest_unemployment_period = if ($latest) { $latest.month_label } else { $null }
        labor_market_confidence = $existing.labor_market_confidence
        release_year = $existing.release_year
    }
}

$updatedLabor | Sort-Object occupation_id | Export-Csv `
    -Path (Join-Path $OutputDir 'occupation_labor_market_context.csv') `
    -NoTypeInformation `
    -Encoding UTF8

$monthlyRows | Sort-Object unemployment_group_id, year, month | Export-Csv `
    -Path (Join-Path $OutputDir 'occupation_unemployment_monthly.csv') `
    -NoTypeInformation `
    -Encoding UTF8

[PSCustomObject]@{
    unemployment_groups = $groupDefinitions.Count
    monthly_rows = $monthlyRows.Count
    occupations_with_mapping = ($updatedLabor | Where-Object { $_.unemployment_group_id }).Count
    latest_period = ($monthlyRows | Sort-Object year, month | Select-Object -Last 1).month_label
} | Format-List
