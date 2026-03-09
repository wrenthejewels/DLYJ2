# Benchmark Validation Report

This report compares the live `2.0` occupation exposure prior against the benchmark-only AIOE layer. The benchmark file is not used in public scoring; it is a validation reference only.

## Coverage summary

- Occupations with benchmark rows: `27`
- Occupations with classic AIOE percentile: `27`
- Occupations with language-model AIOE percentile: `27`
- Launch occupations without AIOE coverage: `Project Management Specialists; Computer Systems Analysts; Software Developers; Web Developers; Data Scientists; News Analysts, Reporters, and Journalists; Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel`

## Correlation against live exposure prior

- Composite benchmark percentile correlation: `-0.293`
- Classic AIOE percentile correlation: `-0.283`
- Language-model AIOE percentile correlation: `-0.266`
- Top-quartile overlap count: `1` of `7`

## Largest benchmark disagreements

| Occupation | Live exposure | Benchmark percentile | Delta | Classic AIOE | LM AIOE |
| --- | ---: | ---: | ---: | ---: | ---: |
| Management Analysts | 0.194 | 0.962 | -0.768 | 0.962 | 0.962 |
| Market Research Analysts and Marketing Specialists | 0.180 | 0.885 | -0.705 | 0.923 | 0.846 |
| Human Resources Specialists | 0.193 | 0.885 | -0.692 | 0.769 | 1.000 |
| Accountants and Auditors | 0.111 | 0.788 | -0.677 | 1.000 | 0.577 |
| Operations Research Analysts | 0.105 | 0.750 | -0.645 | 0.885 | 0.615 |
| Financial and Investment Analysts | 0.111 | 0.750 | -0.639 | 0.808 | 0.692 |
| Public Relations Specialists | 0.217 | 0.769 | -0.552 | 0.615 | 0.923 |
| Lawyers | 0.267 | 0.808 | -0.541 | 0.731 | 0.885 |
| Training and Development Specialists | 0.133 | 0.673 | -0.540 | 0.577 | 0.769 |
| Paralegals and Legal Assistants | 0.266 | 0.731 | -0.465 | 0.654 | 0.808 |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.077 | 0.538 | -0.461 | 0.423 | 0.654 |
| Technical Writers | 0.174 | 0.635 | -0.461 | 0.538 | 0.731 |

## Notes

- The benchmark layer is derived from direct SOC-to-SOC matches against the AIOE repository workbooks, so it avoids the weaker O*NET-to-ISCO bridge required for ILO.
- Higher disagreement does not imply the benchmark is better; it flags occupations for closer review of task mapping, source coverage, or model interpretation.
- `ILO` remains pending because the accessible occupational data path is still weaker than the AIOE path and the current `crosswalk_onet_to_isco.csv` is explicitly a placeholder.
