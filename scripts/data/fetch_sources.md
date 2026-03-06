# Fetch Sources Script Plan

Future fetch scripts should:
- download or copy approved source files into `data/raw/`
- preserve original filenames where practical
- write version info back into `data/metadata/source_registry.yaml`
- avoid transforming files during fetch

Suggested future script targets:
- `fetch_onet.ps1`
- `fetch_bls.ps1`
- `fetch_anthropic_ei.ps1`
