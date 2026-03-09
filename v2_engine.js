(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DLYJV2 = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var DATA_FILES = {
        occupations: 'data/normalized/occupations.csv',
        selector: 'data/normalized/occupation_selector_index.csv',
        occupationTaskClusters: 'data/normalized/occupation_task_clusters.csv',
        occupationTasks: 'data/normalized/occupation_tasks.csv',
        taskMembership: 'data/normalized/task_cluster_membership.csv',
        taskEvidence: 'data/normalized/task_exposure_evidence.csv',
        taskPriors: 'data/normalized/task_augmentation_automation_priors.csv',
        occupationPriors: 'data/normalized/occupation_exposure_priors.csv',
        adaptationPriors: 'data/normalized/occupation_adaptation_priors.csv',
        laborContext: 'data/normalized/occupation_labor_market_context.csv',
        unemploymentMonthly: 'data/normalized/occupation_unemployment_monthly.csv',
        uiRoleMap: 'data/metadata/ui_role_category_map.csv'
    };

    var ROLE_STATE_LABELS = {
        mostly_augmented: 'Mostly augmented',
        routine_tasks_absorbed: 'Routine work compressed',
        role_becomes_more_senior: 'Role becomes more senior',
        role_narrows_but_remains_viable: 'Role becomes narrower',
        role_fragments: 'Role fragments',
        high_displacement_risk: 'High displacement risk'
    };

    var ELEVATION_CLUSTERS = {
        cluster_coordination: true,
        cluster_qa_review: true,
        cluster_decision_support: true,
        cluster_oversight_strategy: true,
        cluster_relationship_management: true,
        cluster_client_interaction: true
    };

    var HUMAN_ADVANTAGE_CLUSTERS = {
        cluster_client_interaction: 1.0,
        cluster_relationship_management: 1.0,
        cluster_oversight_strategy: 0.85,
        cluster_coordination: 0.65,
        cluster_decision_support: 0.55,
        cluster_qa_review: 0.45,
        cluster_research_synthesis: 0.35,
        cluster_analysis: 0.30,
        cluster_documentation: 0.20,
        cluster_drafting: 0.15,
        cluster_workflow_admin: 0.12,
        cluster_execution_routine: 0.05
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function average(values) {
        var filtered = values.filter(function (value) {
            return typeof value === 'number' && !isNaN(value);
        });

        if (!filtered.length) {
            return 0;
        }

        return filtered.reduce(function (sum, value) {
            return sum + value;
        }, 0) / filtered.length;
    }

    function sum(values) {
        return values.reduce(function (total, value) {
            return total + value;
        }, 0);
    }

    function normalizeAnswer(rawValue) {
        var value = Number(rawValue);
        if (!isFinite(value)) {
            return 0.5;
        }
        return clamp((value - 1) / 4, 0, 1);
    }

    function toNumber(rawValue, fallback) {
        if (fallback === undefined) {
            fallback = 0;
        }

        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return fallback;
        }

        var normalized = String(rawValue).replace(/[%,$]/g, '').trim();
        if (!normalized.length) {
            return fallback;
        }

        var value = Number(normalized);
        return isFinite(value) ? value : fallback;
    }

    function parsePipeList(rawValue) {
        if (!rawValue) {
            return [];
        }

        return String(rawValue)
            .split('|')
            .map(function (entry) { return entry.trim(); })
            .filter(Boolean);
    }

    function slugToLabel(taskClusterId) {
        return String(taskClusterId || '')
            .replace(/^cluster_/, '')
            .split('_')
            .map(function (part) {
                return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
            })
            .join(' ');
    }

    function taskKey(occupationId, onetTaskId) {
        return String(occupationId || '') + '|' + String(onetTaskId || '');
    }

    function parseCsv(text) {
        var rows = [];
        var row = [];
        var field = '';
        var inQuotes = false;
        var i;

        text = String(text || '').replace(/^\uFEFF/, '');

        for (i = 0; i < text.length; i += 1) {
            var char = text[i];
            var next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                row.push(field);
                field = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    i += 1;
                }
                row.push(field);
                field = '';
                if (row.length > 1 || row[0] !== '') {
                    rows.push(row);
                }
                row = [];
                continue;
            }

            field += char;
        }

        if (field.length || row.length) {
            row.push(field);
            rows.push(row);
        }

        if (!rows.length) {
            return [];
        }

        var headers = rows[0];
        return rows.slice(1).map(function (values) {
            var output = {};
            headers.forEach(function (header, index) {
                output[header] = values[index] !== undefined ? values[index] : '';
            });
            return output;
        });
    }

    async function loadText(path) {
        var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

        if (!isBrowser && typeof require === 'function') {
            var fs = require('fs');
            return fs.promises.readFile(path, 'utf8');
        }

        if (typeof fetch === 'function') {
            var response = await fetch(path);
            if (!response.ok) {
                throw new Error('Failed to load ' + path + ' (' + response.status + ')');
            }
            return response.text();
        }

        throw new Error('No available file-loading mechanism for ' + path);
    }

    async function loadCsv(path) {
        return parseCsv(await loadText(path));
    }

    function normalizePath(basePath, relativePath) {
        if (!basePath) {
            return relativePath;
        }

        return String(basePath).replace(/[\\\/]+$/, '') + '/' + relativePath;
    }

    function indexBy(rows, key) {
        return rows.reduce(function (map, row) {
            map[row[key]] = row;
            return map;
        }, {});
    }

    function groupBy(rows, key) {
        return rows.reduce(function (map, row) {
            if (!map[row[key]]) {
                map[row[key]] = [];
            }
            map[row[key]].push(row);
            return map;
        }, {});
    }

    function groupRoleMap(rows) {
        return rows.reduce(function (map, row) {
            if (!map[row.ui_role_key]) {
                map[row.ui_role_key] = [];
            }
            map[row.ui_role_key].push(row);
            return map;
        }, {});
    }

    function pickOccupationPrior(rows) {
        if (!rows || !rows.length) {
            return null;
        }

        return rows.slice().sort(function (left, right) {
            return toNumber(right.confidence, 0) - toNumber(left.confidence, 0);
        })[0];
    }

    function normalizeTaskWeights(taskClusters, overrides) {
        var total = 0;
        var weights = {};

        taskClusters.forEach(function (cluster) {
            var overrideValue = overrides && overrides[cluster.task_cluster_id];
            var value = overrideValue !== undefined ? toNumber(overrideValue, 0) : toNumber(cluster.share_prior, 0);
            value = Math.max(0, value);
            weights[cluster.task_cluster_id] = value;
            total += value;
        });

        if (total <= 0) {
            return taskClusters.map(function (cluster) {
                return {
                    task_cluster_id: cluster.task_cluster_id,
                    share_prior: 1 / Math.max(taskClusters.length, 1),
                    importance_prior: toNumber(cluster.importance_prior, 0.5),
                    evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                    source_mix: cluster.source_mix || '',
                    notes: cluster.notes || ''
                };
            });
        }

        return taskClusters.map(function (cluster) {
            return {
                task_cluster_id: cluster.task_cluster_id,
                share_prior: weights[cluster.task_cluster_id] / total,
                importance_prior: toNumber(cluster.importance_prior, 0.5),
                evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                source_mix: cluster.source_mix || '',
                notes: cluster.notes || ''
            };
        });
    }

    function buildTaskOverrides(options) {
        var overrides = {};
        var explicit = options.taskFamilyWeights || {};

        Object.keys(explicit).forEach(function (clusterId) {
            overrides[clusterId] = toNumber(explicit[clusterId], 0);
        });

        (options.dominantTaskClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.16;
        });

        (options.roleCriticalClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.10;
        });

        return overrides;
    }

    function deriveQuestionnaireSignals(answers, options) {
        var seniority = clamp((toNumber(options.seniorityLevel, 3) - 1) / 4, 0, 1);
        var roleDistinct = options.residualRoleDistinctiveness !== undefined
            ? clamp(toNumber(options.residualRoleDistinctiveness, 0.5), 0, 1)
            : 0.5;

        var q1 = normalizeAnswer(answers.Q1);
        var q2 = normalizeAnswer(answers.Q2);
        var q3 = normalizeAnswer(answers.Q3);
        var q4 = normalizeAnswer(answers.Q4);
        var q5 = normalizeAnswer(answers.Q5);
        var q6 = normalizeAnswer(answers.Q6);
        var q7 = normalizeAnswer(answers.Q7);
        var q8 = normalizeAnswer(answers.Q8);
        var q9 = normalizeAnswer(answers.Q9);
        var q10 = normalizeAnswer(answers.Q10);
        var q11 = normalizeAnswer(answers.Q11);
        var q12 = normalizeAnswer(answers.Q12);
        var q13 = normalizeAnswer(answers.Q13);
        var q14 = normalizeAnswer(answers.Q14);
        var q15 = normalizeAnswer(answers.Q15);
        var q16 = normalizeAnswer(answers.Q16);
        var q17 = normalizeAnswer(answers.Q17);
        var q18 = normalizeAnswer(answers.Q18);
        var q19 = normalizeAnswer(answers.Q19);

        var exposureReadiness = average([q1, q2, q3, q4, q5, q6, q8]);
        var couplingProtection = average([q7, q9, q11, q12]);
        var automationSignal = average([q3, q4, q5, q6, q8, 1 - q7, 1 - q9, 1 - q11, 1 - q12]);
        var augmentationSignal = average([q1, q4, q8, q7, q9, q11]);
        var adoptionPressure = average([q13, q14, 1 - q15, q16]);
        var adaptationEdge = average([q17, q18, q19]);
        var fragility = average([q10, 1 - roleDistinct]);

        return {
            seniority: seniority,
            roleDistinctiveness: roleDistinct,
            exposureReadiness: exposureReadiness,
            couplingProtection: couplingProtection,
            automationSignal: automationSignal,
            augmentationSignal: augmentationSignal,
            adoptionPressure: adoptionPressure,
            adaptationEdge: adaptationEdge,
            fragility: fragility,
            taskSupportSignal: clamp((options.aiToolSupportLevel !== undefined ? toNumber(options.aiToolSupportLevel, 0.5) : average([q1, q8])), 0, 1),
            answers: {
                q1: q1, q2: q2, q3: q3, q4: q4, q5: q5, q6: q6, q7: q7, q8: q8, q9: q9,
                q10: q10, q11: q11, q12: q12, q13: q13, q14: q14, q15: q15, q16: q16,
                q17: q17, q18: q18, q19: q19
            }
        };
    }

    function toTier(value, thresholds, labels) {
        if (value >= thresholds[1]) {
            return labels[2];
        }
        if (value >= thresholds[0]) {
            return labels[1];
        }
        return labels[0];
    }

    function buildNarrative(result) {
        var topCluster = result.top_exposed_work && result.top_exposed_work.label
            ? result.top_exposed_work.label
            : 'your routine task bundle';
        var criticalCluster = result.role_defining_work && result.role_defining_work.label
            ? result.role_defining_work.label.toLowerCase()
            : null;
        var whyThisRoleChanges = 'This role is changing primarily through pressure on ' + topCluster.toLowerCase() + ', where the selected occupation profile and your questionnaire answers both point to meaningful AI exposure.';

        if (criticalCluster && criticalCluster !== topCluster.toLowerCase()) {
            whyThisRoleChanges += ' The role-defining work in ' + criticalCluster + ' is weighted separately, so the result is not driven by time share alone.';
        }

        var whatIsUnderPressure;
        if (result.mode_of_change === 'mostly_automation') {
            whatIsUnderPressure = 'The highest-pressure tasks look most vulnerable to direct workflow absorption, especially where the work is reviewable, structured, and easy to separate from the rest of the role.';
        } else if (result.mode_of_change === 'mostly_augmentation') {
            whatIsUnderPressure = 'The highest-pressure tasks look more likely to stay inside the role as AI-assisted work than to disappear entirely.';
        } else {
            whatIsUnderPressure = 'The highest-pressure tasks split between direct automation pressure and augmentation pressure, so the role is more likely to be restructured than cleanly removed.';
        }

        if (result.diagnostics && result.diagnostics.adoption_pressure >= 0.65) {
            whatIsUnderPressure += ' Adoption context is also relatively supportive of turning technical exposure into workflow change.';
        }

        var whatStaysCore;
        if (result.residual_role_strength === 'strong') {
            whatStaysCore = 'The remaining bundle still looks coherent, with enough context-heavy, judgment-heavy, or coordinating work to hold the role together.';
        } else if (result.residual_role_strength === 'moderate') {
            whatStaysCore = 'The role still holds together, but the stable core becomes narrower and more dependent on the highest-value work.';
        } else {
            whatStaysCore = 'The remaining bundle looks thin enough that the role could fragment unless the non-routine parts become a clearer standalone function.';
        }

        if (result.role_defining_work && result.role_defining_work.retained_share !== null && result.role_defining_work.retained_share >= 0.18) {
            whatStaysCore += ' The role-defining cluster still retains enough weight to matter in the transformed bundle.';
        }

        var personalizationFitSummary;
        if (result.personalization_fit === 'strong') {
            personalizationFitSummary = 'Your answers point to a stronger fit with the retained version of the role than the occupation average, especially through leverage, context, or non-routine work.';
        } else if (result.personalization_fit === 'moderate') {
            personalizationFitSummary = 'Your answers point to a mixed fit with the retained version of the role: there is still room inside the transformed bundle, but not much slack.';
        } else {
            personalizationFitSummary = 'Your answers point to a weaker fit with the retained version of the role, which means more of your current work sits inside the part of the bundle under pressure.';
        }

        if (result.diagnostics && result.diagnostics.task_support_signal >= 0.65) {
            personalizationFitSummary += ' Current AI/tool usage also pushes the result toward a more augmentation-ready version of the role.';
        }

        return {
            why_this_role_changes: whyThisRoleChanges,
            what_is_under_pressure: whatIsUnderPressure,
            what_stays_core: whatStaysCore,
            personalization_fit_summary: personalizationFitSummary
        };
    }

    function createEngine(store) {
        function resolveCandidates(roleCategory, limit) {
            var candidates = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                })
                .map(function (row) {
                    var occupation = store.occupationsBySoc[row.onet_soc_code];
                    return occupation ? occupation : null;
                })
                .filter(Boolean);

            return candidates.slice(0, limit || 3);
        }

        function resolveOccupation(input) {
            if (input.occupationId && store.occupationsById[input.occupationId]) {
                return store.occupationsById[input.occupationId];
            }

            if (input.onetSocCode && store.occupationsBySoc[input.onetSocCode]) {
                return store.occupationsBySoc[input.onetSocCode];
            }

            if (input.roleCategory) {
                return resolveCandidates(input.roleCategory, 1)[0] || null;
            }

            return null;
        }

        function computeResult(input) {
            var occupation = resolveOccupation(input || {});
            if (!occupation) {
                throw new Error('Unable to resolve an occupation for the v2 result.');
            }

            var occupationId = occupation.occupation_id;
            var roleCategory = input.roleCategory || input.selectedRoleCategory || occupation.role_family;
            var taskClusters = normalizeTaskWeights(
                store.occupationTaskClustersByOcc[occupationId] || [],
                buildTaskOverrides(input || {})
            );
            var taskPriorsByCluster = indexBy(store.taskPriorsByOcc[occupationId] || [], 'task_cluster_id');
            var occupationPrior = pickOccupationPrior(store.occupationPriorsByOcc[occupationId] || []);
            var adaptationPrior = store.adaptationByOcc[occupationId] || null;
            var laborContext = store.laborByOcc[occupationId] || null;
            var unemploymentSeries = laborContext && laborContext.unemployment_group_id
                ? (store.unemploymentByGroup[laborContext.unemployment_group_id] || [])
                : [];
            var signals = deriveQuestionnaireSignals(input.answers || {}, input || {});
            var roleCriticalSet = {};
            (input.roleCriticalClusters || []).forEach(function (clusterId) {
                roleCriticalSet[clusterId] = true;
            });
            var occupationExposure = occupationPrior ? toNumber(occupationPrior.exposure_score, 0.5) : 0.5;
            var occupationAdaptive = occupationPrior && occupationPrior.adaptive_capacity_score
                ? toNumber(occupationPrior.adaptive_capacity_score, 0.5)
                : (adaptationPrior ? toNumber(adaptationPrior.adaptive_capacity_score, 0.5) : 0.5);

            var currentBundle = [];
            var exposedClusters = [];
            var retainedClusters = [];
            var elevatedClusters = [];
            var clusterResultsById = {};
            var transformedShares = {};
            var absorbedTotal = 0;
            var exposedTaskShare = 0;
            var automationMass = 0;
            var augmentationMass = 0;
            var criticalExposedShare = 0;
            var criticalRetainedShare = 0;
            var criticalAbsorbedShare = 0;
            var roleDefiningWork = null;

            taskClusters.forEach(function (cluster) {
                var prior = taskPriorsByCluster[cluster.task_cluster_id] || {};
                var humanAdvantage = HUMAN_ADVANTAGE_CLUSTERS[cluster.task_cluster_id] || 0.25;
                var baseExposure = average([
                    toNumber(prior.exposure_score, 0.45),
                    occupationExposure
                ]);
                var baseAug = toNumber(prior.augmentation_likelihood, 0.45);
                var baseAuto = average([
                    toNumber(prior.partial_automation_likelihood, 0.25),
                    toNumber(prior.high_automation_likelihood, 0.12)
                ]);
                var isRoleCritical = !!roleCriticalSet[cluster.task_cluster_id];
                var criticalityBoost = isRoleCritical ? 0.08 : 0;
                var adoptionRealization = 0.92 + (signals.adoptionPressure * 0.16);
                var taskSupport = signals.taskSupportSignal;

                var exposure = clamp(
                    baseExposure * (0.68 + (signals.exposureReadiness * 0.62)) *
                    adoptionRealization *
                    (1 + criticalityBoost) *
                    (1 - (humanAdvantage * signals.couplingProtection * 0.42)),
                    0,
                    1
                );

                var augmentation = clamp(
                    baseAug * (0.72 + (signals.augmentationSignal * 0.48) + (taskSupport * 0.32)) *
                    (1 + humanAdvantage * (0.16 + taskSupport * 0.12)) *
                    adoptionRealization,
                    0,
                    1
                );

                var automation = clamp(
                    baseAuto * (0.68 + (signals.automationSignal * 0.68) + (signals.adoptionPressure * 0.18)) *
                    (1 - (humanAdvantage * ((signals.couplingProtection * 0.42) + (taskSupport * 0.18)))),
                    0,
                    1
                );

                var likelyMode = augmentation >= automation ? 'augmentation' : 'automation';
                var clusterShare = toNumber(cluster.share_prior, 0);
                var absorbedShare = clusterShare * exposure * automation * (0.74 + (signals.adoptionPressure * 0.16));
                var retainedShare = Math.max(0, clusterShare - absorbedShare);
                var elevationBoost = ELEVATION_CLUSTERS[cluster.task_cluster_id]
                    ? absorbedShare * (0.22 + signals.seniority * 0.18 + signals.roleDistinctiveness * 0.12 + (isRoleCritical ? 0.08 : 0))
                    : 0;
                var transformedShare = retainedShare + elevationBoost;

                absorbedTotal += absorbedShare;
                exposedTaskShare += clusterShare * exposure;
                automationMass += clusterShare * exposure * automation;
                augmentationMass += clusterShare * exposure * augmentation;
                transformedShares[cluster.task_cluster_id] = transformedShare;
                if (isRoleCritical) {
                    criticalExposedShare += clusterShare * exposure;
                    criticalRetainedShare += transformedShare;
                    criticalAbsorbedShare += absorbedShare;
                }

                var clusterResult = {
                    task_cluster_id: cluster.task_cluster_id,
                    label: slugToLabel(cluster.task_cluster_id),
                    share_of_role: clusterShare,
                    exposure_score: exposure,
                    augmentation_likelihood: augmentation,
                    automation_likelihood: automation,
                    partial_automation_likelihood: toNumber(prior.partial_automation_likelihood, automation),
                    high_automation_likelihood: toNumber(prior.high_automation_likelihood, automation * 0.7),
                    absorbed_share: absorbedShare,
                    residual_relevance: transformedShare,
                    evidence_confidence: average([
                        toNumber(cluster.evidence_confidence, 0.4),
                        toNumber(prior.evidence_confidence, 0.4)
                    ]),
                    primary_sources: parsePipeList(prior.primary_sources || cluster.source_mix || ''),
                    likely_mode: likelyMode,
                    is_role_critical: isRoleCritical
                };

                currentBundle.push(clusterResult);
                clusterResultsById[cluster.task_cluster_id] = clusterResult;

                if (isRoleCritical) {
                    roleDefiningWork = clusterResult;
                }

                if (clusterShare * exposure >= 0.045) {
                    exposedClusters.push(clusterResult);
                }

                if (transformedShare >= 0.055) {
                    retainedClusters.push(clusterResult);
                }

                if (elevationBoost >= 0.025) {
                    elevatedClusters.push(clusterResult);
                }
            });

            currentBundle.sort(function (left, right) {
                return right.share_of_role - left.share_of_role;
            });
            exposedClusters.sort(function (left, right) {
                return (right.share_of_role * right.exposure_score) - (left.share_of_role * left.exposure_score);
            });
            retainedClusters.sort(function (left, right) {
                return right.residual_relevance - left.residual_relevance;
            });
            elevatedClusters.sort(function (left, right) {
                return right.residual_relevance - left.residual_relevance;
            });

            exposedTaskShare = clamp(exposedTaskShare, 0, 1);
            var automationShare = automationMass + augmentationMass > 0 ? clamp(automationMass / (automationMass + augmentationMass), 0, 1) : 0.5;
            var augmentationShare = 1 - automationShare;
            var selector = store.selectorByOcc[occupationId] || {};

            var strategicResidualShare = sum(retainedClusters.map(function (cluster) {
                return ELEVATION_CLUSTERS[cluster.task_cluster_id] ? cluster.residual_relevance : 0;
            }));
            var criticalRoleBuffer = Object.keys(roleCriticalSet).length
                ? average([
                    criticalRetainedShare,
                    1 - clamp(criticalExposedShare * Math.max(automationShare, 0.45), 0, 1)
                ])
                : signals.roleDistinctiveness;

            var residualViabilityScore = clamp(
                average([
                    1 - signals.fragility,
                    signals.roleDistinctiveness,
                    signals.couplingProtection,
                    strategicResidualShare,
                    criticalRoleBuffer,
                    1 - automationShare
                ]) * 0.68 + clamp(sum(Object.keys(transformedShares).map(function (key) { return transformedShares[key]; })), 0, 1) * 0.32,
                0,
                1
            );

            var personalizationFitScore = clamp(
                average([
                    occupationAdaptive,
                    strategicResidualShare,
                    criticalRetainedShare || signals.roleDistinctiveness,
                    signals.couplingProtection,
                    signals.adaptationEdge,
                    signals.taskSupportSignal,
                    signals.seniority * 0.55 + signals.roleDistinctiveness * 0.45,
                    1 - signals.fragility
                ]),
                0,
                1
            );

            var roleState;
            if (residualViabilityScore < 0.34 && automationShare >= 0.58 && exposedTaskShare >= 0.58) {
                roleState = 'high_displacement_risk';
            } else if (residualViabilityScore < 0.42 && exposedTaskShare >= 0.55) {
                roleState = 'role_fragments';
            } else if (strategicResidualShare >= 0.34 && automationShare < 0.48 && signals.seniority >= 0.50) {
                roleState = 'role_becomes_more_senior';
            } else if (residualViabilityScore >= 0.62 && augmentationShare >= 0.55) {
                roleState = 'mostly_augmented';
            } else if (residualViabilityScore >= 0.48) {
                roleState = 'routine_tasks_absorbed';
            } else {
                roleState = 'role_narrows_but_remains_viable';
            }

            var topExposed = (exposedClusters.slice().sort(function (left, right) {
                var leftScore = (left.share_of_role * left.exposure_score) * (left.is_role_critical ? 1.35 : 1);
                var rightScore = (right.share_of_role * right.exposure_score) * (right.is_role_critical ? 1.35 : 1);
                return rightScore - leftScore;
            })[0]) || currentBundle[0] || null;
            var viabilityTier = toTier(residualViabilityScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var personalizationTier = toTier(personalizationFitScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var balanceTier = automationShare >= 0.60
                ? 'mostly_automation'
                : (automationShare <= 0.42 ? 'mostly_augmentation' : 'mixed');
            var exposureLevel = topExposed
                ? toTier(topExposed.exposure_score, [0.40, 0.68], ['low', 'moderate', 'high'])
                : 'low';
            var occupationAnchorConfidence = average([
                occupationPrior ? toNumber(occupationPrior.confidence, 0.45) : 0.40,
                selector ? toNumber(selector.selector_weight, 0.50) : 0.50
            ]);
            var personalizationConfidence = average([
                signals.roleDistinctiveness,
                1 - signals.fragility,
                signals.couplingProtection,
                signals.taskSupportSignal,
                average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                }))
            ]);
            var laborContextConfidence = laborContext
                ? toNumber(laborContext.labor_market_confidence, 0.55)
                : 0;
            var roleSummary = occupation.title + ' shows ' + Math.round(exposedTaskShare * 100) + '% exposed task share, led by ' + (topExposed ? topExposed.label.toLowerCase() : 'the current bundle') + ', while the retained bundle looks ' + viabilityTier + '.';
            if (roleDefiningWork) {
                roleSummary += ' The role-defining work in ' + roleDefiningWork.label.toLowerCase() + ' carries extra weight in the retained-bundle calculation.';
            }

            var taskRowsByCluster = {};
            var taskBreakdownRows = [];
            var directTaskEvidenceCount = 0;
            var fallbackTaskCount = 0;

            (store.occupationTasksByOcc[occupationId] || []).forEach(function (task) {
                var key = taskKey(occupationId, task.onet_task_id);
                var membership = store.taskMembershipByKey[key] || null;
                var evidence = store.taskEvidenceByKey[key] || null;
                var clusterId = membership && membership.task_cluster_id
                    ? membership.task_cluster_id
                    : (evidence && evidence.task_cluster_id ? evidence.task_cluster_id : null);

                if (!clusterId || !clusterResultsById[clusterId]) {
                    return;
                }

                var importanceWeight = clamp(toNumber(task.importance, 0.55), 0, 1);
                var frequencyWeight = clamp(toNumber(task.frequency, importanceWeight), 0, 1);
                var observedUsageWeight = evidence ? clamp(toNumber(evidence.observed_usage_share, 0), 0, 1) : 0;
                var coreBoost = String(task.task_type || '').toLowerCase() === 'core' ? 0.08 : 0;
                var membershipWeight = membership ? clamp(toNumber(membership.membership_weight, 1), 0.15, 1) : 1;
                var rawTaskWeight = Math.max(0.04, (importanceWeight * 0.58) + (frequencyWeight * 0.27) + (observedUsageWeight * 0.15) + coreBoost) * membershipWeight;

                if (!taskRowsByCluster[clusterId]) {
                    taskRowsByCluster[clusterId] = [];
                }

                taskRowsByCluster[clusterId].push({
                    task: task,
                    membership: membership,
                    evidence: evidence,
                    raw_weight: rawTaskWeight
                });
            });

            Object.keys(taskRowsByCluster).forEach(function (clusterId) {
                var clusterResult = clusterResultsById[clusterId];
                var rows = taskRowsByCluster[clusterId] || [];
                var totalRawWeight = sum(rows.map(function (row) {
                    return row.raw_weight;
                })) || rows.length || 1;

                rows.forEach(function (row) {
                    var evidence = row.evidence;
                    var membership = row.membership;
                    var taskShare = clusterResult.share_of_role * (row.raw_weight / totalRawWeight);
                    var taskExposure = evidence
                        ? average([clusterResult.exposure_score, toNumber(evidence.exposure_score, clusterResult.exposure_score)])
                        : clusterResult.exposure_score;
                    var taskAugmentation = evidence
                        ? average([clusterResult.augmentation_likelihood, toNumber(evidence.augmentation_score, clusterResult.augmentation_likelihood)])
                        : clusterResult.augmentation_likelihood;
                    var taskAutomation = evidence
                        ? average([clusterResult.automation_likelihood, toNumber(evidence.automation_score, clusterResult.automation_likelihood)])
                        : clusterResult.automation_likelihood;
                    var taskAbsorbedShare = taskShare * taskExposure * taskAutomation * (0.74 + (signals.adoptionPressure * 0.16));
                    var taskRetainedShare = Math.max(0, taskShare - taskAbsorbedShare);
                    var taskElevationBoost = ELEVATION_CLUSTERS[clusterId]
                        ? taskAbsorbedShare * (0.22 + signals.seniority * 0.18 + signals.roleDistinctiveness * 0.12 + (clusterResult.is_role_critical ? 0.08 : 0))
                        : 0;
                    var transformedTaskShare = taskRetainedShare + taskElevationBoost;
                    var hasDirectEvidence = !!(evidence && evidence.source_id && String(evidence.source_id).indexOf('src_internal_stub') !== 0);

                    if (hasDirectEvidence) {
                        directTaskEvidenceCount += 1;
                    } else {
                        fallbackTaskCount += 1;
                    }

                    taskBreakdownRows.push({
                        onet_task_id: row.task.onet_task_id,
                        task_statement: row.task.task_statement,
                        task_type: row.task.task_type || '',
                        task_cluster_id: clusterId,
                        task_cluster_label: clusterResult.label,
                        share_of_role: Number(taskShare.toFixed(4)),
                        exposed_share: Number((taskShare * taskExposure).toFixed(4)),
                        retained_share: Number(transformedTaskShare.toFixed(4)),
                        exposure_score: Number(taskExposure.toFixed(3)),
                        exposure_level: toTier(taskExposure, [0.40, 0.68], ['low', 'moderate', 'high']),
                        augmentation_likelihood: Number(taskAugmentation.toFixed(3)),
                        automation_likelihood: Number(taskAutomation.toFixed(3)),
                        likely_mode: taskAugmentation >= taskAutomation ? 'augmentation' : 'automation',
                        evidence_confidence: Number(average([
                            clusterResult.evidence_confidence,
                            evidence ? toNumber(evidence.confidence, 0.55) : null,
                            membership ? toNumber(membership.mapping_confidence, 0.45) : 0.45
                        ]).toFixed(3)),
                        mapping_method: membership ? membership.mapping_method : 'cluster_fallback',
                        mapping_confidence: Number((membership ? toNumber(membership.mapping_confidence, 0.45) : 0.45).toFixed(3)),
                        evidence_type: evidence ? evidence.evidence_type : 'cluster_fallback',
                        evidence_source: evidence ? evidence.source_id : null,
                        observed_usage_share: Number((evidence ? toNumber(evidence.observed_usage_share, 0) : 0).toFixed(4)),
                        has_direct_evidence: hasDirectEvidence,
                        is_role_critical: !!clusterResult.is_role_critical
                    });
                });
            });

            taskBreakdownRows.sort(function (left, right) {
                if (right.exposed_share !== left.exposed_share) {
                    return right.exposed_share - left.exposed_share;
                }
                return right.share_of_role - left.share_of_role;
            });

            var categoryMappings = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .slice()
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                });
            var categoryCandidateRank = null;
            for (var categoryIndex = 0; categoryIndex < categoryMappings.length; categoryIndex += 1) {
                if (categoryMappings[categoryIndex].onet_soc_code === occupation.onet_soc_code) {
                    categoryCandidateRank = categoryIndex + 1;
                    break;
                }
            }

            var occupationAssignment = {
                role_category: roleCategory,
                role_category_label: slugToLabel(roleCategory),
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                onet_soc_code: occupation.onet_soc_code || null,
                selector_weight: Number(toNumber(selector.selector_weight, 0.5).toFixed(3)),
                anchor_confidence: Number(occupationAnchorConfidence.toFixed(3)),
                category_candidate_count: categoryMappings.length,
                category_candidate_rank: categoryCandidateRank,
                occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                assignment_method: input.occupationId
                    ? 'Using the occupation you explicitly selected from the mapped launch set.'
                    : 'Using the top mapped occupation for the selected launch category.',
                task_assignment_method: 'The model starts from O*NET tasks for the selected occupation, maps those tasks into task clusters, blends in Anthropic task evidence where available, and then reweights the task bundle using your questionnaire.',
                dominant_task_clusters: (input.dominantTaskClusters || []).map(function (clusterId) {
                    return {
                        task_cluster_id: clusterId,
                        label: slugToLabel(clusterId)
                    };
                }),
                role_defining_cluster: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    label: roleDefiningWork.label
                } : null,
                direct_task_evidence_count: directTaskEvidenceCount,
                fallback_task_count: fallbackTaskCount,
                questionnaire_effect: 'Your task-family choices change role-share weights. Your questionnaire answers then change exposure, augmentation, automation, and retained-share estimates inside that occupation anchor.'
            };

            var evidenceSummary = {
                task_evidence_confidence: average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupation_anchor_confidence: occupationAnchorConfidence,
                personalization_confidence: personalizationConfidence,
                labor_context_confidence: laborContextConfidence,
                source_coverage: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    task_prior_rows: currentBundle.length,
                    exposed_cluster_rows: exposedClusters.length,
                    direct_task_evidence_rows: directTaskEvidenceCount,
                    fallback_task_rows: fallbackTaskCount,
                    labor_context_available: !!laborContext
                },
                notes: [
                    occupationPrior ? ('Occupation prior source: ' + occupationPrior.source_id) : 'Occupation prior source: fallback heuristic',
                    'Headline outputs are driven by O*NET task structure plus Anthropic task-level transformation evidence.',
                    'Task-level rows blend direct Anthropic task evidence with cluster fallback estimates when direct task coverage is thin.',
                    roleDefiningWork ? ('Role-defining task input: ' + roleDefiningWork.label + '.') : 'No explicit role-defining task input selected.',
                    'Current AI/tool support signal=' + Number(signals.taskSupportSignal.toFixed(2)) + '; adoption pressure=' + Number(signals.adoptionPressure.toFixed(2)) + '.',
                    'Labor-market data is shown as context and does not drive the main role labels.',
                    laborContext ? ('Labor context includes employment=' + laborContext.employment_us + ', median_wage=' + laborContext.median_wage_usd + ', growth=' + laborContext.projection_growth_pct + '%.') : 'Labor context unavailable for this occupation.',
                    laborContext && laborContext.unemployment_group_label ? ('Latest official BLS unemployment for ' + laborContext.unemployment_group_label + ' is ' + laborContext.latest_unemployment_rate + '% (' + laborContext.latest_unemployment_period + ').') : 'No mapped BLS unemployment series for this occupation yet.'
                ]
            };

            var result = {
                selected_role_category: roleCategory,
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                role_outlook: roleState,
                role_outlook_label: ROLE_STATE_LABELS[roleState],
                role_summary: roleSummary,
                occupation_assignment: occupationAssignment,
                top_exposed_work: topExposed ? {
                    task_cluster_id: topExposed.task_cluster_id,
                    label: topExposed.label,
                    share_of_role: Number(topExposed.share_of_role.toFixed(3)),
                    exposure_score: Number(topExposed.exposure_score.toFixed(3)),
                    exposure_level: exposureLevel
                } : null,
                role_defining_work: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    label: roleDefiningWork.label,
                    share_of_role: Number(roleDefiningWork.share_of_role.toFixed(3)),
                    retained_share: Number((transformedShares[roleDefiningWork.task_cluster_id] || 0).toFixed(3)),
                    exposed_share: Number((roleDefiningWork.share_of_role * roleDefiningWork.exposure_score).toFixed(3))
                } : null,
                exposed_task_share: Number(exposedTaskShare.toFixed(3)),
                mode_of_change: balanceTier,
                augmentation_share: Number(augmentationShare.toFixed(3)),
                automation_share: Number(automationShare.toFixed(3)),
                residual_role_strength: viabilityTier,
                personalization_fit: personalizationTier,
                transformation_map: {
                    current_bundle: currentBundle,
                    exposed_clusters: exposedClusters,
                    retained_clusters: retainedClusters,
                    elevated_clusters: elevatedClusters
                },
                task_breakdown: {
                    total_tasks_considered: taskBreakdownRows.length,
                    direct_evidence_tasks: directTaskEvidenceCount,
                    cluster_fallback_tasks: fallbackTaskCount,
                    tasks: taskBreakdownRows
                },
                narrative_summary: null,
                evidence_summary: evidenceSummary,
                labor_market_context: laborContext ? {
                    employment_us: toNumber(laborContext.employment_us, 0),
                    annual_openings: toNumber(laborContext.annual_openings, 0),
                    median_wage_usd: toNumber(laborContext.median_wage_usd, 0),
                    wage_p25_usd: toNumber(laborContext.wage_p25_usd, 0),
                    wage_p75_usd: toNumber(laborContext.wage_p75_usd, 0),
                    projection_growth_pct: toNumber(laborContext.projection_growth_pct, 0),
                    unemployment_group_id: laborContext.unemployment_group_id || null,
                    unemployment_group_label: laborContext.unemployment_group_label || null,
                    unemployment_series_id: laborContext.unemployment_series_id || null,
                    latest_unemployment_rate: laborContext.latest_unemployment_rate !== undefined && laborContext.latest_unemployment_rate !== '' ? toNumber(laborContext.latest_unemployment_rate, null) : null,
                    latest_unemployment_period: laborContext.latest_unemployment_period || null,
                    monthly_unemployment_series: unemploymentSeries.map(function (row) {
                        return {
                            year: toNumber(row.year, 0),
                            month: toNumber(row.month, 0),
                            month_label: row.month_label,
                            unemployment_rate: row.unemployment_rate !== undefined && row.unemployment_rate !== '' ? toNumber(row.unemployment_rate, null) : null,
                            is_missing: String(row.is_missing || '') === '1'
                        };
                    })
                } : null,
                diagnostics: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    occupation_prior_exposure: Number(occupationExposure.toFixed(3)),
                    occupation_prior_adaptive_capacity: Number(occupationAdaptive.toFixed(3)),
                    adoption_pressure: Number(signals.adoptionPressure.toFixed(3)),
                    task_support_signal: Number(signals.taskSupportSignal.toFixed(3)),
                    fragility: Number(signals.fragility.toFixed(3)),
                    critical_exposed_share: Number(clamp(criticalExposedShare, 0, 1).toFixed(3)),
                    critical_retained_share: Number(clamp(criticalRetainedShare, 0, 1).toFixed(3)),
                    critical_absorbed_share: Number(clamp(criticalAbsorbedShare, 0, 1).toFixed(3)),
                    personalization_fit_score: Number(personalizationFitScore.toFixed(3)),
                    residual_role_strength_score: Number(residualViabilityScore.toFixed(3)),
                    retained_transformed_share: Number(clamp(sum(Object.keys(transformedShares).map(function (key) {
                        return transformedShares[key];
                    })), 0, 1).toFixed(3)),
                    absorbed_share: Number(clamp(absorbedTotal, 0, 1).toFixed(3))
                },
                likely_role_state: roleState,
                likely_role_state_label: ROLE_STATE_LABELS[roleState],
                top_exposed_task_cluster: topExposed ? topExposed.label : 'Unknown',
                automation_vs_augmentation_balance: balanceTier,
                residual_role_viability: viabilityTier,
                adaptation_capacity: personalizationTier
            };

            result.narrative_summary = buildNarrative(result);
            return result;
        }

        return {
            getOccupationCandidates: function (roleCategory, limit) {
                return resolveCandidates(roleCategory, limit || 3);
            },
            listOccupations: function (limit) {
                var rows = Object.keys(store.occupationsById)
                    .map(function (occupationId) {
                        var occupation = store.occupationsById[occupationId];
                        var selector = store.selectorByOcc[occupationId] || {};

                        return {
                            occupation_id: occupation.occupation_id,
                            onet_soc_code: occupation.onet_soc_code,
                            title: occupation.title,
                            role_family: occupation.role_family,
                            selector_weight: toNumber(selector.selector_weight, 0.5),
                            search_blob: selector.search_blob || occupation.title.toLowerCase()
                        };
                    })
                    .sort(function (left, right) {
                        return right.selector_weight - left.selector_weight;
                    });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            searchOccupations: function (query, limit, roleCategory) {
                var normalizedQuery = String(query || '').trim().toLowerCase();
                var rows = this.listOccupations();

                if (roleCategory) {
                    rows = rows.filter(function (row) {
                        return row.role_family === roleCategory;
                    });
                }

                if (!normalizedQuery) {
                    return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
                }

                rows = rows
                    .map(function (row) {
                        var title = String(row.title || '').toLowerCase();
                        var searchBlob = String(row.search_blob || '').toLowerCase();
                        var score = 0;

                        if (title === normalizedQuery) {
                            score += 100;
                        } else if (title.indexOf(normalizedQuery) === 0) {
                            score += 60;
                        } else if (title.indexOf(normalizedQuery) !== -1) {
                            score += 40;
                        }

                        if (searchBlob.indexOf(normalizedQuery) !== -1) {
                            score += 20;
                        }

                        score += row.selector_weight * 10;

                        return {
                            score: score,
                            row: row
                        };
                    })
                    .filter(function (entry) { return entry.score > 0; })
                    .sort(function (left, right) {
                        return right.score - left.score;
                    })
                    .map(function (entry) { return entry.row; });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            getOccupationById: function (occupationId) {
                return store.occupationsById[occupationId] || null;
            },
            computeResult: computeResult,
            getDataSummary: function () {
                return {
                    occupations: Object.keys(store.occupationsById).length,
                    roleCategories: Object.keys(store.uiRoleMapByRole).length,
                    occupationTaskClusterRows: store.occupationTaskClusters.length,
                    taskPriorRows: store.taskPriors.length
                };
            }
        };
    }

    async function create(options) {
        var opts = options || {};
        var basePath = opts.basePath || '';
        var loaded = {};
        var keys = Object.keys(DATA_FILES);

        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            loaded[key] = await loadCsv(normalizePath(basePath, DATA_FILES[key]));
        }

        var occupationsById = indexBy(loaded.occupations, 'occupation_id');
        var occupationsBySoc = loaded.occupations.reduce(function (map, row) {
            map[row.onet_soc_code] = row;
            return map;
        }, {});

        return createEngine({
            occupationsById: occupationsById,
            occupationsBySoc: occupationsBySoc,
            selectorByOcc: indexBy(loaded.selector, 'occupation_id'),
            occupationTaskClusters: loaded.occupationTaskClusters,
            occupationTaskClustersByOcc: groupBy(loaded.occupationTaskClusters, 'occupation_id'),
            occupationTasksByOcc: groupBy(loaded.occupationTasks, 'occupation_id'),
            taskMembershipByKey: loaded.taskMembership.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                if (!current || toNumber(row.mapping_confidence, 0) >= toNumber(current.mapping_confidence, 0)) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskEvidenceByKey: loaded.taskEvidence.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                if (!current || toNumber(row.confidence, 0) >= toNumber(current.confidence, 0)) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskPriors: loaded.taskPriors,
            taskPriorsByOcc: groupBy(loaded.taskPriors, 'occupation_id'),
            occupationPriorsByOcc: groupBy(loaded.occupationPriors, 'occupation_id'),
            adaptationByOcc: indexBy(loaded.adaptationPriors, 'occupation_id'),
            laborByOcc: indexBy(loaded.laborContext, 'occupation_id'),
            unemploymentByGroup: groupBy(loaded.unemploymentMonthly, 'unemployment_group_id'),
            uiRoleMapByRole: groupRoleMap(loaded.uiRoleMap)
        });
    }

    return {
        create: create,
        ROLE_STATE_LABELS: ROLE_STATE_LABELS,
        DATA_FILES: DATA_FILES
    };
});
