# Benchmark Validation Report

This report compares the live `2.0` occupation exposure prior against the benchmark-only benchmark bundle. The benchmark file is not used in public scoring; it is a validation reference only.

## Coverage summary

- Occupations with benchmark rows: `34`
- Occupations with classic AIOE percentile: `27`
- Occupations with language-model AIOE percentile: `27`
- Occupations with Webb AI percentile: `27`
- Occupations with SML percentile: `27`
- Occupations with GPTs beta percentile: `33`

## Correlation against live exposure prior

- Composite benchmark percentile correlation: `-0.020`
- Classic AIOE percentile correlation: `-0.283`
- Language-model AIOE percentile correlation: `-0.266`
- Webb AI percentile correlation: `0.071`
- SML percentile correlation: `-0.338`
- GPTs beta percentile correlation: `0.216`
- Top-quartile overlap count: `2` of `9`

## Largest benchmark disagreements

| Occupation | Live exposure | Benchmark percentile | Delta | AIOE | Webb AI | SML | GPTs beta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Operations Research Analysts | 0.105 | 0.715 | -0.610 | 0.885 | 0.923 | 0.692 | 0.531 |
| Web Developers | 0.284 | 0.891 | -0.607 | na | na | na | 1.000 |
| News Analysts, Reporters, and Journalists | 0.157 | 0.734 | -0.577 | na | na | na | 0.719 |
| Market Research Analysts and Marketing Specialists | 0.180 | 0.692 | -0.512 | 0.923 | 1.000 | 0.577 | 0.156 |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.006 | 0.516 | -0.510 | na | na | na | 0.562 |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.077 | 0.565 | -0.488 | 0.423 | 0.038 | 1.000 | 0.594 |
| Statistical Assistants | 0.227 | 0.688 | -0.461 | 0.846 | 0.577 | 0.808 | 0.969 |
| Technical Writers | 0.174 | 0.620 | -0.446 | 0.538 | 0.808 | 0.385 | 0.781 |
| Financial and Investment Analysts | 0.111 | 0.555 | -0.444 | 0.808 | 0.846 | 0.731 | 0.094 |
| Executive Secretaries and Executive Administrative Assistants | 0.182 | 0.583 | -0.401 | 0.385 | 0.000 | 0.923 | 0.688 |
| Accountants and Auditors | 0.111 | 0.510 | -0.399 | 1.000 | 0.500 | 0.654 | 0.375 |
| Logisticians | 0.141 | 0.521 | -0.380 | 0.692 | 0.885 | 0.423 | 0.219 |

## Notes

- The benchmark bundle now combines direct AIOE workbooks with mirrored GPTs-are-GPTs occupation/task files and the Webb/SML benchmark variables exposed in the OpenAI autoScores extract.
- Higher disagreement does not imply the benchmark is better; it flags occupations for closer review of task mapping, source coverage, or model interpretation.
- `ILO` remains pending because the accessible occupational data path is still weaker than the AIOE path and the current `crosswalk_onet_to_isco.csv` is explicitly a placeholder.
