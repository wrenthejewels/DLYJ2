# Anthropic Economic Index Raw Inputs

Local raw files currently present:
- `task_pct_v2.csv`
- `automation_vs_augmentation_by_task.csv`
- `automation_vs_augmentation.csv`
- `onet_task_statements.csv`
- `soc_structure.csv`

Imported release snapshot:
- `release_2026_01_15/data_documentation.md`
- `release_2026_01_15/aei_v4_appendix.pdf`
- `release_2026_01_15/data/intermediate/aei_raw_1p_api_2025-11-13_to_2025-11-20.csv`
- `release_2026_01_15/data/intermediate/aei_raw_claude_ai_2025-11-13_to_2025-11-20.csv`

Important note:
- the active `normalize_anthropic_ei.ps1` pipeline now prefers the `release_2026_01_15` raw package and aggregates Claude.ai plus 1P API O*NET-task telemetry into the live v2 outputs
- the root-level `2025-03-27` task-mapping extracts are retained as a fallback supporting layer for any remaining unmatched task rows
