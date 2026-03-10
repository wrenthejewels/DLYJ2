# AIOE Raw Inputs

Local raw files currently present:
- `AIOE_DataAppendix.xlsx`
- `Language Modeling AIOE and AIIE.xlsx`

Current use:
- `normalize_aioe.ps1` reads the occupation-level `AIOE` appendix and the language-model-specific `LM AIOE` workbook
- `normalize_aioe.ps1` also reads `Appendix E` for ability-level exposure values
- the resulting normalized file is benchmark-only and is not used in public `2.0` scoring

Important note:
- this source is used only to validate the directional ranking of the live `O*NET + Anthropic + BLS` stack
- benchmark disagreements should trigger review, not automatic score replacement
