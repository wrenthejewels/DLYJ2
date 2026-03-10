# Benchmark Disagreement Diagnostics

This report classifies the largest benchmark-bundle disagreements into likely evidence-gap versus conceptual-gap buckets. It is intended to drive review work, not to auto-update public scoring.

## Driver summary

- `conceptual_gap_review`: `7` occupations
- `low_confidence_review`: `6` occupations
- `legacy_fallback_gap`: `2` occupations

## Largest reviewed disagreements

| Occupation | Delta | 2026 share | Legacy share | Stub share | Task conf. | Driver |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | -0.610 | 0.89 | 0.08 | 0.02 | 0.33 | low_confidence_review |
| Web Developers | -0.607 | 0.91 | 0.00 | 0.09 | 0.63 | conceptual_gap_review |
| News Analysts, Reporters, and Journalists | -0.577 | 0.89 | 0.00 | 0.04 | 0.61 | conceptual_gap_review |
| Market Research Analysts and Marketing Specialists | -0.512 | 0.67 | 0.00 | 0.23 | 0.48 | conceptual_gap_review |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | -0.510 | 0.80 | 0.00 | 0.00 | 0.02 | low_confidence_review |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | -0.488 | 0.89 | 0.11 | 0.00 | 0.32 | legacy_fallback_gap |
| Statistical Assistants | -0.461 | 0.83 | 0.00 | 0.17 | 0.56 | conceptual_gap_review |
| Technical Writers | -0.446 | 0.99 | 0.00 | 0.01 | 0.52 | conceptual_gap_review |
| Financial and Investment Analysts | -0.444 | 0.96 | 0.00 | 0.00 | 0.46 | conceptual_gap_review |
| Executive Secretaries and Executive Administrative Assistants | -0.401 | 0.57 | 0.21 | 0.10 | 0.47 | legacy_fallback_gap |
| Accountants and Auditors | -0.399 | 0.65 | 0.00 | 0.26 | 0.28 | low_confidence_review |
| Logisticians | -0.380 | 0.62 | 0.05 | 0.12 | 0.30 | low_confidence_review |
| Bookkeeping, Accounting, and Auditing Clerks | -0.371 | 0.99 | 0.00 | 0.00 | 0.39 | low_confidence_review |
| Management Analysts | -0.359 | 0.60 | 0.00 | 0.00 | 0.65 | conceptual_gap_review |
| Customer Service Representatives | -0.352 | 0.81 | 0.00 | 0.01 | 0.43 | low_confidence_review |

## Review notes

### Operations Research Analysts
- Driver: `low_confidence_review`
- Flags: `low_confidence, benchmark_higher_than_live`
- Top clusters: `Analysis (0.38, anthropic_2026); QA (0.24, anthropic_2026); Decision (0.19, anthropic_2026)`
- Recommended action: `review task-cluster mapping and confidence calibration before trusting the disagreement`

### Web Developers
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Drafting (0.59, anthropic_2026); Strategy (0.16, anthropic_2026); QA (0.09, stub)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### News Analysts, Reporters, and Journalists
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Drafting (0.25, anthropic_2026); Docs (0.22, anthropic_2026); Coordination (0.14, anthropic_2026)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### Market Research Analysts and Marketing Specialists
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Research (0.31, anthropic_2026); QA (0.23, stub); Analysis (0.22, anthropic_2026)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel
- Driver: `low_confidence_review`
- Flags: `low_confidence, benchmark_higher_than_live`
- Top clusters: `Client (0.47, anthropic_2026); Relationships (0.33, anthropic_2026)`
- Recommended action: `review task-cluster mapping and confidence calibration before trusting the disagreement`

### Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
- Driver: `legacy_fallback_gap`
- Flags: `legacy_fallback, low_confidence, benchmark_higher_than_live`
- Top clusters: `Admin (0.40, anthropic_2026); Routine (0.16, anthropic_2026); Docs (0.13, anthropic_2026)`
- Recommended action: `expand Anthropic 2026 task mapping for this occupation before changing score logic`

### Statistical Assistants
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Analysis (0.60, anthropic_2026); QA (0.17, stub); Admin (0.10, anthropic_2026)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### Technical Writers
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Drafting (0.59, anthropic_2026); Docs (0.17, anthropic_2026); QA (0.13, anthropic_2026)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### Financial and Investment Analysts
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Analysis (0.50, anthropic_2026); Client (0.23, anthropic_2026); Drafting (0.12, anthropic_2026)`
- Recommended action: `perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected`

### Executive Secretaries and Executive Administrative Assistants
- Driver: `legacy_fallback_gap`
- Flags: `legacy_fallback, benchmark_higher_than_live`
- Top clusters: `Admin (0.26, anthropic_2026); Strategy (0.21, anthropic_2025); Docs (0.20, anthropic_2026)`
- Recommended action: `expand Anthropic 2026 task mapping for this occupation before changing score logic`

