# Second Role Transformation Calibration

Calibration batch: `second_tranche_2026_03`

This pass extends reviewed role-transformation calibration to the next five launch occupations:
- Project Management Specialists
- Business Operations Specialists, All Other
- Customer Service Representatives
- Accountants and Auditors
- Paralegals and Legal Assistants

The machine-readable overrides live in `data/metadata/pilot_role_transformation_calibration.csv`.

## Calibration intent

The reviewed adjustments are meant to:
- preserve stronger human ownership, escalation handling, and client-facing coordination for project management work
- preserve follow-through and judgment for broad business operations work even when workflow automation rises
- increase compressibility pressure for customer support relative to function-heavy occupations
- preserve more residual control and judgment value for accounting than for generic clerical support
- place paralegals under stronger recomposition pressure than attorneys while still recognizing supervision and legal-process coordination

## Expected effects

- `Project Management Specialists` should retain more function and accountability than a pure workflow-admin reading would imply.
- `Business Operations Specialists` should remain recomposing, but with less default-looking function loss.
- `Customer Service Representatives` should stay in recomposition with stronger direct pressure and displacement risk than the function-heavy reviewed roles.
- `Accountants and Auditors` should retain more accountability and residual role value than generic support-finance roles.
- `Paralegals and Legal Assistants` should show stronger recomposition pressure than lawyers without collapsing into the same pattern as clerical support.
