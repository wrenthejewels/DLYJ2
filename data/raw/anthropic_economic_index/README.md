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
- the current `normalize_anthropic_ei.ps1` pipeline still consumes the root-level task-mapping extracts
- the `release_2026_01_15` raw package is now available locally for a future integration pass, but is not yet normalized into the active v2 outputs
