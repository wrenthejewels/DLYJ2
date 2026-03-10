# V2 Calibration Report

This report compares the live `v2_engine.js` output against the reviewed calibration set in `data/metadata/v2_reviewed_calibration_set.csv`.

## Summary

- calibration cases: `10`
- average score: `0.400`
- perfect-match cases: `0`
- partial-mismatch cases: `10`

## Metric pass rates

- `role_outlook`: `6` / `10`
- `primary_displacement_wave`: `0` / `0`
- `residual_role_strength`: `2` / `10`
- `personalization_fit`: `5` / `10`
- `top_exposed_cluster`: `10` / `10`
- `exposed_task_share`: `0` / `10`
- `workflow_compression`: `2` / `10`
- `substitution_gap`: `3` / `10`

## Case results

| Occupation | Score | Outlook | Wave | Top exposed | Compression | Gap | Notes |
| --- | ---: | --- | --- | --- | ---: | ---: | --- |
| Software Developers | 0.286 | role_fragments | current | cluster_drafting | 0.823 | 0.213 | reviewed_baseline_software |
| Operations Research Analysts | 0.429 | routine_tasks_absorbed | distant | cluster_analysis | 0.000 | 0.000 | reviewed_baseline_or_analyst |
| Management Analysts | 0.429 | role_becomes_more_senior | next | cluster_decision_support | 0.000 | 0.000 | reviewed_baseline_management_analyst |
| Market Research Analysts and Marketing Specialists | 0.429 | role_narrows_but_remains_viable | next | cluster_analysis | 0.103 | 0.055 | reviewed_baseline_market_research |
| Human Resources Specialists | 0.286 | role_becomes_more_senior | next | cluster_qa_review | 0.000 | 0.000 | reviewed_baseline_hr |
| Accountants and Auditors | 0.143 | role_narrows_but_remains_viable | next | cluster_qa_review | 0.170 | 0.092 | reviewed_baseline_accountants |
| Lawyers | 0.429 | role_becomes_more_senior | next | cluster_analysis | 0.000 | 0.000 | reviewed_baseline_lawyers |
| Writers and Authors | 0.571 | role_narrows_but_remains_viable | next | cluster_drafting | 0.107 | 0.052 | reviewed_baseline_writers |
| Project Management Specialists | 0.429 | role_becomes_more_senior | next | cluster_coordination | 0.000 | 0.000 | reviewed_baseline_project_management |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.571 | role_narrows_but_remains_viable | next | cluster_workflow_admin | 0.299 | 0.123 | reviewed_baseline_admin_assistant |

## Mismatch details

### Software Developers
- `role_outlook`: fail (role_fragments vs routine_tasks_absorbed | mostly_augmented)
- `residual_role_strength`: fail (weak vs moderate | strong)
- `personalization_fit`: fail (weak vs moderate | strong)
- `exposed_task_share`: fail (0.936 vs 0.45 to 0.8)
- `workflow_compression`: fail (0.823 vs 0.22 to 0.5)

### Operations Research Analysts
- `role_outlook`: fail (routine_tasks_absorbed vs role_becomes_more_senior | mostly_augmented)
- `exposed_task_share`: fail (0.532 vs 0.08 to 0.25)
- `workflow_compression`: fail (0 vs 0.01 to 0.08)
- `substitution_gap`: fail (0 vs 0.005 to 0.05)

### Management Analysts
- `residual_role_strength`: fail (weak vs strong)
- `exposed_task_share`: fail (0.527 vs 0.16 to 0.32)
- `workflow_compression`: fail (0 vs 0.04 to 0.14)
- `substitution_gap`: fail (0 vs 0.02 to 0.08)

### Market Research Analysts and Marketing Specialists
- `role_outlook`: fail (role_narrows_but_remains_viable vs mostly_augmented | routine_tasks_absorbed)
- `residual_role_strength`: fail (weak vs moderate | strong)
- `personalization_fit`: fail (weak vs moderate | strong)
- `exposed_task_share`: fail (0.864 vs 0.15 to 0.32)

### Human Resources Specialists
- `residual_role_strength`: fail (weak vs strong)
- `personalization_fit`: fail (weak vs moderate | strong)
- `exposed_task_share`: fail (0.604 vs 0.15 to 0.3)
- `workflow_compression`: fail (0 vs 0.04 to 0.15)
- `substitution_gap`: fail (0 vs 0.02 to 0.09)

### Accountants and Auditors
- `role_outlook`: fail (role_narrows_but_remains_viable vs role_becomes_more_senior | routine_tasks_absorbed)
- `residual_role_strength`: fail (weak vs strong | moderate)
- `personalization_fit`: fail (weak vs moderate | strong)
- `exposed_task_share`: fail (0.859 vs 0.1 to 0.26)
- `workflow_compression`: fail (0.17 vs 0.03 to 0.12)
- `substitution_gap`: fail (0.092 vs 0.015 to 0.08)

### Lawyers
- `residual_role_strength`: fail (moderate vs strong)
- `exposed_task_share`: fail (0.437 vs 0.15 to 0.35)
- `workflow_compression`: fail (0 vs 0.04 to 0.14)
- `substitution_gap`: fail (0 vs 0.02 to 0.09)

### Writers and Authors
- `residual_role_strength`: fail (weak vs moderate)
- `personalization_fit`: fail (weak vs moderate | strong)
- `exposed_task_share`: fail (0.871 vs 0.12 to 0.28)

### Project Management Specialists
- `residual_role_strength`: fail (weak vs strong)
- `exposed_task_share`: fail (0.664 vs 0.22 to 0.45)
- `workflow_compression`: fail (0 vs 0.08 to 0.2)
- `substitution_gap`: fail (0 vs 0.04 to 0.12)

### Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
- `exposed_task_share`: fail (0.885 vs 0.05 to 0.2)
- `workflow_compression`: fail (0.299 vs 0.015 to 0.08)
- `substitution_gap`: fail (0.123 vs 0.008 to 0.04)

