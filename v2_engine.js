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
        taskPriors: 'data/normalized/task_augmentation_automation_priors.csv',
        occupationPriors: 'data/normalized/occupation_exposure_priors.csv',
        adaptationPriors: 'data/normalized/occupation_adaptation_priors.csv',
        laborContext: 'data/normalized/occupation_labor_market_context.csv',
        unemploymentMonthly: 'data/normalized/occupation_unemployment_monthly.csv',
        uiRoleMap: 'data/metadata/ui_role_category_map.csv'
    };

    var ROLE_STATE_LABELS = {
        mostly_augmented: 'Mostly augmented',
        routine_tasks_absorbed: 'Routine tasks absorbed',
        role_becomes_more_senior: 'Role becomes more senior',
        role_narrows_but_remains_viable: 'Role narrows but remains viable',
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
        var topCluster = result.top_exposed_task_cluster || 'your routine task bundle';
        var whatIsChanging = 'The main pressure in this role is concentrated in ' + topCluster.toLowerCase() + ', where AI exposure is high enough to change how the role is staffed and executed.';

        var whatGetsAbsorbed;
        if (result.automation_vs_augmentation_balance === 'mostly_automation') {
            whatGetsAbsorbed = 'The most exposed routine tasks are more likely to be absorbed directly into automated workflows or into thinner human-supervised processes.';
        } else if (result.automation_vs_augmentation_balance === 'mostly_augmentation') {
            whatGetsAbsorbed = 'The most exposed tasks are more likely to be accelerated and reshaped by AI tools than removed cleanly from the role.';
        } else {
            whatGetsAbsorbed = 'Some exposed tasks are likely to be automated outright while others remain in the role as AI-assisted work.';
        }

        var whatRemains;
        if (result.residual_role_viability === 'strong') {
            whatRemains = 'The residual bundle still looks like a coherent role, especially around coordination, review, judgment, or higher-context work.';
        } else if (result.residual_role_viability === 'moderate') {
            whatRemains = 'The residual bundle likely holds together, but it narrows and depends more heavily on the higher-value parts of the role.';
        } else {
            whatRemains = 'The residual bundle looks thin enough that the role may fragment unless the higher-value tasks become a clearer standalone function.';
        }

        var whoBenefits;
        if (result.adaptation_capacity === 'strong') {
            whoBenefits = 'Workers who can shift toward the retained and elevated task clusters should still have room to stay valuable in the transformed version of the role.';
        } else if (result.adaptation_capacity === 'moderate') {
            whoBenefits = 'Workers with some flexibility should be able to stay in the role, but the transition likely requires meaningful upskilling or scope change.';
        } else {
            whoBenefits = 'Workers who cannot move toward the retained bundle or adjacent roles are more exposed to downside from the role transition.';
        }

        return {
            what_is_changing: whatIsChanging,
            what_gets_absorbed: whatGetsAbsorbed,
            what_remains: whatRemains,
            who_benefits: whoBenefits
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

            var currentBundle = [];
            var exposedClusters = [];
            var retainedClusters = [];
            var elevatedClusters = [];
            var transformedShares = {};
            var absorbedTotal = 0;
            var exposedTaskShare = 0;
            var automationMass = 0;
            var augmentationMass = 0;

            taskClusters.forEach(function (cluster) {
                var prior = taskPriorsByCluster[cluster.task_cluster_id] || {};
                var humanAdvantage = HUMAN_ADVANTAGE_CLUSTERS[cluster.task_cluster_id] || 0.25;
                var baseExposure = toNumber(prior.exposure_score, 0.45);
                var baseAug = toNumber(prior.augmentation_likelihood, 0.45);
                var baseAuto = average([
                    toNumber(prior.partial_automation_likelihood, 0.25),
                    toNumber(prior.high_automation_likelihood, 0.12)
                ]);

                var exposure = clamp(
                    baseExposure * (0.70 + (signals.exposureReadiness * 0.70)) *
                    (1 - (humanAdvantage * signals.couplingProtection * 0.45)),
                    0,
                    1
                );

                var augmentation = clamp(
                    baseAug * (0.75 + (signals.augmentationSignal * 0.55)) * (1 + humanAdvantage * 0.20),
                    0,
                    1
                );

                var automation = clamp(
                    baseAuto * (0.70 + (signals.automationSignal * 0.75)) *
                    (1 - (humanAdvantage * signals.couplingProtection * 0.55)),
                    0,
                    1
                );

                var likelyMode = augmentation >= automation ? 'augmentation' : 'automation';
                var clusterShare = toNumber(cluster.share_prior, 0);
                var absorbedShare = clusterShare * exposure * automation * 0.82;
                var retainedShare = Math.max(0, clusterShare - absorbedShare);
                var elevationBoost = ELEVATION_CLUSTERS[cluster.task_cluster_id]
                    ? absorbedShare * (0.22 + signals.seniority * 0.18 + signals.roleDistinctiveness * 0.12)
                    : 0;
                var transformedShare = retainedShare + elevationBoost;

                absorbedTotal += absorbedShare;
                exposedTaskShare += clusterShare * exposure;
                automationMass += clusterShare * exposure * automation;
                augmentationMass += clusterShare * exposure * augmentation;
                transformedShares[cluster.task_cluster_id] = transformedShare;

                var clusterResult = {
                    task_cluster_id: cluster.task_cluster_id,
                    label: slugToLabel(cluster.task_cluster_id),
                    share_of_role: clusterShare,
                    exposure_score: exposure,
                    augmentation_likelihood: augmentation,
                    partial_automation_likelihood: toNumber(prior.partial_automation_likelihood, automation),
                    high_automation_likelihood: toNumber(prior.high_automation_likelihood, automation * 0.7),
                    residual_relevance: transformedShare,
                    evidence_confidence: average([
                        toNumber(cluster.evidence_confidence, 0.4),
                        toNumber(prior.evidence_confidence, 0.4)
                    ]),
                    primary_sources: parsePipeList(prior.primary_sources || cluster.source_mix || ''),
                    likely_mode: likelyMode
                };

                currentBundle.push(clusterResult);

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

            var strategicResidualShare = sum(retainedClusters.map(function (cluster) {
                return ELEVATION_CLUSTERS[cluster.task_cluster_id] ? cluster.residual_relevance : 0;
            }));

            var occupationExposure = occupationPrior ? toNumber(occupationPrior.exposure_score, 0.5) : 0.5;
            var occupationAdaptive = occupationPrior && occupationPrior.adaptive_capacity_score
                ? toNumber(occupationPrior.adaptive_capacity_score, 0.5)
                : (adaptationPrior ? toNumber(adaptationPrior.adaptive_capacity_score, 0.5) : 0.5);

            var residualViabilityScore = clamp(
                average([
                    1 - signals.fragility,
                    signals.roleDistinctiveness,
                    signals.couplingProtection,
                    strategicResidualShare,
                    1 - automationShare
                ]) * 0.65 + clamp(sum(Object.keys(transformedShares).map(function (key) { return transformedShares[key]; })), 0, 1) * 0.35,
                0,
                1
            );

            var adaptationScore = clamp(
                average([
                    occupationAdaptive,
                    adaptationPrior ? toNumber(adaptationPrior.transferability_score, 0.5) : 0.5,
                    adaptationPrior ? toNumber(adaptationPrior.learning_intensity_score, 0.5) : 0.5,
                    signals.adaptationEdge,
                    signals.seniority * 0.55 + 0.45
                ]),
                0,
                1
            );

            var transformationPressureScore = clamp(
                average([
                    exposedTaskShare,
                    automationShare,
                    signals.adoptionPressure,
                    occupationExposure,
                    signals.exposureReadiness
                ]) - (signals.couplingProtection * 0.12),
                0,
                1
            );

            var secondaryHazard = clamp(
                (transformationPressureScore * 0.45) +
                (automationShare * 0.20) +
                ((1 - residualViabilityScore) * 0.22) +
                ((1 - adaptationScore) * 0.13),
                0,
                1
            );

            var roleState;
            if (secondaryHazard >= 0.70 && residualViabilityScore < 0.40) {
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

            var topExposed = exposedClusters[0] || currentBundle[0] || null;
            var viabilityTier = toTier(residualViabilityScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var adaptationTier = toTier(adaptationScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var pressureTier = toTier(transformationPressureScore, [0.40, 0.68], ['low', 'moderate', 'high']);
            var balanceTier = automationShare >= 0.60
                ? 'mostly_automation'
                : (automationShare <= 0.42 ? 'mostly_augmentation' : 'mixed');

            var displacementWindowStart = 2027 + Math.round((1 - transformationPressureScore) * 5);
            var displacementWindowEnd = displacementWindowStart + (viabilityTier === 'weak' ? 2 : 4);

            var evidenceSummary = {
                task_evidence_confidence: average(currentBundle.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupation_prior_confidence: occupationPrior ? toNumber(occupationPrior.confidence, 0.45) : 0.40,
                residual_bundle_confidence: average([
                    average(currentBundle.map(function (cluster) { return cluster.evidence_confidence; })),
                    signals.roleDistinctiveness,
                    1 - signals.fragility
                ]),
                notes: [
                    occupationPrior ? ('Occupation prior source: ' + occupationPrior.source_id) : 'Occupation prior source: fallback heuristic',
                    'Task evidence is drawn from normalized task-cluster priors and occupation structure.',
                    laborContext ? ('Labor context includes employment=' + laborContext.employment_us + ', median_wage=' + laborContext.median_wage_usd + ', growth=' + laborContext.projection_growth_pct + '%.') : 'Labor context unavailable for this occupation.',
                    laborContext && laborContext.unemployment_group_label ? ('Latest official BLS unemployment for ' + laborContext.unemployment_group_label + ' is ' + laborContext.latest_unemployment_rate + '% (' + laborContext.latest_unemployment_period + ').') : 'No mapped BLS unemployment series for this occupation yet.'
                ]
            };

            var result = {
                selected_role_category: roleCategory,
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                likely_role_state: roleState,
                likely_role_state_label: ROLE_STATE_LABELS[roleState],
                top_exposed_task_cluster: topExposed ? topExposed.label : 'Unknown',
                exposed_task_share: Number(exposedTaskShare.toFixed(3)),
                automation_vs_augmentation_balance: balanceTier,
                augmentation_share: Number(augmentationShare.toFixed(3)),
                automation_share: Number(automationShare.toFixed(3)),
                residual_role_viability: viabilityTier,
                adaptation_capacity: adaptationTier,
                transformation_pressure_2030: pressureTier,
                transformation_map: {
                    current_bundle: currentBundle,
                    exposed_clusters: exposedClusters,
                    retained_clusters: retainedClusters,
                    elevated_clusters: elevatedClusters
                },
                narrative_summary: null,
                secondary_hazard: {
                    transformation_pressure_by_2030: Number(transformationPressureScore.toFixed(3)),
                    secondary_displacement_hazard: Number(secondaryHazard.toFixed(3)),
                    displacement_window_start: displacementWindowStart,
                    displacement_window_end: displacementWindowEnd,
                    confidence: Number(average([
                        evidenceSummary.task_evidence_confidence,
                        evidenceSummary.occupation_prior_confidence,
                        evidenceSummary.residual_bundle_confidence
                    ]).toFixed(3))
                },
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
                    fragility: Number(signals.fragility.toFixed(3)),
                    retained_transformed_share: Number(clamp(sum(Object.keys(transformedShares).map(function (key) {
                        return transformedShares[key];
                    })), 0, 1).toFixed(3)),
                    absorbed_share: Number(clamp(absorbedTotal, 0, 1).toFixed(3))
                }
            };

            result.narrative_summary = buildNarrative(result);
            return result;
        }

        return {
            getOccupationCandidates: function (roleCategory, limit) {
                return resolveCandidates(roleCategory, limit || 3);
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
