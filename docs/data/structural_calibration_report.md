# Structural Calibration Report

This report is the first empirical calibration scaffold for the live model.

It does not validate AI-driven job loss directly.
It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.

Generated from:
- `data/normalized/occupation_quality_indicators.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_quality_indicators.csv` still includes launch-stub quality rows, so guardrail calibration is only medium-confidence right now.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `34`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `medium`
- spearman correlation: `0.300`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares the model’s retained human/accountability guardrails to autonomy, social-interaction, and work-quality proxies.

### Demand Context Plausibility
- strength: `weak`
- spearman correlation: `0.861`
- high-priority mismatches: `2`
- medium-priority mismatches: `3`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- spearman correlation: `0.413`
- high-priority mismatches: `12`
- medium-priority mismatches: `5`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- spearman correlation: `0.540`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Specialization Resilience Plausibility
- strength: `medium`
- spearman correlation: `0.109`
- high-priority mismatches: `0`
- medium-priority mismatches: `5`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Demand gap | Wage leverage gap | Routine gap | Specialization gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | bargaining_power | weak | 0.033 (ok) | 0.088 (ok) | 0.526 (high) | 0.039 (ok) | 0.205 (medium) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.028 (ok) | 0.075 (ok) | 0.448 (high) | 0.207 (medium) | 0.159 (low) |
| Statistical Assistants | high | bargaining_power | weak | 0.104 (ok) | 0.129 (low) | 0.430 (high) | 0.068 (ok) | 0.025 (ok) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | task_pressure | medium | 0.032 (ok) | 0.046 (ok) | 0.342 (high) | 0.381 (medium) | 0.205 (medium) |
| Office Clerks, General | high | task_pressure | medium | 0.039 (ok) | 0.047 (ok) | 0.333 (high) | 0.365 (medium) | 0.182 (medium) |
| Data Scientists | high | bargaining_power | weak | 0.089 (ok) | 0.194 (medium) | 0.347 (high) | 0.170 (low) | 0.205 (medium) |
| Software Developers | high | bargaining_power | weak | 0.093 (ok) | 0.142 (low) | 0.343 (high) | 0.158 (low) | 0.207 (medium) |
| Advertising Sales Agents | high | demand_and_adoption | weak | 0.089 (ok) | 0.311 (high) | 0.226 (high) | 0.074 (ok) | 0.067 (ok) |
| Paralegals and Legal Assistants | high | bargaining_power | weak | 0.029 (ok) | 0.122 (low) | 0.265 (high) | 0.081 (ok) | 0.103 (ok) |
| Logisticians | high | demand_and_adoption | weak | 0.013 (ok) | 0.254 (high) | 0.096 (ok) | 0.019 (ok) | 0.031 (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| bargaining_power | 15 |
| demand_and_adoption | 7 |
| task_pressure | 5 |
| specialization_resilience | 4 |
| accountability_guardrails | 1 |

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
| Paralegals and Legal Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Logisticians | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| General and Operations Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Lawyers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.202 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | task_pressure | 0.186 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Graphic Designers | task_pressure | 0.126 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Executive Secretaries and Executive Administrative Assistants | task_pressure | 0.118 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Writers and Authors | task_pressure | 0.109 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Compliance Officers | specialization_resilience | 0.083 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Accountants and Auditors | specialization_resilience | 0.079 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Market Research Analysts and Marketing Specialists | specialization_resilience | 0.078 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Project Management Specialists | specialization_resilience | 0.076 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Business Operations Specialists, All Other | accountability_guardrails | 0.064 | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Business Operations Specialists, All Other | 0.584 | 0.737 | 0.153 | 0.420 | low |
| Project Management Specialists | 0.624 | 0.769 | 0.145 | 0.420 | low |
| Market Research Analysts and Marketing Specialists | 0.539 | 0.684 | 0.145 | 0.420 | low |
| Lawyers | 0.810 | 0.665 | 0.144 | 0.420 | low |
| General and Operations Managers | 0.636 | 0.769 | 0.133 | 0.420 | low |
| Graphic Designers | 0.504 | 0.635 | 0.131 | 0.420 | low |
| Writers and Authors | 0.523 | 0.635 | 0.113 | 0.420 | ok |
| Management Analysts | 0.626 | 0.737 | 0.111 | 0.420 | ok |

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

- Add `BLS ORS` for better human-constraint calibration.
- Add `ACS PUMS` for within-occupation heterogeneity and wage-structure calibration.
- Add `BTOS` AI adoption context for a stronger non-runtime adoption calibration layer.

