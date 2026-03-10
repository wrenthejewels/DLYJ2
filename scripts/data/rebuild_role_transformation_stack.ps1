param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [switch]$Validate
)

$ErrorActionPreference = 'Stop'

$scripts = @(
    'build_job_description_evidence.ps1',
    'build_task_role_graph.ps1',
    'build_source_comparison_layer.ps1',
    'build_role_function_layer.ps1',
    'build_role_transformation_scores.ps1'
)

foreach ($scriptName in $scripts) {
    $scriptPath = Join-Path $PSScriptRoot $scriptName
    & $scriptPath -Root $Root | Out-Null
}

if ($Validate) {
    & (Join-Path $PSScriptRoot 'validate_normalized_data.ps1') -Root $Root
}
