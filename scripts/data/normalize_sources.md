# Normalize Sources Script Plan

Future normalization scripts should:
- read from `data/raw/`
- write only to `data/normalized/` and `data/crosswalks/`
- preserve `occupation_id`, `task_cluster_id`, and `source_id`
- run validation after writing outputs

Suggested future script targets:
- `seed_launch_stubs.ps1`
- `normalize_onet.ps1`
- `normalize_bls.ps1`
- `normalize_manning_aguirre.ps1`
- `normalize_anthropic_ei.ps1`
- `infer_task_clusters.ps1`
- `build_selector_index.ps1`
- `validate_normalized_data.ps1`
