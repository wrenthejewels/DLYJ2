# Source Priority

When a normalized field could be informed by multiple sources, use this default precedence:

1. direct task-level evidence
2. occupation-level empirical priors
3. O*NET structure and context proxies
4. manual heuristic fallback

## Examples

- `task_exposure_evidence.csv`: prefer Anthropic task-level evidence over occupation-wide heuristics.
- `occupation_exposure_priors.csv`: prefer the launch aggregate prior derived from Anthropic task evidence, O*NET structure, and BLS labor context.
- `occupation_quality_indicators.csv`: use OECD as a framework and O*NET as the initial implementation substrate.
- `occupation_transition_adjacency.csv`: use O*NET adjacency and later augment with empirical transition data if added.
