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

function Group-ByKey {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key
    )

    $map = @{}
    foreach ($row in $Rows) {
        if (-not $map.ContainsKey($row.$Key)) {
            $map[$row.$Key] = New-Object System.Collections.Generic.List[object]
        }
        $map[$row.$Key].Add($row)
    }
    return $map
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$taskInventory = Import-Csv (Join-Path $OutputDir 'occupation_task_inventory.csv')
$dependencyEdges = Import-Csv (Join-Path $OutputDir 'task_dependency_edges.csv')
$taskSourceEvidence = Import-Csv (Join-Path $OutputDir 'task_source_evidence.csv')
$occupationFunctionMap = Import-Csv (Join-Path $OutputDir 'occupation_function_map.csv')
$taskFunctionEdges = Import-Csv (Join-Path $OutputDir 'task_function_edges.csv')
$functionProfiles = Import-Csv (Join-Path $OutputDir 'function_accountability_profiles.csv')
$taskRoleProfiles = Import-Csv (Join-Path $OutputDir 'occupation_task_role_profiles.csv')
$adaptationPriors = Import-Csv (Join-Path $OutputDir 'occupation_adaptation_priors.csv')
$laborContext = Import-Csv (Join-Path $OutputDir 'occupation_labor_market_context.csv')
$occupationSourcePriors = Import-Csv (Join-Path $OutputDir 'occupation_source_priors.csv')
$calibrationOverrides = Import-Csv (Join-Path $Root 'data\metadata\pilot_role_transformation_calibration.csv')

$inventoryByOccupation = Group-ByKey -Rows $taskInventory -Key 'occupation_id'
$incomingEdgesByOccupation = @{}
foreach ($edge in $dependencyEdges) {
    $key = "$($edge.occupation_id)|$($edge.to_task_id)"
    if (-not $incomingEdgesByOccupation.ContainsKey($key)) {
        $incomingEdgesByOccupation[$key] = New-Object System.Collections.Generic.List[object]
    }
    $incomingEdgesByOccupation[$key].Add($edge)
}

$taskEvidenceByTaskId = @{}
foreach ($row in $taskSourceEvidence) {
    if (-not $taskEvidenceByTaskId.ContainsKey($row.task_id)) {
        $taskEvidenceByTaskId[$row.task_id] = New-Object System.Collections.Generic.List[object]
    }
    $taskEvidenceByTaskId[$row.task_id].Add($row)
}

$functionEdgesByTaskId = Group-ByKey -Rows $taskFunctionEdges -Key 'task_id'
$functionProfilesByFunctionId = @{}
foreach ($row in $functionProfiles) {
    $functionProfilesByFunctionId[$row.function_id] = $row
}
$functionMapByOccupation = Group-ByKey -Rows $occupationFunctionMap -Key 'occupation_id'

$taskRoleProfileByOccupation = @{}
foreach ($row in $taskRoleProfiles) {
    $taskRoleProfileByOccupation[$row.occupation_id] = $row
}

$adaptationByOccupation = @{}
foreach ($row in $adaptationPriors) {
    $adaptationByOccupation[$row.occupation_id] = $row
}

$laborByOccupation = @{}
foreach ($row in $laborContext) {
    $laborByOccupation[$row.occupation_id] = $row
}

$sourcePriorsByOccupation = Group-ByKey -Rows $occupationSourcePriors -Key 'occupation_id'
$calibrationByOccupation = @{}
foreach ($row in $calibrationOverrides) {
    $calibrationByOccupation[$row.occupation_id] = $row
}

$growthValues = $laborContext | ForEach-Object { [double]$_.projection_growth_pct }
$openingsRates = $laborContext | ForEach-Object { [double]$_.annual_openings / [Math]::Max(1.0, [double]$_.employment_us) }
$minGrowth = ($growthValues | Measure-Object -Minimum).Minimum
$maxGrowth = ($growthValues | Measure-Object -Maximum).Maximum
$minOpeningsRate = ($openingsRates | Measure-Object -Minimum).Minimum
$maxOpeningsRate = ($openingsRates | Measure-Object -Maximum).Maximum
$growthRange = [Math]::Max(1.0, ($maxGrowth - $minGrowth))
$openingsRange = [Math]::Max(0.0001, ($maxOpeningsRate - $minOpeningsRate))

$routineTaskFamilies = @('cluster_execution_routine','cluster_workflow_admin','cluster_documentation')
$results = New-Object System.Collections.Generic.List[object]

foreach ($occupation in $occupations) {
    $tasks = if ($inventoryByOccupation.ContainsKey($occupation.occupation_id)) { $inventoryByOccupation[$occupation.occupation_id] } else { @() }
    if (-not $tasks.Count) {
        continue
    }

    $functionMaps = if ($functionMapByOccupation.ContainsKey($occupation.occupation_id)) { $functionMapByOccupation[$occupation.occupation_id] } else { @() }
    $profileWeightTotal = 0.0
    $profileJudgment = 0.0
    $profileTrust = 0.0
    $profileRegulatory = 0.0
    $profileAuthority = 0.0
    $profileBargaining = 0.0
    $profileConfidence = 0.0
    $primaryOutputs = New-Object System.Collections.Generic.List[string]
    $stakeholders = New-Object System.Collections.Generic.List[string]
    $accountabilityStatements = New-Object System.Collections.Generic.List[string]
    foreach ($functionMap in $functionMaps) {
        if (-not $functionProfilesByFunctionId.ContainsKey($functionMap.function_id)) {
            continue
        }
        $functionProfile = $functionProfilesByFunctionId[$functionMap.function_id]
        $functionWeight = [double]$functionMap.function_weight
        $profileWeightTotal += $functionWeight
        $profileJudgment += $functionWeight * [double]$functionProfile.judgment_requirement
        $profileTrust += $functionWeight * [double]$functionProfile.trust_requirement
        $profileRegulatory += $functionWeight * [double]$functionProfile.regulatory_liability_weight
        $profileAuthority += $functionWeight * [double]$functionProfile.human_authority_requirement
        $profileBargaining += $functionWeight * [double]$functionProfile.bargaining_power_retention
        $profileConfidence += $functionWeight * [double]$functionProfile.source_confidence
        if (-not [string]::IsNullOrWhiteSpace([string]$functionProfile.primary_output)) {
            $primaryOutputs.Add([string]$functionProfile.primary_output)
        }
        if (-not [string]::IsNullOrWhiteSpace([string]$functionProfile.primary_stakeholder)) {
            $stakeholders.Add([string]$functionProfile.primary_stakeholder)
        }
        if (-not [string]::IsNullOrWhiteSpace([string]$functionProfile.accountability_statement)) {
            $accountabilityStatements.Add([string]$functionProfile.accountability_statement)
        }
    }
    if ($profileWeightTotal -le 0) {
        $profileWeightTotal = 1.0
    }
    $profile = [PSCustomObject]@{
        judgment_requirement = $profileJudgment / $profileWeightTotal
        trust_requirement = $profileTrust / $profileWeightTotal
        regulatory_liability_weight = $profileRegulatory / $profileWeightTotal
        human_authority_requirement = $profileAuthority / $profileWeightTotal
        bargaining_power_retention = $profileBargaining / $profileWeightTotal
        source_confidence = $profileConfidence / $profileWeightTotal
        primary_output = ($primaryOutputs | Select-Object -Unique) -join ' / '
        primary_stakeholder = ($stakeholders | Select-Object -Unique) -join ' / '
        accountability_statement = ($accountabilityStatements | Select-Object -Unique) -join ' / '
    }
    $roleProfile = $taskRoleProfileByOccupation[$occupation.occupation_id]
    $adaptation = $adaptationByOccupation[$occupation.occupation_id]
    $labor = $laborByOccupation[$occupation.occupation_id]
    $benchmarkRows = if ($sourcePriorsByOccupation.ContainsKey($occupation.occupation_id)) { $sourcePriorsByOccupation[$occupation.occupation_id] } else { @() }
    $functionWeightById = @{}
    foreach ($functionMap in $functionMaps) {
        $functionWeightById[$functionMap.function_id] = [double]$functionMap.function_weight
    }

    $guardrail = Clamp (
        (0.30 * [double]$profile.judgment_requirement) +
        (0.25 * [double]$profile.trust_requirement) +
        (0.20 * [double]$profile.regulatory_liability_weight) +
        (0.25 * [double]$profile.human_authority_requirement)
    ) 0.05 0.99

    $taskAgg = @{}
    foreach ($task in $tasks) {
        $evidenceRows = if ($taskEvidenceByTaskId.ContainsKey($task.task_id)) { $taskEvidenceByTaskId[$task.task_id] } else { @() }
        $weightTotal = 0.0
        $exposure = 0.0
        $augmentation = 0.0
        $automation = 0.0
        $confidence = 0.0
        $liveCoverage = 0.0
        $sourceIds = New-Object System.Collections.Generic.HashSet[string]

        foreach ($row in $evidenceRows) {
            $weight = [double]$row.evidence_weight * [Math]::Max(0.20, [double]$row.confidence)
            $weightTotal += $weight
            $exposure += $weight * [double]$row.exposure_score
            $augmentation += $weight * [double]$row.augmentation_score
            $automation += $weight * [double]$row.automation_score
            $confidence += $weight * [double]$row.confidence
            if ($row.source_role -eq 'live_task_evidence') {
                $liveCoverage += $weight
            }
            [void]$sourceIds.Add($row.source_id)
        }

        if ($weightTotal -le 0) {
            $weightTotal = 1.0
        }

        $meanExposure = $exposure / $weightTotal
        $meanAugmentation = $augmentation / $weightTotal
        $meanAutomation = $automation / $weightTotal
        $meanConfidence = $confidence / $weightTotal
        $directPressure = Clamp ((0.50 * $meanExposure) + (0.35 * $meanAutomation) + (0.15 * $meanAugmentation)) 0.0 1.0

        $taskAgg[$task.task_id] = [PSCustomObject]@{
            task_id = $task.task_id
            direct_pressure = $directPressure
            exposure_score = $meanExposure
            augmentation_score = $meanAugmentation
            automation_score = $meanAutomation
            confidence = $meanConfidence
            live_coverage = if ($weightTotal -gt 0) { $liveCoverage / $weightTotal } else { 0.0 }
            source_ids = ($sourceIds | Sort-Object) -join '|'
        }
    }

    $weightedDirectPressure = 0.0
    $weightedIndirectPressure = 0.0
    $weightedFunctionPressure = 0.0
    $functionWeightTotal = 0.0
    $weightedAugmentation = 0.0
    $weightedBargaining = 0.0
    $weightedConfidence = 0.0
    $supportHighPressureShare = 0.0
    $routineHighPressureShare = 0.0
    $sourceMixSet = New-Object System.Collections.Generic.HashSet[string]

    foreach ($task in $tasks) {
        $taskMetrics = $taskAgg[$task.task_id]
        $incomingKey = "$($occupation.occupation_id)|$($task.task_id)"
        $incomingEdges = if ($incomingEdgesByOccupation.ContainsKey($incomingKey)) { $incomingEdgesByOccupation[$incomingKey] } else { @() }
        $indirectNumerator = 0.0
        $indirectDenominator = 0.0
        foreach ($edge in $incomingEdges) {
            if (-not $taskAgg.ContainsKey($edge.from_task_id)) {
                continue
            }
            $fromMetrics = $taskAgg[$edge.from_task_id]
            $edgeWeight = [double]$edge.dependency_strength
            $indirectNumerator += $edgeWeight * [double]$fromMetrics.direct_pressure
            $indirectDenominator += $edgeWeight
        }
        $indirectPressure = if ($indirectDenominator -gt 0) {
            Clamp ($indirectNumerator / $indirectDenominator) 0.0 1.0
        } else {
            0.0
        }

        $timeShare = [double]$task.time_share_prior
        $weightedDirectPressure += $timeShare * [double]$taskMetrics.direct_pressure
        $weightedIndirectPressure += $timeShare * $indirectPressure
        $weightedAugmentation += $timeShare * [double]$taskMetrics.augmentation_score
        $weightedBargaining += $timeShare * [double]$task.bargaining_power_weight
        $weightedConfidence += $timeShare * [double]$taskMetrics.confidence

        if (($task.role_criticality -ne 'core') -and ([double]$taskMetrics.direct_pressure -ge 0.60)) {
            $supportHighPressureShare += $timeShare
        }
        if (($task.task_family_id -in $routineTaskFamilies) -and ([double]$taskMetrics.direct_pressure -ge 0.55)) {
            $routineHighPressureShare += $timeShare
        }

        if ($functionEdgesByTaskId.ContainsKey($task.task_id)) {
            foreach ($functionEdge in $functionEdgesByTaskId[$task.task_id]) {
                $anchorWeight = if ($functionWeightById.ContainsKey($functionEdge.function_id)) { [double]$functionWeightById[$functionEdge.function_id] } else { 1.0 }
                $functionWeight = [double]$functionEdge.task_to_function_weight * $anchorWeight
                $weightedFunctionPressure += $functionWeight * ((0.78 * [double]$taskMetrics.direct_pressure) + (0.22 * $indirectPressure))
                $functionWeightTotal += $functionWeight
            }
        }

        foreach ($sourceId in (($taskMetrics.source_ids -split '\|') | Where-Object { $_ })) {
            [void]$sourceMixSet.Add($sourceId)
        }
    }

    $functionExposurePressure = if ($functionWeightTotal -gt 0) {
        Clamp ($weightedFunctionPressure / $functionWeightTotal) 0.0 1.0
    } else {
        $weightedDirectPressure
    }

    $retainedFunctionStrength = Clamp (((1 - $functionExposurePressure) * 0.42) + ($guardrail * 0.42) + ($weightedBargaining * 0.16)) 0.0 1.0
    $retainedAccountabilityStrength = Clamp (((1 - $functionExposurePressure) * 0.28) + (([double]$profile.trust_requirement) * 0.24) + (([double]$profile.regulatory_liability_weight) * 0.24) + (([double]$profile.human_authority_requirement) * 0.24)) 0.0 1.0
    $retainedBargainingPower = Clamp (($weightedBargaining * 0.52) + ($guardrail * 0.28) + ((1 - $weightedDirectPressure) * 0.20)) 0.0 1.0

    $roleFragmentationRisk = Clamp (($supportHighPressureShare * 0.34) + ($weightedDirectPressure * 0.18) + ($weightedIndirectPressure * 0.18) + ((1 - $retainedFunctionStrength) * 0.16) + ((1 - $retainedAccountabilityStrength) * 0.14)) 0.0 1.0
    $roleCompressibility = Clamp (($routineHighPressureShare * 0.34) + ($supportHighPressureShare * 0.26) + ($weightedDirectPressure * 0.18) + ((1 - $retainedAccountabilityStrength) * 0.12) + ((1 - $retainedBargainingPower) * 0.10)) 0.0 1.0

    $adaptiveCapacity = if ($adaptation) { [double]$adaptation.adaptive_capacity_score } else { 0.50 }
    $transferability = if ($adaptation) { [double]$adaptation.transferability_score } else { 0.50 }
    $learningIntensity = if ($adaptation) { [double]$adaptation.learning_intensity_score } else { 0.50 }
    $growthNorm = if ($labor) {
        Clamp ((([double]$labor.projection_growth_pct - $minGrowth) / $growthRange)) 0.0 1.0
    } else {
        0.50
    }
    $openingsNorm = if ($labor) {
        $openingsRate = [double]$labor.annual_openings / [Math]::Max(1.0, [double]$labor.employment_us)
        Clamp ((($openingsRate - $minOpeningsRate) / $openingsRange)) 0.0 1.0
    } else {
        0.50
    }

    $demandExpansionSignal = Clamp (($adaptiveCapacity * 0.35) + ($transferability * 0.20) + ($learningIntensity * 0.15) + ($growthNorm * 0.15) + ($openingsNorm * 0.15)) 0.0 1.0
    $delegationLikelihood = Clamp (($functionExposurePressure * 0.34) + ($weightedDirectPressure * 0.24) + ($weightedAugmentation * 0.20) + ((1 - $retainedAccountabilityStrength) * 0.12) + ($supportHighPressureShare * 0.10)) 0.0 1.0
    $headcountDisplacementRisk = Clamp (($weightedDirectPressure * 0.18) + ($weightedIndirectPressure * 0.12) + ($roleFragmentationRisk * 0.22) + ($roleCompressibility * 0.22) + ((1 - $retainedFunctionStrength) * 0.18) + ((1 - $demandExpansionSignal) * 0.08)) 0.0 1.0

    $benchmarkMean = ($benchmarkRows | Where-Object { $_.prior_key -eq 'benchmark_mean_percentile' } | Select-Object -First 1)
    $benchmarkMeanValue = if ($benchmarkMean) { [double]$benchmarkMean.prior_score } else { 0.50 }
    $calibration = if ($calibrationByOccupation.ContainsKey($occupation.occupation_id)) { $calibrationByOccupation[$occupation.occupation_id] } else { $null }
    if ($calibration) {
        $weightedDirectPressure = Clamp ($weightedDirectPressure + [double]$calibration.direct_pressure_bias) 0.0 1.0
        $retainedFunctionStrength = Clamp ($retainedFunctionStrength + [double]$calibration.function_retention_bias) 0.0 1.0
        $retainedAccountabilityStrength = Clamp ($retainedAccountabilityStrength + [double]$calibration.accountability_bias) 0.0 1.0
        $retainedBargainingPower = Clamp ($retainedBargainingPower + [double]$calibration.bargaining_bias) 0.0 1.0
        $delegationLikelihood = Clamp ($delegationLikelihood + [double]$calibration.delegation_bias) 0.0 1.0
        $headcountDisplacementRisk = Clamp ($headcountDisplacementRisk + [double]$calibration.displacement_bias) 0.0 1.0
        $benchmarkMeanValue = [Math]::Max($benchmarkMeanValue, [double]$calibration.benchmark_pressure_floor)
    }
    $thinCoveragePenalty = if ($roleProfile -and $roleProfile.coverage_gap_flag -eq 'true') { 0.08 } else { 0.0 }
    $confidence = Clamp (($weightedConfidence * 0.45) + (([double]$profile.source_confidence) * 0.25) + ($benchmarkMeanValue * 0.15) + ((1 - $thinCoveragePenalty) * 0.15)) 0.25 0.95

    $roleTransformationType = if ($headcountDisplacementRisk -ge 0.68 -and $retainedFunctionStrength -lt 0.45) {
        'substitution_pressure'
    } elseif ((($weightedDirectPressure -ge 0.55) -and ($retainedFunctionStrength -ge 0.58) -and ($delegationLikelihood -ge 0.55)) -or (($benchmarkMeanValue -ge 0.68) -and ($demandExpansionSignal -ge 0.65) -and ($retainedFunctionStrength -ge 0.58) -and ($retainedAccountabilityStrength -ge 0.55))) {
        'augmented_core_role'
    } elseif ($roleFragmentationRisk -ge 0.60 -and $roleCompressibility -ge 0.55) {
        'workflow_fragmentation'
    } elseif ($functionExposurePressure -ge 0.55 -and $retainedAccountabilityStrength -ge 0.60) {
        'delegated_but_retained_function'
    } elseif ((($weightedDirectPressure -lt 0.33) -and ($retainedFunctionStrength -ge 0.60) -and ($benchmarkMeanValue -lt 0.58)) -or (($retainedFunctionStrength -ge 0.78) -and ($retainedAccountabilityStrength -ge 0.80) -and ($headcountDisplacementRisk -lt 0.28)) -or (($retainedFunctionStrength -ge 0.72) -and ($retainedBargainingPower -ge 0.74) -and ($weightedDirectPressure -lt 0.32) -and ($headcountDisplacementRisk -lt 0.24))) {
        'limited_near_term_change'
    } elseif ($weightedDirectPressure -ge 0.35 -and $benchmarkMeanValue -ge 0.58 -and $retainedFunctionStrength -lt 0.70) {
        'workflow_recomposition'
    } else {
        'workflow_recomposition'
    }

    [void]$sourceMixSet.Add('src_role_function_seed_2026_03')
    [void]$sourceMixSet.Add('src_role_transformation_model_2026_03')
    if (@($functionMaps).Count -gt 1) {
        [void]$sourceMixSet.Add('src_role_function_expansion_2026_03')
    }
    if ($calibration) {
        [void]$sourceMixSet.Add('src_reviewed_role_calibration_2026_03')
    }
    $sourceMix = ($sourceMixSet | Sort-Object) -join '|'
    $calibrationNote = if ($calibration) { "|calibration=$($calibration.notes)" } else { '' }
    $functionNote = "|function_anchors=$(@($functionMaps).Count)"

    $results.Add([PSCustomObject]@{
        occupation_id = $occupation.occupation_id
        direct_task_pressure = Format-Decimal -Value $weightedDirectPressure -Digits 4
        indirect_dependency_pressure = Format-Decimal -Value $weightedIndirectPressure -Digits 4
        function_exposure_pressure = Format-Decimal -Value $functionExposurePressure -Digits 4
        retained_function_strength = Format-Decimal -Value $retainedFunctionStrength -Digits 4
        retained_accountability_strength = Format-Decimal -Value $retainedAccountabilityStrength -Digits 4
        retained_bargaining_power = Format-Decimal -Value $retainedBargainingPower -Digits 4
        role_fragmentation_risk = Format-Decimal -Value $roleFragmentationRisk -Digits 4
        role_compressibility = Format-Decimal -Value $roleCompressibility -Digits 4
        demand_expansion_signal = Format-Decimal -Value $demandExpansionSignal -Digits 4
        delegation_likelihood = Format-Decimal -Value $delegationLikelihood -Digits 4
        headcount_displacement_risk = Format-Decimal -Value $headcountDisplacementRisk -Digits 4
        role_transformation_type = $roleTransformationType
        confidence = Format-Decimal -Value $confidence -Digits 4
        source_mix = $sourceMix
        notes = ('guardrail={0}|support_high_pressure={1}|routine_high_pressure={2}|benchmark_mean={3}{4}{5}' -f (Format-Decimal -Value $guardrail -Digits 4), (Format-Decimal -Value $supportHighPressureShare -Digits 4), (Format-Decimal -Value $routineHighPressureShare -Digits 4), (Format-Decimal -Value $benchmarkMeanValue -Digits 4), $functionNote, $calibrationNote)
    })
}

$results |
    Sort-Object occupation_id |
    Export-Csv -Path (Join-Path $OutputDir 'occupation_role_transformation.csv') -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        occupation_rows = $results.Count
        high_displacement = ($results | Where-Object { [double]$_.headcount_displacement_risk -ge 0.65 }).Count
    }
}
