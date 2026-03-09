param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$ContractDir,
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

if (-not $ContractDir) {
    $ContractDir = Join-Path $Root 'data\normalized'
}
if (-not $OutputPath) {
    $OutputPath = Join-Path $Root 'docs\data\benchmark_validation_report.md'
}

function To-Number {
    param([object]$Value)
    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return $null
    }
    return [double]$Value
}

function Get-Correlation {
    param(
        [double[]]$X,
        [double[]]$Y
    )

    if (-not $X -or -not $Y -or $X.Count -ne $Y.Count -or $X.Count -lt 2) {
        return $null
    }

    $meanX = ($X | Measure-Object -Average).Average
    $meanY = ($Y | Measure-Object -Average).Average
    $covariance = 0.0
    $sumSqX = 0.0
    $sumSqY = 0.0

    for ($i = 0; $i -lt $X.Count; $i++) {
        $dx = [double]$X[$i] - [double]$meanX
        $dy = [double]$Y[$i] - [double]$meanY
        $covariance += ($dx * $dy)
        $sumSqX += ($dx * $dx)
        $sumSqY += ($dy * $dy)
    }

    if ($sumSqX -le 0 -or $sumSqY -le 0) {
        return $null
    }

    return $covariance / [Math]::Sqrt($sumSqX * $sumSqY)
}

$occupations = Import-Csv (Join-Path $ContractDir 'occupations.csv')
$exposure = Import-Csv (Join-Path $ContractDir 'occupation_exposure_priors.csv')
$benchmarks = Import-Csv (Join-Path $ContractDir 'occupation_benchmark_scores.csv')

$occupationTitles = @{}
foreach ($row in $occupations) {
    $occupationTitles[$row.occupation_id] = $row.title
}

$benchmarkByOccupation = @{}
foreach ($row in $benchmarks) {
    $benchmarkByOccupation[$row.occupation_id] = $row
}

$missingBenchmarkTitles = @(
    $occupations |
        Where-Object { $_.occupation_id -notin $benchmarkByOccupation.Keys } |
        Select-Object -ExpandProperty title
)

$comparisonRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $exposure) {
    if (-not $benchmarkByOccupation.ContainsKey($row.occupation_id)) {
        continue
    }

    $benchmark = $benchmarkByOccupation[$row.occupation_id]
    $exposureScore = To-Number $row.exposure_score
    $composite = To-Number $benchmark.benchmark_mean_percentile
    $aioePct = To-Number $benchmark.aioe_percentile
    $lmPct = To-Number $benchmark.lm_aioe_percentile
    if ($null -eq $composite) {
        continue
    }

    $comparisonRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        occupation_title = $occupationTitles[$row.occupation_id]
        exposure_score = $exposureScore
        aioe_percentile = $aioePct
        lm_aioe_percentile = $lmPct
        benchmark_mean_percentile = $composite
        absolute_delta = [Math]::Abs([double]$exposureScore - [double]$composite)
        signed_delta = [double]$exposureScore - [double]$composite
    })
}

$exposureValues = @($comparisonRows | ForEach-Object { [double]$_.exposure_score })
$benchmarkValues = @($comparisonRows | ForEach-Object { [double]$_.benchmark_mean_percentile })
$aioeRows = @($comparisonRows | Where-Object { $null -ne $_.aioe_percentile })
$lmRows = @($comparisonRows | Where-Object { $null -ne $_.lm_aioe_percentile })

$corrComposite = Get-Correlation -X $exposureValues -Y $benchmarkValues
$corrAioe = Get-Correlation -X (@($aioeRows | ForEach-Object { [double]$_.exposure_score })) -Y (@($aioeRows | ForEach-Object { [double]$_.aioe_percentile }))
$corrLm = Get-Correlation -X (@($lmRows | ForEach-Object { [double]$_.exposure_score })) -Y (@($lmRows | ForEach-Object { [double]$_.lm_aioe_percentile }))
$corrCompositeLabel = if ($null -ne $corrComposite) { '{0:N3}' -f $corrComposite } else { 'na' }
$corrAioeLabel = if ($null -ne $corrAioe) { '{0:N3}' -f $corrAioe } else { 'na' }
$corrLmLabel = if ($null -ne $corrLm) { '{0:N3}' -f $corrLm } else { 'na' }

$topExposure = @($comparisonRows | Sort-Object exposure_score -Descending | Select-Object -First ([Math]::Max(1, [Math]::Ceiling($comparisonRows.Count * 0.25))))
$topBenchmark = @($comparisonRows | Sort-Object benchmark_mean_percentile -Descending | Select-Object -First ([Math]::Max(1, [Math]::Ceiling($comparisonRows.Count * 0.25))))
$topExposureIds = @($topExposure | ForEach-Object { $_.occupation_id })
$topBenchmarkIds = @($topBenchmark | ForEach-Object { $_.occupation_id })
$overlapCount = (@($topExposureIds | Where-Object { $_ -in $topBenchmarkIds })).Count
$largestGaps = @($comparisonRows | Sort-Object absolute_delta -Descending | Select-Object -First 12)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# Benchmark Validation Report')
$lines.Add('')
$lines.Add('This report compares the live `2.0` occupation exposure prior against the benchmark-only AIOE layer. The benchmark file is not used in public scoring; it is a validation reference only.')
$lines.Add('')
$lines.Add('## Coverage summary')
$lines.Add('')
$lines.Add(('- Occupations with benchmark rows: `{0}`' -f $comparisonRows.Count))
$lines.Add(('- Occupations with classic AIOE percentile: `{0}`' -f $aioeRows.Count))
$lines.Add(('- Occupations with language-model AIOE percentile: `{0}`' -f $lmRows.Count))
if ($missingBenchmarkTitles.Count -gt 0) {
    $lines.Add(('- Launch occupations without AIOE coverage: `{0}`' -f ($missingBenchmarkTitles -join '; ')))
}
$lines.Add('')
$lines.Add('## Correlation against live exposure prior')
$lines.Add('')
$lines.Add(('- Composite benchmark percentile correlation: `{0}`' -f $corrCompositeLabel))
$lines.Add(('- Classic AIOE percentile correlation: `{0}`' -f $corrAioeLabel))
$lines.Add(('- Language-model AIOE percentile correlation: `{0}`' -f $corrLmLabel))
$lines.Add(('- Top-quartile overlap count: `{0}` of `{1}`' -f $overlapCount, $topExposure.Count))
$lines.Add('')
$lines.Add('## Largest benchmark disagreements')
$lines.Add('')
$lines.Add('| Occupation | Live exposure | Benchmark percentile | Delta | Classic AIOE | LM AIOE |')
$lines.Add('| --- | ---: | ---: | ---: | ---: | ---: |')
foreach ($row in $largestGaps) {
    $aioeLabel = if ($null -ne $row.aioe_percentile) { '{0:N3}' -f $row.aioe_percentile } else { 'na' }
    $lmLabel = if ($null -ne $row.lm_aioe_percentile) { '{0:N3}' -f $row.lm_aioe_percentile } else { 'na' }
    $lines.Add(('| {0} | {1:N3} | {2:N3} | {3:N3} | {4} | {5} |' -f $row.occupation_title, $row.exposure_score, $row.benchmark_mean_percentile, $row.signed_delta, $aioeLabel, $lmLabel))
}
$lines.Add('')
$lines.Add('## Notes')
$lines.Add('')
$lines.Add('- The benchmark layer is derived from direct SOC-to-SOC matches against the AIOE repository workbooks, so it avoids the weaker O*NET-to-ISCO bridge required for ILO.')
$lines.Add('- Higher disagreement does not imply the benchmark is better; it flags occupations for closer review of task mapping, source coverage, or model interpretation.')
$lines.Add('- `ILO` remains pending because the accessible occupational data path is still weaker than the AIOE path and the current `crosswalk_onet_to_isco.csv` is explicitly a placeholder.')

$reportDir = Split-Path -Parent $OutputPath
if ($reportDir -and -not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
}

$lines | Set-Content -Path $OutputPath -Encoding UTF8

[PSCustomObject]@{
    compared_occupations = $comparisonRows.Count
    output_path = $OutputPath
    correlation_composite = $corrCompositeLabel
} | Format-List
