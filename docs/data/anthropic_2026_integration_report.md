# Anthropic 2026 Integration Report

This report compares the normalized Anthropic priors generated from the legacy `2025-03-27` extract against the normalized priors generated from the imported `2026-01-15` raw release.

## Coverage summary

- Legacy anthropic task evidence rows: `255`
- 2026 anthropic task evidence rows: `276`
- Legacy anthropic occupation-cluster priors: `135`
- 2026 anthropic occupation-cluster priors: `144`
- Legacy occupations covered: `32`
- 2026 occupations covered: `32`

## Mean delta across overlapping occupation-cluster priors

- Exposure delta: `0.053`
- Augmentation delta: `-0.181`
- Automation delta: `0.050`
- Confidence delta: `-0.139`

## Largest exposure shifts

| Occupation | Cluster | Legacy | 2026 | Delta |
| --- | --- | ---: | ---: | ---: |
| Technical Writers | Admin | 0.31 | 0.02 | -0.29 |
| General and Operations Managers | Coordination | 0.00 | 0.25 | 0.25 |
| Advertising Sales Agents | Coordination | 0.00 | 0.24 | 0.24 |
| Public Relations Specialists | Coordination | 0.00 | 0.24 | 0.24 |
| Compliance Officers | Research | 0.02 | 0.25 | 0.23 |
| Writers and Authors | Research | 0.00 | 0.23 | 0.23 |
| Training and Development Specialists | Relationships | 0.00 | 0.23 | 0.23 |
| Advertising Sales Agents | Relationships | 0.00 | 0.23 | 0.23 |
| Project Management Specialists | Relationships | 0.01 | 0.24 | 0.23 |
| Project Management Specialists | QA | 0.01 | 0.24 | 0.23 |
| Advertising Sales Agents | Decision | 0.03 | 0.25 | 0.22 |
| Customer Service Representatives | Coordination | 0.00 | 0.22 | 0.22 |

## Interpretation

- The `2026-01-15` integration uses direct task telemetry from Claude.ai and 1P API logs, aggregated into the existing O*NET-task and task-cluster pipeline.
- Collaboration labels are mapped directly into augmentation versus automation mode shares using the observed `directive`, `feedback loop`, `learning`, `task iteration`, and `validation` breakdowns.
- Additional task telemetry such as work-use share, human-only ability, AI autonomy, and task-success coverage now informs exposure scaling and evidence confidence.
