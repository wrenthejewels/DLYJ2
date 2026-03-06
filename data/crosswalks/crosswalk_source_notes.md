# Crosswalk Source Notes

## Principles

- Keep `occupation_id` and `onet_soc_code` as the internal canonical keys.
- Treat crosswalks to BLS, ISCO, or ESCO as lossy mappings.
- When a mapping is broad or ambiguous, lower `confidence` rather than forcing a precise match.

## Current state

- `crosswalk_onet_to_bls.csv` is expected to be high confidence for the initial US-first launch.
- `crosswalk_onet_to_isco.csv` is a placeholder stub and should not be treated as production quality yet.
