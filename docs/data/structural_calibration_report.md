# Structural Calibration Report

This report is the first empirical calibration scaffold for the live model.

It does not validate AI-driven job loss directly.
It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.

Generated from:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_heterogeneity_context.csv`
- `data/normalized/industry_ai_adoption_context.csv`
- `data/normalized/occupation_btos_sector_mix.csv`
- `data/normalized/occupation_quality_indicators.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.
- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.
- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.
- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.
- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.
- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `34`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `23/34`
- spearman correlation: `0.792`
- high-priority mismatches: `5`
- medium-priority mismatches: `7`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `32/34`
- spearman correlation: `0.191`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

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
- spearman correlation: `0.614`
- high-priority mismatches: `10`
- medium-priority mismatches: `5`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.610`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.355`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.435`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Specialization gap | Heterogeneity gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | bargaining_power | weak | 0.081 (ok) | 0.154 (low) | 0.088 (ok) | 0.485 (high) | 0.041 (ok) | 0.191 (medium) | 0.041 (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.038 (ok) | 0.129 (low) | 0.446 (high) | 0.071 (ok) | 0.020 (ok) | 0.153 (low) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.229 (high) | 0.151 (low) | 0.075 (ok) | 0.436 (high) | 0.195 (medium) | 0.153 (low) | 0.174 (low) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | task_pressure | medium | 0.204 (medium) | 0.159 (low) | 0.046 (ok) | 0.290 (high) | 0.357 (medium) | 0.185 (medium) | 0.088 (ok) |
| Office Clerks, General | high | task_pressure | medium | 0.168 (low) | 0.176 (low) | 0.047 (ok) | 0.257 (high) | 0.340 (medium) | 0.153 (low) | 0.099 (ok) |
| Advertising Sales Agents | high | demand_and_adoption | weak | n/a (ok) | 0.067 (ok) | 0.311 (high) | 0.223 (high) | 0.074 (ok) | 0.066 (ok) | 0.106 (ok) |
| Data Scientists | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.194 (medium) | 0.287 (high) | 0.170 (low) | 0.184 (medium) | 0.105 (ok) |
| Paralegals and Legal Assistants | high | accountability_guardrails | strong | 0.262 (high) | 0.002 (ok) | 0.122 (low) | 0.216 (medium) | 0.069 (ok) | 0.062 (ok) | 0.019 (ok) |
| Computer Systems Analysts | high | accountability_guardrails | strong | 0.261 (high) | 0.087 (ok) | 0.168 (low) | 0.209 (medium) | 0.028 (ok) | 0.024 (ok) | 0.088 (ok) |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | high | accountability_guardrails | strong | 0.256 (high) | 0.004 (ok) | 0.054 (ok) | 0.145 (low) | 0.032 (ok) | 0.213 (low) | 0.063 (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 14 |
| role_shape_heterogeneity | 8 |
| bargaining_power | 5 |
| task_pressure | 3 |
| demand_and_adoption | 2 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Customer Service Representatives | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Advertising Sales Agents | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| Data Scientists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Paralegals and Legal Assistants | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Software Developers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Lawyers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.189 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | task_pressure | 0.173 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Editors | role_shape_heterogeneity | 0.159 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Management Analysts | role_shape_heterogeneity | 0.142 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Operations Research Analysts | role_shape_heterogeneity | 0.140 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Accountants and Auditors | role_shape_heterogeneity | 0.140 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Market Research Analysts and Marketing Specialists | role_shape_heterogeneity | 0.130 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Web Developers | role_shape_heterogeneity | 0.116 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Writers and Authors | task_pressure | 0.110 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| News Analysts, Reporters, and Journalists | role_shape_heterogeneity | 0.110 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Paralegals and Legal Assistants | 0.592 | 0.330 | 0.262 | 0.763 | high |
| Computer Systems Analysts | 0.589 | 0.328 | 0.261 | 0.721 | high |
| Mechanical Engineers | 0.618 | 0.359 | 0.259 | 0.636 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.629 | 0.373 | 0.256 | 0.763 | high |
| Lawyers | 0.826 | 0.571 | 0.255 | 0.763 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.652 | 0.423 | 0.229 | 0.806 | high |
| Financial and Investment Analysts | 0.594 | 0.381 | 0.213 | 0.678 | medium |
| Graphic Designers | 0.521 | 0.316 | 0.205 | 0.678 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.444 | 0.268 | 0.176 | 0.822 | low |
| Mechanical Engineers | 0.404 | 0.240 | 0.164 | 0.879 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.434 | 0.275 | 0.159 | 0.850 | low |
| Customer Service Representatives | 0.408 | 0.254 | 0.154 | 0.872 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.440 | 0.290 | 0.151 | 0.864 | low |
| General and Operations Managers | 0.387 | 0.247 | 0.140 | 0.869 | low |
| Training and Development Specialists | 0.415 | 0.283 | 0.133 | 0.832 | low |
| Business Operations Specialists, All Other | 0.429 | 0.304 | 0.125 | 0.838 | low |

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
| Customer Service Representatives | 0.485 | 0.000 | 0.485 | 0.850 | high |
| Statistical Assistants | 0.544 | 0.098 | 0.446 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.527 | 0.091 | 0.436 | 0.850 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.366 | 0.076 | 0.290 | 0.850 | high |
| Data Scientists | 0.592 | 0.879 | 0.287 | 0.850 | high |
| Office Clerks, General | 0.318 | 0.061 | 0.257 | 0.850 | high |
| Software Developers | 0.540 | 0.795 | 0.255 | 0.850 | high |
| Graphic Designers | 0.500 | 0.265 | 0.235 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.364 | 0.721 | 0.357 | 0.530 | medium |
| Office Clerks, General | 0.397 | 0.738 | 0.340 | 0.510 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.391 | 0.586 | 0.195 | 0.590 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.398 | 0.585 | 0.187 | 0.610 | medium |
| Graphic Designers | 0.378 | 0.205 | 0.173 | 0.740 | low |
| Data Scientists | 0.389 | 0.219 | 0.170 | 0.520 | low |
| Software Developers | 0.408 | 0.253 | 0.155 | 0.600 | low |
| Writers and Authors | 0.319 | 0.171 | 0.149 | 0.740 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.618 | 0.405 | 0.213 | 0.360 | low |
| Software Developers | 0.547 | 0.738 | 0.191 | 0.600 | medium |
| Customer Service Representatives | 0.545 | 0.354 | 0.191 | 0.590 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.459 | 0.274 | 0.185 | 0.530 | medium |
| Data Scientists | 0.591 | 0.775 | 0.184 | 0.520 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.585 | 0.432 | 0.153 | 0.590 | low |
| Office Clerks, General | 0.437 | 0.284 | 0.153 | 0.510 | low |
| Graphic Designers | 0.524 | 0.659 | 0.135 | 0.740 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.190 | 0.386 | 0.196 | 0.810 | medium |
| Accountants and Auditors | 0.203 | 0.380 | 0.177 | 0.792 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.207 | 0.381 | 0.174 | 0.824 | low |
| Operations Research Analysts | 0.194 | 0.363 | 0.169 | 0.827 | low |
| Management Analysts | 0.179 | 0.340 | 0.161 | 0.880 | low |
| Market Research Analysts and Marketing Specialists | 0.238 | 0.392 | 0.154 | 0.845 | low |
| Statistical Assistants | 0.232 | 0.385 | 0.153 | 0.790 | low |
| Compliance Officers | 0.177 | 0.328 | 0.151 | 0.845 | low |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.
- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.
- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.
- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.

