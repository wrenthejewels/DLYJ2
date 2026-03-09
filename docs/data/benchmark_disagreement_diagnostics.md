# Benchmark Disagreement Diagnostics

This report classifies the largest AIOE benchmark disagreements into likely evidence-gap versus conceptual-gap buckets. It is intended to drive review work, not to auto-update public scoring.

## Driver summary

- `conceptual_gap_review`: `6` occupations
- `low_confidence_review`: `4` occupations
- `legacy_fallback_gap`: `2` occupations
- `stub_dependency`: `1` occupations

## Largest reviewed disagreements

| Occupation | Delta | 2026 share | Legacy share | Stub share | Task conf. | Driver |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Management Analysts | -0.768 | 0.60 | 0.00 | 0.00 | 0.65 | conceptual_gap_review |
| Market Research Analysts and Marketing Specialists | -0.705 | 0.67 | 0.00 | 0.23 | 0.48 | conceptual_gap_review |
| Human Resources Specialists | -0.692 | 0.65 | 0.04 | 0.09 | 0.47 | conceptual_gap_review |
| Accountants and Auditors | -0.678 | 0.65 | 0.00 | 0.26 | 0.28 | low_confidence_review |
| Operations Research Analysts | -0.645 | 0.89 | 0.08 | 0.02 | 0.33 | low_confidence_review |
| Financial and Investment Analysts | -0.639 | 0.96 | 0.00 | 0.00 | 0.46 | conceptual_gap_review |
| Public Relations Specialists | -0.552 | 0.86 | 0.11 | 0.04 | 0.69 | legacy_fallback_gap |
| Lawyers | -0.541 | 0.55 | 0.00 | 0.35 | 0.49 | stub_dependency |
| Training and Development Specialists | -0.540 | 0.81 | 0.09 | 0.07 | 0.35 | low_confidence_review |
| Paralegals and Legal Assistants | -0.465 | 0.47 | 0.00 | 0.31 | 0.45 | conceptual_gap_review |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | -0.462 | 0.89 | 0.11 | 0.00 | 0.32 | legacy_fallback_gap |
| Technical Writers | -0.461 | 0.99 | 0.00 | 0.01 | 0.52 | conceptual_gap_review |
| Logisticians | -0.398 | 0.63 | 0.05 | 0.12 | 0.30 | low_confidence_review |

## Review notes

### Management Analysts
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Decision (0.34, anthropic_2026); Analysis (0.13, anthropic_2026); Coordination (0.13, anthropic_2026)`
- Recommended action: `perform manual concept review against AIOE and confirm whether the mismatch is expected`

### Market Research Analysts and Marketing Specialists
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Research (0.31, anthropic_2026); QA (0.23, stub); Analysis (0.22, anthropic_2026)`
- Recommended action: `perform manual concept review against AIOE and confirm whether the mismatch is expected`

### Human Resources Specialists
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `QA (0.21, anthropic_2026); Decision (0.19, anthropic_2026); Relationships (0.17, anthropic_2026)`
- Recommended action: `perform manual concept review against AIOE and confirm whether the mismatch is expected`

### Accountants and Auditors
- Driver: `low_confidence_review`
- Flags: `low_confidence, benchmark_higher_than_live`
- Top clusters: `QA (0.34, anthropic_2026); Analysis (0.15, anthropic_2026); Decision (0.13, stub)`
- Recommended action: `review task-cluster mapping and confidence calibration before trusting the disagreement`

### Operations Research Analysts
- Driver: `low_confidence_review`
- Flags: `low_confidence, benchmark_higher_than_live`
- Top clusters: `Analysis (0.38, anthropic_2026); QA (0.24, anthropic_2026); Decision (0.19, anthropic_2026)`
- Recommended action: `review task-cluster mapping and confidence calibration before trusting the disagreement`

### Financial and Investment Analysts
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Analysis (0.50, anthropic_2026); Client (0.23, anthropic_2026); Drafting (0.12, anthropic_2026)`
- Recommended action: `perform manual concept review against AIOE and confirm whether the mismatch is expected`

### Public Relations Specialists
- Driver: `legacy_fallback_gap`
- Flags: `legacy_fallback, benchmark_higher_than_live`
- Top clusters: `Drafting (0.41, anthropic_2026); Client (0.33, anthropic_2026); Routine (0.11, anthropic_2025)`
- Recommended action: `expand Anthropic 2026 task mapping for this occupation before changing score logic`

### Lawyers
- Driver: `stub_dependency`
- Flags: `stub_heavy, benchmark_higher_than_live`
- Top clusters: `Client (0.25, anthropic_2026); Analysis (0.22, anthropic_2026); Research (0.16, stub)`
- Recommended action: `replace stub-heavy clusters with direct Anthropic or stronger O*NET-derived evidence`

### Training and Development Specialists
- Driver: `low_confidence_review`
- Flags: `low_confidence, benchmark_higher_than_live`
- Top clusters: `Client (0.31, anthropic_2026); Drafting (0.23, anthropic_2026); Analysis (0.19, anthropic_2026)`
- Recommended action: `review task-cluster mapping and confidence calibration before trusting the disagreement`

### Paralegals and Legal Assistants
- Driver: `conceptual_gap_review`
- Flags: `benchmark_higher_than_live`
- Top clusters: `Docs (0.27, anthropic_2026); Research (0.20, anthropic_2026); Client (0.11, stub)`
- Recommended action: `perform manual concept review against AIOE and confirm whether the mismatch is expected`

