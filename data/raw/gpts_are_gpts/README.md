# GPTs-are-GPTs Raw Inputs

Local raw files currently present:
- `README.upstream.md`
- `occ_level.csv`
- `automation_gpt4_human_labels.tsv`
- `autoScores.csv`
- `full_labelset.tsv`
- `full_onet_data.tsv`

Current use:
- `normalize_gpts_are_gpts.ps1` reads `occ_level.csv` for occupation-level GPT-4 and human ratings
- `normalize_gpts_are_gpts.ps1` reads `automation_gpt4_human_labels.tsv` for task-level GPT-4 and human automation labels
- `normalize_gpts_are_gpts.ps1` reads `autoScores.csv` for benchmark variables covering Webb AI/robot/software exposure and SML

Important note:
- this source is benchmark-only and is not used in public `2.0` runtime scoring
- the same repository also mirrors benchmark variables from older literature, so source-specific provenance is preserved in the normalized long benchmark table
