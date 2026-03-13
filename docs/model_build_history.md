# How We Built The Model

## Purpose

This document is a mechanical reconstruction of how the current role model was built and why each iteration happened.

It is not the canonical product spec.

Use these files for current authoritative behavior:
- `docs/README.md`
- `v2_engine.js`
- `docs/role_transformation_overhaul_plan.md`
- `docs/v2_0_results_spec.md`
- `docs/data/role_transformation_contract.md`

Use this file for:
- future blog-post drafting
- engineering handoff context
- explaining why the model evolved the way it did

Maintenance rule:
- update this file after major architecture changes, not after every minor tuning pass

## The Starting Problem

The original problem was not simply:

"Which occupations are exposed to AI?"

It was:

"If AI gets better at parts of a role, what happens to the role as an organizational unit?"

That is a different question.

A pure exposure score is too coarse because it collapses several distinct outcomes:
- a role can become more productive without shrinking
- a role can lose routine work but retain a judgment-heavy core
- a role can split into a cheaper execution tier and a smaller oversight tier
- a role can actually collapse as a distinct seat

The model exists because "AI can do some tasks in this occupation" is not the same as "this job disappears."

## First Naive Approach

The natural first model is an occupation-level exposure model:
- map the user to an occupation
- assign an exposure score
- maybe add some benchmark context

This is useful for ranking occupations, but weak for explanation.

Why it fails:
- it does not show which work is under pressure
- it cannot distinguish core work from support work
- it cannot model spillover
- it cannot explain why two people in the same occupation may face different outcomes
- it cannot separate role compression from role collapse

This is why the model could not stay occupation-level.

## Second Approach: Cluster-Level Priors

The next improvement was to move from whole occupations to reduced task families or clusters.

That produced a better structure:
- each occupation became a weighted bundle of task clusters
- each cluster could carry an automation-difficulty estimate
- clusters could be placed into rough wave buckets like `current`, `next`, and `distant`

This was a pragmatic step because cluster priors are:
- easier to review than fully task-level scores
- more stable than sparse task-level evidence
- good enough to seed a first working model

This solved some problems:
- pressure could start in different parts of a role
- wave timing became interpretable
- the model became more decomposable

But it still had major weaknesses:
- clusters were still averages
- tasks inside a cluster could differ materially
- the public output was still too detached from the actual task rows

So cluster priors were a workable scaffold, not an end state.

## Third Approach: Richer Task Inventory

The next bottleneck was that the model needed a better representation of the role itself.

O*NET alone was not enough for many occupations.

So the model expanded the task layer with:
- richer task inventories
- reviewed job-description task additions
- stable internal `task_id`s
- task attributes like:
  - `value_centrality`
  - `bargaining_power_weight`
  - `role_criticality`
  - `ai_support_observability`

This mattered because once tasks became first-class objects, the model could stop asking only:

"How exposed is this occupation?"

and start asking:

"Which specific tasks explain why this role exists, and which of those tasks are reachable by AI?"

That moved the model closer to role structure instead of simple exposure ranking.

## Fourth Approach: Dependency Graph

Once tasks existed as nodes, the next missing piece was edges.

That led to the task dependency graph:
- some tasks enable other tasks
- some tasks review other tasks
- some tasks exist mainly because upstream work exists

This added the concept of indirect spillover.

That mattered because many support tasks are not easy to automate directly, but they still lose value when upstream work is compressed or automated.

This was one of the major conceptual upgrades in the model:
- direct pressure = AI can do the task itself
- indirect pressure = the task becomes less necessary because adjacent work changes

Without the graph, the model would systematically understate the risk to support work and overstate the autonomy of each task.

## Fifth Approach: Function / Accountability Layer

Even a task graph is still not enough.

Why:
- roles are not just bundles of tasks
- roles exist to own functions
- some functions retain human value even when many underlying tasks become cheaper

So the model added a function layer:
- role functions
- occupation-to-function maps
- task-to-function edges
- accountability and guardrail profiles

This layer exists to answer a different question:

"If exposed tasks get cheaper, does a coherent human-owned function still remain?"

That is how the model tries to distinguish:
- augmented roles
- narrowed but still valuable roles
- polarized roles
- compressed roles
- collapsed roles

This was the step that turned the system from an exposure model into a role-transformation model.

## Sixth Approach: Editable Role Composition

At this point the model still assumed the user matched a generic occupation bundle.

That was not good enough because real users often do:
- more of one task than the default occupation mix
- less of another
- extra coordination work
- extra oversight work
- custom support dependencies

So the model added an editable composition layer:
- source-bucketed tasks
- removable and addable tasks
- task-share overrides
- editable function anchors
- optional user-declared dependency edges
- optional task-to-function link overrides

This moved personalization from "answer a few questions" to "edit the role structure itself."

That was a large design improvement because it let the user change the actual graph being scored rather than merely perturbing top-level coefficients.

## Seventh Approach: Task-Level Scoring

Even after the graph and function layers existed, the public scoring path still leaned too hard on cluster outputs.

So the next step was to score tasks directly:
- compute task share
- compute task direct pressure
- propagate dependency spillover
- compute retained leverage per task

This was the point where the explanation got much better because the visible output started to reflect actual task rows rather than abstract cluster labels.

But the first version was still hybrid:
- cluster priors produced the baseline difficulty
- that baseline was projected onto tasks
- tasks were scored on top of that inherited baseline

So task rows existed, but they were not yet driving enough of the model.

## Eighth Approach: Direct Task-Evidence Blend

The next mismatch was between the methodology we wanted and the runtime we actually had.

The intended direction was:
- use task evidence first when it is good
- use cluster priors only when task evidence is weak

The shipped runtime was not there yet.

So the first practical step was smaller:
- keep cluster priors as the baseline
- let reliable task evidence blend into task-level direct pressure

This was phase 1 of the recent work.

Why this step came first:
- it improved sensitivity without destabilizing thin-coverage occupations
- it let the model react to task-specific evidence
- it preserved the stability of the cluster-based baseline

This was not yet the ideal model, but it was a controlled improvement.

## Ninth Approach: Task-Derived Cluster Summaries

After task rows were being scored, the public cluster surfaces were still partly reading from older cluster bundles.

That created a mismatch:
- the task layer said one thing
- the visible cluster layer still partly reflected pre-task assumptions

So the model next aggregated scored task rows back into cluster summaries and used those for:
- `top_exposed_work`
- `transformation_map.current_bundle`
- `transformation_map.exposed_clusters`
- `transformation_map.retained_clusters`
- `transformation_map.elevated_clusters`

This was phase 2 of the recent work.

Conceptually, this mattered because it reversed the direction of explanation:
- before: cluster priors imposed a view on tasks
- after: tasks started producing the public cluster view

That made the visible cluster layer more faithful to the actual task graph.

## Tenth Approach: Task-Derived Wave Engine

Even after task-derived cluster summaries existed, the wave engine was still partly inherited from the older pre-task cluster path.

So the next change was to recompute:
- cluster absorption
- wave assignment
- wave trajectory
- primary displacement wave

from the task-derived cluster bundle itself.

This was phase 3 of the recent work.

At that point, the public outputs became much more internally coherent:
- tasks drive cluster summaries
- cluster summaries drive wave timing
- wave timing drives role-fate interpretation

That is a cleaner upward aggregation path than preserving multiple parallel scoring stacks.

## Eleventh Approach: Task-Source Evidence Resolver

The next weakness was the runtime evidence path.

The engine was still mostly behaving like:
- Anthropic task evidence if available
- otherwise cluster fallback

But the repo already had a richer source-comparison layer in `task_source_evidence.csv`.

So the next step was to promote that comparison layer into the live runtime.

The current task resolver now works like this:
- `live_task_evidence`
- `reviewed_task_estimate`
- `benchmark_task_label`
- `cluster_prior_proxy`
- `fallback_task_proxy`

And the promoted task-level tiers can now affect live task scoring.

This was the most recent step.

Why it mattered:
- reviewed task estimates stopped being comparison-only
- benchmark task labels stopped being comparison-only
- proxy fallback stopped blocking better task-level evidence from affecting the score

This moved the model from a narrow evidence path to a real task-source resolver.

## Where The Model Stands Now

The model is now a hybrid upward-aggregating system:

1. map the user to an occupation
2. build an editable task and function graph
3. compute baseline cluster difficulty from priors
4. project that baseline onto tasks
5. resolve task-level evidence from the task-source stack
6. let reliable resolved task evidence alter task difficulty and direct pressure
7. propagate dependency spillover
8. compute retained leverage per task
9. aggregate tasks back into cluster summaries
10. recompute wave timing from the task-derived cluster bundle
11. classify role fate using task, cluster, function, and wave signals

This is much better than the early occupation-level model because it can now represent:
- where pressure starts
- how pressure spreads
- what work still holds bargaining power
- whether the human-owned role remains coherent

## The Main Remaining Gap

The major remaining limitation is now coverage, not basic architecture.

The logic is now:
- cluster baseline first for thin or weakly evidenced tasks
- cluster baseline can shift toward task evidence when cluster coverage is strong
- high-reliability task rows can promote into a task-first baseline

So the model is no longer purely cluster-seeded.

But it is also not yet fully task-first everywhere.

The remaining gap is:
- expand the task-first path to more occupations without trusting weak evidence too aggressively
- keep explicit fallback tiers so sparse occupations do not become noisy

That is why the next major step is broader, better-calibrated per-task prior coverage rather than another abstract layer of model complexity.

In practical terms, that would mean:
- if a task has strong task-level evidence, start from that task's own evidence
- only use cluster priors when the task lacks good evidence
- only use occupation priors when cluster evidence is also weak

That would make the model more granular and more faithful to task-specific evidence.

But it also introduces risk:
- thin-coverage occupations can get noisy
- the system can become less stable if weak task evidence is trusted too aggressively

So this is not just "more detail is better."

It requires:
- confidence-aware routing
- explicit fallback tiers
- careful calibration on sparse occupations

## Why The Model Evolved This Way

The sequence was not arbitrary.

Each iteration solved a concrete failure mode in the prior version:

1. Occupation scores were too coarse.
2. Cluster priors improved decomposition but were still too averaged.
3. Richer task inventories made the role structurally legible.
4. Dependency edges made spillover legible.
5. Function anchors made retained human value legible.
6. Editable composition made the model user-specific instead of occupation-generic.
7. Task-level scoring made the explanation concrete.
8. Task-evidence blending made the task layer responsive to empirical evidence.
9. Task-derived cluster summaries removed a public/runtime mismatch.
10. Task-derived wave timing removed another public/runtime mismatch.
11. The task-source resolver made the evidence path less brittle and less proxy-dependent.

So the model has evolved by repeatedly doing the same thing:
- identify where the current abstraction is too coarse
- move one layer lower
- keep explicit fallback behavior
- aggregate upward only after lower-level scoring is coherent

That is the central design pattern in the whole system.

## A Rationalist Summary

The model was built by progressively replacing hidden averages with explicit structure.

The direction of travel has been:
- occupation averages
- cluster priors
- task graph
- function graph
- task scoring
- task-derived public outputs
- source-resolved task evidence

The remaining step is:
- make task evidence not only an adjustment layer, but the default starting point whenever coverage is strong enough

That would be the cleanest version of the model so far.

## Suggested Blog-Post Spine

If this is later turned into a blog post, the cleanest spine is probably:

1. The problem: exposure scores are not role models.
2. Why occupation-level AI rankings were not enough.
3. Why cluster priors were useful but incomplete.
4. Why I had to build a richer task graph.
5. Why I added dependency spillover.
6. Why functions and accountability changed the problem.
7. Why the model had to become editable.
8. Why I moved public outputs to task-derived summaries.
9. Why I promoted the source-comparison layer into the runtime.
10. Why broader, better-calibrated task-first coverage is still the hard remaining problem.

That would produce a story that is causal rather than celebratory, which is the right framing for this system.
