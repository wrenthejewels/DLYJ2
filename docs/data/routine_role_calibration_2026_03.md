# Routine Role Calibration

Calibration batch: `routine_contrast_2026_03`

This pass extends reviewed role-transformation calibration to the routine-heavy contrast roles:
- Bookkeeping, Accounting, and Auditing Clerks
- Office Clerks, General
- Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
- Executive Secretaries and Executive Administrative Assistants

The machine-readable overrides live in `data/metadata/pilot_role_transformation_calibration.csv`.

## Calibration intent

This pass creates the counterweight to the function-heavy pilot roles.

The reviewed adjustments are meant to:
- push routine bookkeeping and clerical work toward stronger compression and displacement pressure
- preserve some coordination value for general administrative support while still raising compression
- keep executive assistants as the higher-context admin contrast rather than collapsing them into the same pattern as general clerical work

## Expected effects

- `Bookkeeping Clerks` should remain `workflow_recomposition` but with higher direct pressure and displacement risk.
- `Office Clerks` should look highly compressible relative to the rest of the launch set.
- `Secretaries/Admin Assistants` should remain under stronger recomposition pressure than executive assistants.
- `Executive Assistants` should still show recomposition, but with stronger retained function, trust, and bargaining than the generic admin roles.
