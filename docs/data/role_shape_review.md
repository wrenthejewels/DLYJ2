# Role Shape Review

This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.

It does not directly score the live runtime on its own.
It exists to tell the repo which occupations are the best candidates for reviewed role-variant expansion beyond the first implemented set.

Generated from:
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_explanations.csv`

## Summary

- occupations reviewed: `34`
- implemented first-pass variants: `5`
- strong candidates: `0`
- watchlist: `2`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Implemented First Pass

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Market Research Analysts and Marketing Specialists | 0.513 | 1 | 0.392 | 0.147 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Editors | 0.465 | 2 | 0.386 | 0.186 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Technical Writers | 0.446 | 2 | 0.369 | 0.140 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| News Analysts, Reporters, and Journalists | 0.438 | 2 | 0.351 | 0.141 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Management Analysts | 0.435 | 2 | 0.340 | 0.147 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |

## Strong Candidates

- No occupation currently clears the strong-candidate threshold.

## Watchlist

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why not yet |
| --- | ---: | ---: | ---: | ---: | --- |
| Web Developers | 0.506 | 1 | 0.380 | 0.138 | Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling. |
| Operations Research Analysts | 0.504 | 1 | 0.363 | 0.162 | Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling. |

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

