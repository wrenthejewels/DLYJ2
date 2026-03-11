# Data Scripts

This directory contains the active source ingestion, normalization, comparison, and rebuild scripts for the live data/model pipeline.

Current script categories:
- fetch raw sources
- seed launch stubs from metadata
- build pilot job-description task evidence
- normalize O*NET raw exports
- normalize BLS labor extracts
- normalize BLS unemployment by occupation group
- normalize Anthropic task evidence
- normalize AIOE benchmark extracts
- compare Anthropic release outputs before promoting a new release into the live priors
- compare benchmark-only sources against the live exposure prior
- diagnose large benchmark disagreements before any source-promotion decision
- rebuild launch occupation priors from O*NET, Anthropic, and BLS
- infer task clusters from O*NET task text
- build seeded task role-graph contracts from normalized task rows
- build role-function anchors and accountability profiles
- build source-comparison contracts across task and occupation layers
- build first-pass role-transformation outputs
- apply reviewed pilot calibration overrides for role-transformation outputs
- rebuild the role-transformation stack end to end
- normalize O*NET files
- normalize Anthropic Economic Index files
- normalize AIOE benchmark files
- normalize GPTs-are-GPTs benchmark files
- build selector index
- validate normalized joins
