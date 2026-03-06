# Task Cluster Design

The v2.0 model should not operate directly on every O*NET task as the main product surface. It needs a reduced, interpretable task-cluster layer.

## Initial cluster set

- `cluster_drafting`
- `cluster_analysis`
- `cluster_research_synthesis`
- `cluster_coordination`
- `cluster_client_interaction`
- `cluster_qa_review`
- `cluster_decision_support`
- `cluster_execution_routine`
- `cluster_oversight_strategy`
- `cluster_relationship_management`
- `cluster_documentation`
- `cluster_workflow_admin`

## Mapping rules

- Prefer many-to-one mapping from fine-grained O*NET tasks into a cluster.
- Use `membership_weight` when a task reasonably spans more than one cluster.
- Keep clusters interpretable in product copy; avoid taxonomies that only make sense in code.
- High-coupling clusters should be clearly separated from low-coupling clusters because that distinction will matter for residual-bundle scoring.
