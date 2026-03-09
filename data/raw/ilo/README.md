# ILO Raw Inputs

Local raw files currently present:
- `how_might_genai_impact_occupations.html`
- `x3jzk_index.html`
- `x3jzk_v13.html`
- `x3jzk_dataset.csv`

Current use:
- the `x3jzk_dataset.csv` extract mirrors the occupation-level exposure chart embedded in the ILO article
- the raw files are retained for future benchmark work, but they are not yet normalized into the active benchmark contract

Important note:
- the current blocker is not raw access anymore; it is the weak occupation join path from the ILO chart labels into our O*NET-first launch occupations
- `crosswalk_onet_to_isco.csv` is still explicitly a placeholder, so ILO remains a pending benchmark layer rather than a validated normalized source
