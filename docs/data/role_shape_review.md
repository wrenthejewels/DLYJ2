# Role Shape Review

This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.

It does not change the live runtime score.
It exists to tell the repo which occupations are the best candidates for explicit multi-variant modeling later.

Generated from:
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_explanations.csv`

## Summary

- occupations reviewed: `34`
- strong candidates: `5`
- watchlist: `2`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Strong Candidates

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Market Research Analysts and Marketing Specialists | 0.507 | 1 | 0.392 | 0.122 | High heterogeneity signal with role-shape review pressure and too few function anchors for a likely split occupation. |
| Editors | 0.466 | 2 | 0.386 | 0.190 | High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling. |
| Technical Writers | 0.443 | 2 | 0.369 | 0.126 | High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling. |
| News Analysts, Reporters, and Journalists | 0.439 | 2 | 0.351 | 0.145 | High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling. |
| Management Analysts | 0.432 | 2 | 0.340 | 0.134 | High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling. |

## Watchlist

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why not yet |
| --- | ---: | ---: | ---: | ---: | --- |
| Web Developers | 0.506 | 1 | 0.380 | 0.138 | Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling. |
| Operations Research Analysts | 0.504 | 1 | 0.363 | 0.162 | Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling. |

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

