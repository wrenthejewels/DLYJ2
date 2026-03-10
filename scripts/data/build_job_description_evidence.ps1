param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

$metadataDir = Join-Path $Root 'data\metadata'
$sourcePath = Join-Path $metadataDir 'job_description_seed_task_expansions.csv'
$occupationsPath = Join-Path $OutputDir 'occupations.csv'

if (-not (Test-Path $sourcePath)) {
    throw "Missing job description seed metadata: $sourcePath"
}

if (-not (Test-Path $occupationsPath)) {
    throw "Missing occupations file: $occupationsPath"
}

$occupations = Import-Csv $occupationsPath
$occupationIds = $occupations | Select-Object -ExpandProperty occupation_id
$seedRows = Import-Csv $sourcePath

$normalizedRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $seedRows) {
    if ($row.occupation_id -notin $occupationIds) {
        continue
    }

    $normalizedRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        evidence_id = $row.evidence_id
        employer_name = $row.employer_name
        job_title = $row.job_title
        source_url = $row.source_url
        source_kind = $row.source_kind
        task_statement = $row.task_statement
        task_family_id = $row.task_family_id
        task_type = $row.task_type
        importance = $row.importance
        frequency = $row.frequency
        review_status = $row.review_status
        source_confidence = $row.source_confidence
        notes = $row.notes
    })
}

$outputPath = Join-Path $OutputDir 'job_description_task_evidence.csv'
$normalizedRows |
    Sort-Object occupation_id, evidence_id |
    Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        rows = $normalizedRows.Count
        occupations = ($normalizedRows | Select-Object -ExpandProperty occupation_id -Unique).Count
    }
}
