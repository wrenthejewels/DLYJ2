# Normalization Notes

## Purpose

These notes define how raw source files are transformed into model-facing normalized CSVs.

## Core rules

- `occupations.csv` is the canonical occupation table.
- `occupation_id` is the stable join key across normalized files.
- `task_cluster_id` is the stable join key for the reduced v2.0 task taxonomy.
- `source_registry.yaml` is the source of truth for source IDs and provenance.

## Source precedence

When sources disagree, use this order unless a file-level note says otherwise:
1. direct task-level evidence
2. occupation-level empirical priors
3. O*NET structural proxies
4. role-family heuristics

## Confidence conventions

- `0.90-1.00`: direct mapped evidence with clear taxonomy alignment
- `0.70-0.89`: strong mapped evidence with minor manual adjustment
- `0.50-0.69`: proxy-derived estimate
- `<0.50`: weak fallback only

## Partial-coverage source rule

- If an occupation-level source only covers part of the launch set, merge it only for covered occupations.
- Do not drop uncovered occupations from normalized outputs when a partial source is imported.
- Preserve fallback priors for uncovered occupations and keep source provenance explicit in `source_id` and `notes`.

## Sample stub policy

All sample rows in this first pass are marked with `notes = sample_stub` to avoid implying production readiness.
