# Pilot Role Transformation Calibration

Calibration batch: `pilot_2026_03`

This pass applies explicit reviewed calibration adjustments to the five occupations that already received real public job-description review:
- Lawyers
- Data Scientists
- Management Analysts
- Technical Writers
- Sales Representatives

The machine-readable override file is `data/metadata/pilot_role_transformation_calibration.csv`.

## Calibration intent

The adjustments are not meant to replace the model.

They are meant to correct for specific reviewed mismatches that remained after the first job-description pass:
- `Lawyers`: preserve stronger legal authority and accountability guardrails.
- `Data Scientists`: reflect high exposure with stronger retained framing, evaluation, and ownership of model outcomes.
- `Management Analysts`: preserve problem-framing and adoption work as residual core value.
- `Technical Writers`: recognize that benchmark exposure still implies more workflow recomposition than the first-pass labels showed.
- `Sales Representatives`: preserve relationship, coordination, and commercial commitment work.

## Expected effects

- `Lawyers` should remain function-retaining and low-displacement.
- `Data Scientists` should move toward `augmented_core_role` rather than looking like generic recomposition pressure.
- `Management Analysts` should keep strong retained-function and low displacement.
- `Technical Writers` should lean more clearly toward `workflow_recomposition`.
- `Sales Representatives` should retain strong bargaining and low displacement.
