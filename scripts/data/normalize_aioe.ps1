param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\aioe'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Convert-ColumnLettersToIndex([string]$Letters) {
    $index = 0
    foreach ($char in $Letters.ToCharArray()) {
        $index = ($index * 26) + (([int][char]$char) - [int][char]'A' + 1)
    }
    return ($index - 1)
}

function Get-CellValue {
    param(
        [System.Xml.XmlElement]$Cell,
        [string[]]$SharedStrings,
        [System.Xml.XmlNamespaceManager]$Ns
    )

    $type = $Cell.GetAttribute('t')
    $valueNode = $Cell.SelectSingleNode('a:v', $Ns)
    if ($type -eq 'inlineStr') {
        $textNodes = $Cell.SelectNodes('.//a:t', $Ns)
        return (($textNodes | ForEach-Object { $_.InnerText }) -join '')
    }
    if (-not $valueNode) {
        return ''
    }
    if ($type -eq 's') {
        return $SharedStrings[[int]$valueNode.InnerText]
    }
    return $valueNode.InnerText
}

function Get-XlsxSharedStrings {
    param(
        [Parameter(Mandatory)] [System.IO.Compression.ZipArchive]$Archive
    )

    $entry = $Archive.GetEntry('xl/sharedStrings.xml')
    if (-not $entry) { return @() }

    $stream = $entry.Open()
    try {
        $doc = New-Object System.Xml.XmlDocument
        $doc.Load($stream)
    } finally {
        $stream.Dispose()
    }

    $ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $ns.AddNamespace('a', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

    $values = New-Object System.Collections.Generic.List[string]
    foreach ($node in $doc.SelectNodes('//a:si', $ns)) {
        $text = ($node.SelectNodes('.//a:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
        $values.Add($text)
    }
    return $values.ToArray()
}

function Get-XlsxSheetTargetMap {
    param(
        [Parameter(Mandatory)] [System.IO.Compression.ZipArchive]$Archive
    )

    $workbookEntry = $Archive.GetEntry('xl/workbook.xml')
    $relsEntry = $Archive.GetEntry('xl/_rels/workbook.xml.rels')
    if (-not $workbookEntry -or -not $relsEntry) {
        throw 'Workbook metadata missing from xlsx archive.'
    }

    $workbookDoc = New-Object System.Xml.XmlDocument
    $relsDoc = New-Object System.Xml.XmlDocument
    $wbStream = $workbookEntry.Open()
    $relsStream = $relsEntry.Open()
    try {
        $workbookDoc.Load($wbStream)
        $relsDoc.Load($relsStream)
    } finally {
        $wbStream.Dispose()
        $relsStream.Dispose()
    }

    $wbNs = New-Object System.Xml.XmlNamespaceManager($workbookDoc.NameTable)
    $wbNs.AddNamespace('a', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $wbNs.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $relNs = New-Object System.Xml.XmlNamespaceManager($relsDoc.NameTable)
    $relNs.AddNamespace('r', 'http://schemas.openxmlformats.org/package/2006/relationships')

    $targetByRel = @{}
    foreach ($rel in $relsDoc.SelectNodes('//r:Relationship', $relNs)) {
        $targetByRel[$rel.Id] = $rel.Target
    }

    $sheetTargets = @{}
    foreach ($sheet in $workbookDoc.SelectNodes('//a:sheets/a:sheet', $wbNs)) {
        $rid = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        if ($targetByRel.ContainsKey($rid)) {
            $sheetTargets[$sheet.name] = 'xl/' + $targetByRel[$rid]
        }
    }

    return $sheetTargets
}

function Import-XlsxSheet {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [string]$SheetName
    )

    if (-not (Test-Path $Path)) {
        throw "Missing workbook: $Path"
    }

    $archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $sharedStrings = Get-XlsxSharedStrings -Archive $archive
        $sheetTargets = Get-XlsxSheetTargetMap -Archive $archive
        if (-not $sheetTargets.ContainsKey($SheetName)) {
            throw "Sheet '$SheetName' not found in $Path"
        }

        $entry = $archive.GetEntry($sheetTargets[$SheetName])
        if (-not $entry) {
            throw "Worksheet payload missing for '$SheetName' in $Path"
        }

        $doc = New-Object System.Xml.XmlDocument
        $stream = $entry.Open()
        try {
            $doc.Load($stream)
        } finally {
            $stream.Dispose()
        }

        $ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
        $ns.AddNamespace('a', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

        $headers = @()
        $rows = New-Object System.Collections.Generic.List[object]
        foreach ($rowNode in $doc.SelectNodes('//a:sheetData/a:row', $ns)) {
            $cellValues = @{}
            foreach ($cell in $rowNode.SelectNodes('a:c', $ns)) {
                $reference = $cell.GetAttribute('r')
                $columnLetters = ([regex]::Match($reference, '^[A-Z]+')).Value
                if (-not $columnLetters) { continue }
                $index = Convert-ColumnLettersToIndex $columnLetters
                $cellValues[$index] = Get-CellValue -Cell $cell -SharedStrings $sharedStrings -Ns $ns
            }

            if (-not $headers.Count) {
                $maxIndex = if ($cellValues.Keys.Count) { ($cellValues.Keys | Measure-Object -Maximum).Maximum } else { -1 }
                for ($i = 0; $i -le $maxIndex; $i++) {
                    $headers += if ($cellValues.ContainsKey($i)) { [string]$cellValues[$i] } else { "column_$i" }
                }
                continue
            }

            $rowData = [ordered]@{}
            $hasContent = $false
            for ($i = 0; $i -lt $headers.Count; $i++) {
                $value = if ($cellValues.ContainsKey($i)) { [string]$cellValues[$i] } else { '' }
                if (-not [string]::IsNullOrWhiteSpace($value)) { $hasContent = $true }
                $rowData[$headers[$i]] = $value
            }

            if ($hasContent) {
                $rows.Add([PSCustomObject]$rowData)
            }
        }

        return $rows.ToArray()
    } finally {
        $archive.Dispose()
    }
}

function Normalize-SocCode([string]$Code) {
    if ([string]::IsNullOrWhiteSpace($Code)) { return '' }
    $trimmed = $Code.Trim()
    if ($trimmed -match '^\d{2}-\d{4}$') {
        return "$trimmed.00"
    }
    return $trimmed
}

function New-PercentileMap {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$ScoreColumn,
        [string]$KeyColumn = 'occupation_id'
    )

    $scored = @($Rows | Where-Object { $_.$ScoreColumn -ne '' } | Sort-Object { [double]$_.($ScoreColumn) })
    $map = @{}
    if (-not $scored.Count) { return $map }

    for ($index = 0; $index -lt $scored.Count; $index++) {
        $key = [string]$scored[$index].($KeyColumn)
        $percentile = if ($scored.Count -eq 1) { 1.0 } else { [double]$index / [double]($scored.Count - 1) }
        $map[$key] = $percentile
    }
    return $map
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$occupationBySoc = @{}
foreach ($row in $occupations) {
    $occupationBySoc[$row.onet_soc_code] = $row
}

$appendixPath = Join-Path $SourceDir 'AIOE_DataAppendix.xlsx'
$languageModelPath = Join-Path $SourceDir 'Language Modeling AIOE and AIIE.xlsx'

$aioeRows = Import-XlsxSheet -Path $appendixPath -SheetName 'Appendix A'
$abilityRows = Import-XlsxSheet -Path $appendixPath -SheetName 'Appendix E'
$lmRows = Import-XlsxSheet -Path $languageModelPath -SheetName 'LM AIOE'

$aioeBySoc = @{}
foreach ($row in $aioeRows) {
    $soc = Normalize-SocCode $row.'SOC Code'
    if ($soc) {
        $aioeBySoc[$soc] = $row
    }
}

$lmBySoc = @{}
foreach ($row in $lmRows) {
    $soc = Normalize-SocCode $row.'SOC Code'
    if ($soc) {
        $lmBySoc[$soc] = $row
    }
}

$rawBenchmarkRows = New-Object System.Collections.Generic.List[object]
foreach ($occupation in $occupations) {
    $soc = $occupation.onet_soc_code
    $aioe = $aioeBySoc[$soc]
    $lm = $lmBySoc[$soc]
    if (-not $aioe -and -not $lm) {
        continue
    }

    $rawBenchmarkRows.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        aioe_score = if ($aioe) { [double]$aioe.AIOE } else { '' }
        lm_aioe_score = if ($lm) { [double]$lm.'Language Modeling AIOE' } else { '' }
    })
}

$aioePercentiles = New-PercentileMap -Rows $rawBenchmarkRows -ScoreColumn 'aioe_score'
$lmPercentiles = New-PercentileMap -Rows $rawBenchmarkRows -ScoreColumn 'lm_aioe_score'

$rawAbilityRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $abilityRows) {
    if ([string]::IsNullOrWhiteSpace($row.'O*NET Abilities') -or [string]::IsNullOrWhiteSpace($row.'Ability-Level AI Exposure')) {
        continue
    }

    $rawAbilityRows.Add([PSCustomObject]@{
        ability_name = [string]$row.'O*NET Abilities'
        aioe_ability_exposure_score = [double]$row.'Ability-Level AI Exposure'
    })
}

$abilityPercentiles = New-PercentileMap -Rows $rawAbilityRows -ScoreColumn 'aioe_ability_exposure_score' -KeyColumn 'ability_name'

$abilityOutputRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $rawAbilityRows | Sort-Object ability_name) {
    $abilityOutputRows.Add([PSCustomObject]@{
        ability_name = $row.ability_name
        aioe_ability_exposure_score = '{0:N6}' -f [double]$row.aioe_ability_exposure_score
        aioe_ability_exposure_percentile = '{0:N4}' -f [double]$abilityPercentiles[$row.ability_name]
        source_id = 'src_aioe_2023'
        notes = 'benchmark_only|matched_via_appendix_e'
    })
}

$sourceRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $rawBenchmarkRows | Sort-Object occupation_id) {
    if ($row.aioe_score -ne '') {
        $sourceRows.Add([PSCustomObject]@{
            occupation_id = $row.occupation_id
            benchmark_key = 'aioe'
            benchmark_label = 'AIOE'
            benchmark_group = 'occupation_exposure'
            raw_score = '{0:N6}' -f [double]$row.aioe_score
            percentile = '{0:N4}' -f [double]$aioePercentiles[$row.occupation_id]
            source_id = 'src_aioe_2023'
            release_date = '2023-03-01'
            notes = 'benchmark_only|matched_via_soc'
        })
    }

    if ($row.lm_aioe_score -ne '') {
        $sourceRows.Add([PSCustomObject]@{
            occupation_id = $row.occupation_id
            benchmark_key = 'lm_aioe'
            benchmark_label = 'Language Modeling AIOE'
            benchmark_group = 'occupation_exposure'
            raw_score = '{0:N6}' -f [double]$row.lm_aioe_score
            percentile = '{0:N4}' -f [double]$lmPercentiles[$row.occupation_id]
            source_id = 'src_aioe_2023'
            release_date = '2023-03-01'
            notes = 'benchmark_only|matched_via_soc'
        })
    }
}

$outputRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $rawBenchmarkRows | Sort-Object occupation_id) {
    $aioePct = if ($aioePercentiles.ContainsKey($row.occupation_id)) { $aioePercentiles[$row.occupation_id] } else { $null }
    $lmPct = if ($lmPercentiles.ContainsKey($row.occupation_id)) { $lmPercentiles[$row.occupation_id] } else { $null }
    $values = @()
    if ($null -ne $aioePct) { $values += [double]$aioePct }
    if ($null -ne $lmPct) { $values += [double]$lmPct }
    $benchmarkMean = if ($values.Count) { (($values | Measure-Object -Average).Average) } else { $null }
    $confidence = if ($null -ne $aioePct -and $null -ne $lmPct) { 0.86 } elseif ($null -ne $aioePct -or $null -ne $lmPct) { 0.72 } else { 0.00 }

    $outputRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        aioe_score = if ($row.aioe_score -ne '') { '{0:N6}' -f [double]$row.aioe_score } else { '' }
        aioe_percentile = if ($null -ne $aioePct) { '{0:N4}' -f [double]$aioePct } else { '' }
        lm_aioe_score = if ($row.lm_aioe_score -ne '') { '{0:N6}' -f [double]$row.lm_aioe_score } else { '' }
        lm_aioe_percentile = if ($null -ne $lmPct) { '{0:N4}' -f [double]$lmPct } else { '' }
        webb_ai_score = ''
        webb_ai_percentile = ''
        webb_robot_score = ''
        webb_robot_percentile = ''
        webb_software_score = ''
        webb_software_percentile = ''
        sml_score = ''
        sml_percentile = ''
        gpts_dv_beta_score = ''
        gpts_dv_beta_percentile = ''
        gpts_human_beta_score = ''
        gpts_human_beta_percentile = ''
        benchmark_mean_percentile = if ($null -ne $benchmarkMean) { '{0:N4}' -f [double]$benchmarkMean } else { '' }
        source_id = 'src_benchmark_bundle_2026_03'
        confidence = '{0:N2}' -f $confidence
        notes = ('benchmark_only|matched_via_soc|aioe={0}|lm_aioe={1}' -f ([bool]($row.aioe_score -ne '')).ToString().ToLowerInvariant(), ([bool]($row.lm_aioe_score -ne '')).ToString().ToLowerInvariant())
    })
}

$sourceRows | Export-Csv -Path (Join-Path $OutputDir 'occupation_benchmark_source_scores.csv') -NoTypeInformation -Encoding UTF8
$abilityOutputRows | Export-Csv -Path (Join-Path $OutputDir 'ability_benchmark_scores.csv') -NoTypeInformation -Encoding UTF8
$outputRows | Export-Csv -Path (Join-Path $OutputDir 'occupation_benchmark_scores.csv') -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    benchmark_rows = $outputRows.Count
    aioe_coverage = (@($outputRows | Where-Object { $_.aioe_score }).Count)
    lm_aioe_coverage = (@($outputRows | Where-Object { $_.lm_aioe_score }).Count)
    aioe_ability_rows = $abilityOutputRows.Count
    benchmark_source_rows = $sourceRows.Count
    source_dir = $SourceDir
} | Format-List
