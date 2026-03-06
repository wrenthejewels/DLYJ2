param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir,
    [switch]$IncludeCandidates,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\onet'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Convert-ToSocCode([string]$OccupationId) {
    $parts = ($OccupationId -replace '^occ_', '') -split '_'
    if ($parts.Count -ne 3) {
        return $null
    }
    return '{0}-{1}.{2}' -f $parts[0], $parts[1], $parts[2]
}

function Get-FieldValue {
    param(
        [Parameter(Mandatory)] [pscustomobject]$Row,
        [Parameter(Mandatory)] [string[]]$Candidates
    )

    foreach ($candidate in $Candidates) {
        $property = $Row.PSObject.Properties[$candidate]
        if ($property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return [string]$property.Value
        }
    }

    return $null
}

function Import-TabCsv {
    param([Parameter(Mandatory)] [string]$Path)
    if (!(Test-Path $Path)) {
        throw "Missing required O*NET file: $Path"
    }
    return Import-Csv -Path $Path -Delimiter "`t"
}

function Normalize-Rating {
    param(
        [string]$ScaleId,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $numeric = [double]$Value
    switch -Regex ($ScaleId) {
        '^(IM|importance)$' { return Clamp (($numeric - 1.0) / 4.0) 0.0 1.0 }
        '^(FT|frequency)$'  { return Clamp (($numeric - 1.0) / 6.0) 0.0 1.0 }
        default {
            if ($numeric -gt 1.0) {
                return Clamp ($numeric / 100.0) 0.0 1.0
            }
            return Clamp $numeric 0.0 1.0
        }
    }
}

function Get-SelectionPriority {
    param(
        [int]$Rank,
        [int]$TotalCount,
        [string]$DataReadiness,
        [string]$PriorityBand
    )

    $readinessAdjust = @{ high = 0.10; medium = 0.05; low = 0.00 }
    $bandAdjust = @{ core = 0.05; stretch = 0.00 }
    $count = [Math]::Max(1, $TotalCount - 1)
    $rankNorm = ($TotalCount - $Rank) / [double]$count
    $raw = 0.55 + (0.25 * $rankNorm) + $readinessAdjust[$DataReadiness] + $bandAdjust[$PriorityBand]
    return ('{0:N2}' -f (Clamp $raw 0.55 0.95))
}

$metadataDir = Join-Path $Root 'data\metadata'
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv') | Sort-Object { [int]$_.launch_rank }
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}

$overrides = Import-Csv (Join-Path $metadataDir 'occupation_stub_overrides.csv')
$overrideBySoc = @{}
foreach ($row in $overrides) {
    $overrideBySoc[$row.provisional_onet_soc_code] = $row
}

$seedBySoc = @{}
foreach ($row in $launchSeed) {
    $seedBySoc[$row.provisional_onet_soc_code] = $row
}

$occupationData = Import-TabCsv (Join-Path $SourceDir 'occupation_data.txt')
$alternateTitles = Import-TabCsv (Join-Path $SourceDir 'alternate_titles.txt')
$taskStatements = Import-TabCsv (Join-Path $SourceDir 'task_statements.txt')
$taskRatings = Import-TabCsv (Join-Path $SourceDir 'task_ratings.txt')
$jobZones = Import-TabCsv (Join-Path $SourceDir 'job_zones.txt')

$occupationRows = $occupationData | Where-Object {
    $soc = Get-FieldValue -Row $_ -Candidates @('O*NET-SOC Code', 'O*NET-SOC Code ') 
    $soc -and $seedBySoc.ContainsKey($soc)
}

$occupations = New-Object System.Collections.Generic.List[object]
$aliases = New-Object System.Collections.Generic.List[object]
$occupationTasks = New-Object System.Collections.Generic.List[object]

$taskRatingsByKey = @{}
foreach ($row in $taskRatings) {
    $soc = Get-FieldValue -Row $row -Candidates @('O*NET-SOC Code')
    $taskId = Get-FieldValue -Row $row -Candidates @('Task ID')
    if (-not $soc -or -not $taskId -or -not $seedBySoc.ContainsKey($soc)) {
        continue
    }

    $key = "$soc|$taskId"
    if (-not $taskRatingsByKey.ContainsKey($key)) {
        $taskRatingsByKey[$key] = @{}
    }

    $scaleId = (Get-FieldValue -Row $row -Candidates @('Scale ID', 'Scale ID '))
    $dataValue = Get-FieldValue -Row $row -Candidates @('Data Value')
    if ($scaleId -and $dataValue) {
        $taskRatingsByKey[$key][$scaleId] = Normalize-Rating -ScaleId $scaleId -Value $dataValue
    }
}

$jobZoneBySoc = @{}
foreach ($row in $jobZones) {
    $soc = Get-FieldValue -Row $row -Candidates @('O*NET-SOC Code')
    if (-not $soc -or -not $seedBySoc.ContainsKey($soc)) {
        continue
    }

    $zone = Get-FieldValue -Row $row -Candidates @('Job Zone', 'Job Zone Number')
    if ($zone) {
        $jobZoneBySoc[$soc] = [int][double]$zone
    }
}

foreach ($row in $occupationRows) {
    $soc = Get-FieldValue -Row $row -Candidates @('O*NET-SOC Code')
    $title = Get-FieldValue -Row $row -Candidates @('Title')
    $seed = $seedBySoc[$soc]
    $override = $overrideBySoc[$soc]
    $occupationId = Convert-ToOccupationId $soc
    $titleShort = if ($override -and $override.title_short) { $override.title_short } else { $title }

    $occupations.Add([PSCustomObject]@{
        occupation_id = $occupationId
        onet_soc_code = $soc
        title = $title
        title_short = $titleShort
        role_family = $seed.role_family
        is_active = 1
        selection_priority = Get-SelectionPriority -Rank ([int]$seed.launch_rank) -TotalCount $launchSeed.Count -DataReadiness $seed.data_readiness -PriorityBand $seed.priority_band
        notes = 'onet_normalized'
    })

    foreach ($alias in @($override.alias_primary, $override.alias_secondary, $titleShort)) {
        if ($alias) {
            $aliasType = if ($alias -eq $titleShort) { 'short_title' } else { 'manual_seed' }
            $aliases.Add([PSCustomObject]@{
                occupation_id = $occupationId
                alias = $alias
                alias_type = $aliasType
                source = 'src_onet_30_1'
                weight = if ($aliasType -eq 'short_title') { '0.95' } else { '0.85' }
            })
        }
    }
}

foreach ($row in $alternateTitles) {
    $soc = Get-FieldValue -Row $row -Candidates @('O*NET-SOC Code')
    if (-not $soc -or -not $seedBySoc.ContainsKey($soc)) {
        continue
    }

    $altTitle = Get-FieldValue -Row $row -Candidates @('Alternate Title', 'Alternate Title(s)', 'Title')
    if (-not $altTitle) {
        continue
    }

    $aliases.Add([PSCustomObject]@{
        occupation_id = Convert-ToOccupationId $soc
        alias = $altTitle
        alias_type = 'alternate_title'
        source = 'src_onet_30_1'
        weight = '0.75'
    })
}

foreach ($row in $taskStatements) {
    $soc = Get-FieldValue -Row $row -Candidates @('O*NET-SOC Code')
    $taskId = Get-FieldValue -Row $row -Candidates @('Task ID')
    if (-not $soc -or -not $taskId -or -not $seedBySoc.ContainsKey($soc)) {
        continue
    }

    $task = Get-FieldValue -Row $row -Candidates @('Task', 'Task Statement')
    if (-not $task) {
        continue
    }

    $taskType = Get-FieldValue -Row $row -Candidates @('Task Type', 'Category')
    $ratings = $taskRatingsByKey["$soc|$taskId"]
    $importance = $null
    $frequency = $null
    if ($ratings) {
        if ($ratings.ContainsKey('IM')) { $importance = $ratings['IM'] }
        elseif ($ratings.ContainsKey('importance')) { $importance = $ratings['importance'] }
        if ($ratings.ContainsKey('FT')) { $frequency = $ratings['FT'] }
        elseif ($ratings.ContainsKey('frequency')) { $frequency = $ratings['frequency'] }
    }

    if ($null -eq $importance) { $importance = 0.60 }
    if ($null -eq $frequency) { $frequency = 0.50 }

    $occupationTasks.Add([PSCustomObject]@{
        occupation_id = Convert-ToOccupationId $soc
        onet_task_id = $taskId
        task_statement = $task
        task_type = if ($taskType) { $taskType } else { 'unknown' }
        importance = ('{0:N2}' -f $importance)
        frequency = ('{0:N2}' -f $frequency)
        source_mix = 'src_onet_30_1'
        notes = 'onet_normalized'
    })
}

$occupations = $occupations | Sort-Object occupation_id
$aliases = $aliases | Sort-Object occupation_id, alias | Group-Object occupation_id, alias | ForEach-Object { $_.Group | Select-Object -First 1 }
$occupationTasks = $occupationTasks | Sort-Object occupation_id, onet_task_id

$occupations | Export-Csv -Path (Join-Path $OutputDir 'occupations.csv') -NoTypeInformation -Encoding UTF8
$aliases | Export-Csv -Path (Join-Path $OutputDir 'occupation_aliases.csv') -NoTypeInformation -Encoding UTF8
$occupationTasks | Export-Csv -Path (Join-Path $OutputDir 'occupation_tasks.csv') -NoTypeInformation -Encoding UTF8

$adaptationPath = Join-Path $OutputDir 'occupation_adaptation_priors.csv'
if (Test-Path $adaptationPath) {
    $adaptationRows = Import-Csv $adaptationPath
    foreach ($row in $adaptationRows) {
        $soc = Convert-ToSocCode $row.occupation_id
        if ($jobZoneBySoc.ContainsKey($soc)) {
            $row.job_zone = $jobZoneBySoc[$soc]
            if ($row.notes -notlike '*onet_job_zone*') {
                $row.notes = if ([string]::IsNullOrWhiteSpace($row.notes)) { 'onet_job_zone' } else { "$($row.notes)|onet_job_zone" }
            }
        }
    }
    $adaptationRows | Export-Csv -Path $adaptationPath -NoTypeInformation -Encoding UTF8
}

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    occupations_normalized = $occupations.Count
    aliases_normalized = $aliases.Count
    occupation_tasks_normalized = $occupationTasks.Count
    job_zones_updated = $jobZoneBySoc.Count
    source_dir = $SourceDir
} | Format-List
