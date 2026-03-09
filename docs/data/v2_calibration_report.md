# V2 Calibration Report

This report compares the live `v2_engine.js` output against the reviewed calibration set in `data/metadata/v2_reviewed_calibration_set.csv`.

## Summary

- calibration cases: `10`
- average score: `1.000`
- perfect-match cases: `10`
- partial-mismatch cases: `0`

## Metric pass rates

- `role_outlook`: `10` / `10`
- `mode_of_change`: `10` / `10`
- `residual_role_strength`: `10` / `10`
- `personalization_fit`: `10` / `10`
- `top_exposed_cluster`: `10` / `10`
- `exposed_task_share`: `10` / `10`
- `workflow_compression`: `10` / `10`
- `substitution_gap`: `10` / `10`

## Case results

| Occupation | Score | Outlook | Mode | Top exposed | Compression | Gap | Notes |
| --- | ---: | --- | --- | --- | ---: | ---: | --- |
| Software Developers | 1.000 | routine_tasks_absorbed | mixed | cluster_drafting | 0.491 | 0.207 | reviewed_baseline_software |
| Operations Research Analysts | 1.000 | mostly_augmented | mostly_augmentation | cluster_analysis | 0.023 | 0.015 | reviewed_baseline_or_analyst |
| Management Analysts | 1.000 | role_becomes_more_senior | mostly_augmentation | cluster_decision_support | 0.076 | 0.045 | reviewed_baseline_management_analyst |
| Market Research Analysts and Marketing Specialists | 1.000 | mostly_augmented | mostly_augmentation | cluster_analysis | 0.087 | 0.048 | reviewed_baseline_market_research |
| Human Resources Specialists | 1.000 | role_becomes_more_senior | mixed | cluster_relationship_management | 0.073 | 0.043 | reviewed_baseline_hr |
| Accountants and Auditors | 1.000 | role_becomes_more_senior | mixed | cluster_decision_support | 0.069 | 0.038 | reviewed_baseline_accountants |
| Lawyers | 1.000 | role_becomes_more_senior | mostly_augmentation | cluster_research_synthesis | 0.066 | 0.042 | reviewed_baseline_lawyers |
| Writers and Authors | 1.000 | routine_tasks_absorbed | mixed | cluster_drafting | 0.102 | 0.051 | reviewed_baseline_writers |
| Project Management Specialists | 1.000 | role_becomes_more_senior | mostly_augmentation | cluster_coordination | 0.151 | 0.090 | reviewed_baseline_project_management |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 1.000 | routine_tasks_absorbed | mostly_automation | cluster_workflow_admin | 0.036 | 0.016 | reviewed_baseline_admin_assistant |
