# Source Priority

When a normalized field could be informed by multiple sources, use this default precedence:

1. direct task-level evidence
2. occupation-level empirical priors
3. O*NET structure and context proxies
4. manual heuristic fallback

## Examples

- `task_exposure_evidence.csv`: prefer the normalized Anthropic `2026-01-15` task telemetry; use the legacy `2025-03-27` Anthropic extract only as fallback when the newer release does not resolve a row.
- `occupation_exposure_priors.csv`: prefer the launch aggregate prior derived from Anthropic task evidence, O*NET structure, and BLS labor context.
- `occupation_benchmark_scores.csv`: keep benchmark scores separate from public scoring and use them only for comparison reports or offline validation.
- `occupation_quality_indicators.csv`: use OECD as a framework and O*NET as the initial implementation substrate.
- `occupation_transition_adjacency.csv`: use O*NET adjacency and later augment with empirical transition data if added.
- `benchmark-only` sources such as `AIOE` or `ILO` may validate directional rankings, but they should not override the public headline stack unless they are explicitly promoted after comparison work.
