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
        [Parameter(Mandatory)] [string]$ScoreColumn
    )

    $scored = @($Rows | Where-Object { $_.$ScoreColumn -ne '' } | Sort-Object { [double]$_.($ScoreColumn) })
    $map = @{}
    if (-not $scored.Count) { return $map }

    for ($index = 0; $index -lt $scored.Count; $index++) {
        $key = [string]$scored[$index].occupation_id
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
        benchmark_mean_percentile = if ($null -ne $benchmarkMean) { '{0:N4}' -f [double]$benchmarkMean } else { '' }
        source_id = 'src_aioe_2023'
        confidence = '{0:N2}' -f $confidence
        notes = ('benchmark_only|matched_via_soc|aioe={0}|lm_aioe={1}' -f ([bool]($row.aioe_score -ne '')).ToString().ToLowerInvariant(), ([bool]($row.lm_aioe_score -ne '')).ToString().ToLowerInvariant())
    })
}

$outputRows | Export-Csv -Path (Join-Path $OutputDir 'occupation_benchmark_scores.csv') -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    benchmark_rows = $outputRows.Count
    aioe_coverage = (@($outputRows | Where-Object { $_.aioe_score }).Count)
    lm_aioe_coverage = (@($outputRows | Where-Object { $_.lm_aioe_score }).Count)
    source_dir = $SourceDir
} | Format-List
