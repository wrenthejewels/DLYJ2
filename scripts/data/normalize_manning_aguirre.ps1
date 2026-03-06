param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir,
    [switch]$IncludeCandidates,
    [switch]$UpdateAdaptation,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\manning_aguirre'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Import-RequiredCsv([string]$Path) {
    if (!(Test-Path $Path)) {
        throw "Missing required Manning/Aguirre extract: $Path"
    }
    return Import-Csv $Path
}

function Resolve-ExtractPath([string]$BaseDir) {
    $candidates = @(
        'occupation_exposure_extract.csv',
        'manning_aguirre_2026_occupation_data.csv'
    )

    foreach ($name in $candidates) {
        $path = Join-Path $BaseDir $name
        if (Test-Path $path) {
            return $path
        }
    }

    throw "Missing required Manning/Aguirre extract in $BaseDir. Expected one of: $($candidates -join ', ')"
}

$metadataDir = Join-Path $Root 'data\metadata'
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}
$seedCodes = $launchSeed | Select-Object -ExpandProperty provisional_onet_soc_code

$extractPath = Resolve-ExtractPath -BaseDir $SourceDir
$extract = Import-RequiredCsv $extractPath
$rows = New-Object System.Collections.Generic.List[object]
foreach ($row in $extract) {
    if (-not $row.onet_soc_code -or $row.onet_soc_code -notin $seedCodes) {
        continue
    }

    $augmentation = if ([string]::IsNullOrWhiteSpace([string]$row.augmentation_score)) { $null } else { ('{0:N2}' -f [double]$row.augmentation_score) }
    $automation = if ([string]::IsNullOrWhiteSpace([string]$row.automation_score)) { $null } else { ('{0:N2}' -f [double]$row.automation_score) }
    $confidence = if ([string]::IsNullOrWhiteSpace([string]$row.confidence)) { '0.58' } else { ('{0:N2}' -f [double]$row.confidence) }
    $noteParts = @('manning_aguirre_normalized')
    if ($row.source_table) {
        $noteParts += ('source_table=' + $row.source_table)
    }
    if ($row.notes) {
        $noteParts += ('extract_note=' + (($row.notes -replace '\|', '/') -replace '\r?\n', ' '))
    }

    $rows.Add([PSCustomObject]@{
        occupation_id = Convert-ToOccupationId $row.onet_soc_code
        source_id = 'src_manning_aguirre_2026_01'
        exposure_score = ('{0:N2}' -f [double]$row.exposure_score)
        augmentation_score = $augmentation
        automation_score = $automation
        adaptive_capacity_score = if ($row.adaptive_capacity_score) { ('{0:N2}' -f [double]$row.adaptive_capacity_score) } else { $null }
        confidence = $confidence
        release_date = if ($row.release_date) { $row.release_date } else { '2026-01-01' }
        notes = ($noteParts -join '|')
    })
}

$rows = $rows | Sort-Object occupation_id

$outputPath = Join-Path $OutputDir 'occupation_exposure_priors.csv'
$existingRows = @()
if (Test-Path $outputPath) {
    $existingRows = Import-Csv $outputPath
}

$coveredIds = $rows | Select-Object -ExpandProperty occupation_id
$retainedRows = $existingRows | Where-Object {
    -not ($_.source_id -eq 'src_manning_aguirre_2026_01' -and $_.occupation_id -in $coveredIds)
}

$mergedRows = @($retainedRows) + @($rows)
$mergedRows = $mergedRows | Sort-Object occupation_id, source_id
$mergedRows | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8

if ($UpdateAdaptation) {
    $adaptationPath = Join-Path $OutputDir 'occupation_adaptation_priors.csv'
    if (Test-Path $adaptationPath) {
        $adaptationRows = Import-Csv $adaptationPath
        $byOccupation = @{}
        foreach ($row in $rows) { $byOccupation[$row.occupation_id] = $row }
        foreach ($adaptation in $adaptationRows) {
            if ($byOccupation.ContainsKey($adaptation.occupation_id)) {
                $exposureRow = $byOccupation[$adaptation.occupation_id]
                if ($exposureRow.adaptive_capacity_score) {
                    $adaptation.adaptive_capacity_score = $exposureRow.adaptive_capacity_score
                }
                if ($adaptation.notes -notlike '*manning_adaptive_capacity*') {
                    $adaptation.notes = if ([string]::IsNullOrWhiteSpace($adaptation.notes)) { 'manning_adaptive_capacity' } else { "$($adaptation.notes)|manning_adaptive_capacity" }
                }
            }
        }
        $adaptationRows | Export-Csv -Path $adaptationPath -NoTypeInformation -Encoding UTF8
    }
}

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    occupation_exposure_rows = $rows.Count
    covered_launch_occupations = ($rows | Select-Object -ExpandProperty occupation_id | Select-Object -Unique).Count
    extract_path = $extractPath
    source_dir = $SourceDir
    updated_adaptation = [bool]$UpdateAdaptation
    rebuilt_selector = [bool]$RebuildSelector
} | Format-List
