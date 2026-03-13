# Structural Calibration Report

This report is the first empirical calibration scaffold for the live model.

It does not validate AI-driven job loss directly.
It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.

Generated from:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_quality_indicators.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.
- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `34`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `23/34`
- spearman correlation: `0.494`
- high-priority mismatches: `5`
- medium-priority mismatches: `7`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Demand Context Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.861`
- high-priority mismatches: `2`
- medium-priority mismatches: `3`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.413`
- high-priority mismatches: `12`
- medium-priority mismatches: `5`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.540`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.109`
- high-priority mismatches: `0`
- medium-priority mismatches: `5`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Demand gap | Wage leverage gap | Routine gap | Specialization gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | bargaining_power | weak | 0.073 (ok) | 0.088 (ok) | 0.526 (high) | 0.039 (ok) | 0.205 (medium) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.218 (medium) | 0.075 (ok) | 0.448 (high) | 0.207 (medium) | 0.159 (low) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.129 (low) | 0.430 (high) | 0.068 (ok) | 0.025 (ok) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | task_pressure | medium | 0.217 (medium) | 0.046 (ok) | 0.342 (high) | 0.381 (medium) | 0.205 (medium) |
| Office Clerks, General | high | task_pressure | medium | 0.181 (medium) | 0.047 (ok) | 0.333 (high) | 0.365 (medium) | 0.182 (medium) |
| Data Scientists | high | bargaining_power | weak | n/a (ok) | 0.194 (medium) | 0.347 (high) | 0.170 (low) | 0.205 (medium) |
| Software Developers | high | bargaining_power | weak | 0.164 (low) | 0.142 (low) | 0.343 (high) | 0.158 (low) | 0.207 (medium) |
| Advertising Sales Agents | high | demand_and_adoption | weak | n/a (ok) | 0.311 (high) | 0.226 (high) | 0.074 (ok) | 0.067 (ok) |
| Paralegals and Legal Assistants | high | accountability_guardrails | strong | 0.306 (high) | 0.122 (low) | 0.265 (high) | 0.081 (ok) | 0.103 (ok) |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | high | accountability_guardrails | strong | 0.278 (high) | 0.054 (ok) | 0.218 (medium) | 0.029 (ok) | 0.260 (low) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 14 |
| bargaining_power | 8 |
| demand_and_adoption | 5 |
| task_pressure | 3 |
| specialization_resilience | 2 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Customer Service Representatives | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Data Scientists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Software Developers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Advertising Sales Agents | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| Paralegals and Legal Assistants | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| General and Operations Managers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.202 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | task_pressure | 0.186 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Writers and Authors | task_pressure | 0.109 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Market Research Analysts and Marketing Specialists | specialization_resilience | 0.078 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Project Management Specialists | specialization_resilience | 0.076 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Paralegals and Legal Assistants | 0.636 | 0.330 | 0.306 | 0.763 | high |
| Mechanical Engineers | 0.660 | 0.359 | 0.301 | 0.636 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.651 | 0.373 | 0.278 | 0.763 | high |
| Financial and Investment Analysts | 0.658 | 0.381 | 0.277 | 0.678 | medium |
| General and Operations Managers | 0.636 | 0.893 | 0.257 | 0.763 | high |
| Computer Systems Analysts | 0.583 | 0.328 | 0.255 | 0.721 | high |
| Lawyers | 0.810 | 0.571 | 0.239 | 0.763 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.641 | 0.423 | 0.218 | 0.806 | medium |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.443 | 0.132 | 0.311 | 0.850 | high |
| Logisticians | 0.564 | 0.818 | 0.254 | 0.850 | high |
| Operations Research Analysts | 0.627 | 0.823 | 0.196 | 0.850 | medium |
| Data Scientists | 0.700 | 0.894 | 0.194 | 0.850 | medium |
| Training and Development Specialists | 0.540 | 0.728 | 0.188 | 0.850 | medium |
| Mechanical Engineers | 0.504 | 0.673 | 0.169 | 0.850 | low |
| Computer Systems Analysts | 0.484 | 0.652 | 0.168 | 0.850 | low |
| Management Analysts | 0.582 | 0.737 | 0.155 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.526 | 0.000 | 0.526 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.539 | 0.091 | 0.448 | 0.850 | high |
| Statistical Assistants | 0.528 | 0.098 | 0.430 | 0.850 | high |
| Data Scientists | 0.532 | 0.879 | 0.347 | 0.850 | high |
| Software Developers | 0.452 | 0.795 | 0.343 | 0.850 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.418 | 0.076 | 0.342 | 0.850 | high |
| Office Clerks, General | 0.394 | 0.061 | 0.333 | 0.850 | high |
| Paralegals and Legal Assistants | 0.462 | 0.197 | 0.265 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.341 | 0.721 | 0.381 | 0.530 | medium |
| Office Clerks, General | 0.372 | 0.738 | 0.365 | 0.510 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.379 | 0.586 | 0.207 | 0.590 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.392 | 0.585 | 0.193 | 0.610 | medium |
| Data Scientists | 0.389 | 0.219 | 0.170 | 0.520 | low |
| Graphic Designers | 0.376 | 0.205 | 0.170 | 0.740 | low |
| Software Developers | 0.410 | 0.253 | 0.158 | 0.600 | low |
| Writers and Authors | 0.318 | 0.171 | 0.147 | 0.740 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.665 | 0.405 | 0.260 | 0.360 | low |
| Software Developers | 0.530 | 0.738 | 0.207 | 0.600 | medium |
| Data Scientists | 0.570 | 0.775 | 0.205 | 0.520 | medium |
| Customer Service Representatives | 0.560 | 0.354 | 0.205 | 0.590 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.479 | 0.274 | 0.205 | 0.530 | medium |
| Office Clerks, General | 0.467 | 0.284 | 0.182 | 0.510 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.590 | 0.432 | 0.159 | 0.590 | low |
| Accountants and Auditors | 0.638 | 0.480 | 0.158 | 0.500 | low |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Add `ACS PUMS` for within-occupation heterogeneity and wage-structure calibration.
- Add `BTOS` AI adoption context for a stronger non-runtime adoption calibration layer.

