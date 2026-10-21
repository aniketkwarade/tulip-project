import whoJointAir2021 from '../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json' with { type: 'json' };
import whoJointAirDeaths2021 from '../artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json' with { type: 'json' };
import faoForestExtent2025 from '../artifacts/tulip-consequence-rule-audit-2026-09-27/fao-fra-2025-global-deforestation-extent.json' with { type: 'json' };
import gcrmnCoral2025 from '../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json' with { type: 'json' };
import whoJointAirCounterfactual from '../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-counterfactual-definition.json' with { type: 'json' };

// Independently stored source transcriptions. Registering a new row requires a
// source artifact and a review of its locator, scope, unit, precision and value.
// Registration prevents an assessment packet from defining its own "source"
// numbers; it does not itself certify the scientific model or whole-node scope.
const WHO_JOINT_AIR_2021_ID = 'who_world_health_statistics_2026_joint_air_2021';
export const WHO_JOINT_AIR_2021_ARTIFACT_SHA256 = 'a878efb73a3757b837f8b6701006b80a60b4f539f84e88707219e0c7d8f1ff70';
export const WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256 = 'eb36956fb1dff986945536c05db100a4b5cf5ae8f3e7d4b7ddbe4e5701c9a03f';
export const WHO_JOINT_AIR_DEATHS_2021_ARTIFACT_SHA256 = 'c6861260d29ffddea2a2d33d414384e50400d771eb46093d11b7db77fbb22d79';
export const FAO_FOREST_EXTENT_2025_ARTIFACT_SHA256 = '3d20761620e16d7309baedcddef5591a6c2e07e34b9e0bd2cecf52116d4e0039';
export const GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256 = 'a8c93b454c5634ee12b484edebcb65b2c2a070538d2786017b691d53224eef5f';

// The source defines the comparison case. A node packet cites its identity;
// it cannot relabel a modeled burden with its own baseline description.
export const REGISTERED_COUNTERFACTUAL_DEFINITIONS = Object.freeze({
  [whoJointAirCounterfactual.id]: Object.freeze({
    ...whoJointAirCounterfactual,
    appliesToSourceIds: Object.freeze([...whoJointAirCounterfactual.appliesToSourceIds]),
    notEquivalentTo: Object.freeze([...whoJointAirCounterfactual.notEquivalentTo]),
    artifactSha256: WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256,
  }),
});

const gcrmnGlobalCoral = gcrmnCoral2025.endpoints.globalHardCoralCondition;
const gcrmn2023 = gcrmnGlobalCoral.series.find(row => row.year === 2023);
const gcrmn2024 = gcrmnGlobalCoral.series.find(row => row.year === 2024);
export const REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS = Object.freeze({
  gcrmn_global_hard_coral_cover_2023_2024: Object.freeze({
    sourceId: 'gcrmn_global_hard_coral_cover_2023_2024',
    sourceVersion: gcrmnCoral2025.version,
    sourceArtifactSha256: GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256,
    sourceUrl: gcrmnCoral2025.sources.gcrmn2025.reportDoi,
    sourceLocator: 'GCRMN 2025 global modelled hard-coral cover annual series, 2023 and 2024; mapped reef area in 51-subregion distribution.',
    geography: 'global_reef_area_weighted',
    ecosystemType: 'shallow_water_coral_reefs',
    outcomeKind: 'live_hard_coral_cover_change',
    coverUnit: 'percent_reef_surface',
    areaUnit: 'km2',
    yearBefore: 2023,
    yearAfter: 2024,
    beforeCoverPct: gcrmn2023.medianPct,
    afterCoverPct: gcrmn2024.medianPct,
    mappedReefAreaKm2: gcrmnCoral2025.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2 / 1e6,
    pairedChangeUncertaintyInterval: null,
  }),
});
export const REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS = Object.freeze({
  gcrmn_global_hard_coral_cover_2025: Object.freeze({
    sourceId: 'gcrmn_global_hard_coral_cover_2025',
    sourceVersion: gcrmnCoral2025.version,
    sourceArtifactSha256: GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256,
    sourceUrl: gcrmnCoral2025.sources.gcrmn2025.reportDoi,
    sourceLocator: 'GCRMN 2025 global modeled hard-coral cover, 1980–2009 reference and 2020–2024 current period.',
    repositoryCommit: gcrmnCoral2025.sources.gcrmn2025.repositoryCommit,
    geography: 'global_reef_area_weighted',
    ecosystemType: 'shallow_water_coral_reefs',
    outcomeKind: 'live_hard_coral_cover_condition',
    unit: 'percent_reef_surface',
    reportingPeriodBasis: 'modelled_period_mean',
    referenceStartYear: gcrmnGlobalCoral.referencePeriod.start,
    referenceEndYear: gcrmnGlobalCoral.referencePeriod.end,
    currentStartYear: gcrmnGlobalCoral.currentPeriod.start,
    currentEndYear: gcrmnGlobalCoral.currentPeriod.end,
    referenceCoverPct: gcrmnGlobalCoral.referencePeriod.meanModelledCoverPct,
    currentCoverPct: gcrmnGlobalCoral.currentPeriod.meanModelledCoverPct,
    periodMeanUncertaintyInterval: null,
  }),
});

export const REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS = Object.freeze({
  [faoForestExtent2025.sourceId]: Object.freeze({
    sourceId: faoForestExtent2025.sourceId,
    sourceVersion: faoForestExtent2025.version,
    sourceArtifactSha256: FAO_FOREST_EXTENT_2025_ARTIFACT_SHA256,
    sourceUrl: faoForestExtent2025.sourceUrl,
    sourceLocator: 'FAO FRA 2025 release, Key findings: Deforestation and expansion; 2015–2025.',
    ...faoForestExtent2025.scope,
    ...faoForestExtent2025.grossDeforestationRate,
  }),
});

export const REGISTERED_DALY_OBSERVATIONS = Object.freeze({
  [WHO_JOINT_AIR_2021_ID]: Object.freeze({
    sourceId: WHO_JOINT_AIR_2021_ID,
    sourceVersion: whoJointAir2021.version,
    sourceArtifactSha256: WHO_JOINT_AIR_2021_ARTIFACT_SHA256,
    sourceUrl: whoJointAir2021.sourceUrl,
    sourcePdfSha256: whoJointAir2021.sourcePdfSha256,
    sourceLocator: whoJointAir2021.locator,
    endpointId: 'who_joint_air_pollution_attributable_dalys',
    affectedGroup: 'global_population_with_attributable_health_loss',
    geography: whoJointAir2021.scope.geography,
    assessmentPeriod: String(whoJointAir2021.scope.year),
    includedCauses: whoJointAir2021.scope.cause,
    counterfactualId: whoJointAirCounterfactual.id,
    counterfactualVersion: whoJointAirCounterfactual.version,
    counterfactualArtifactSha256: WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256,
    reportingPeriodBasis: whoJointAir2021.scope.reportingPeriodBasis,
    reportedResolutionDalys: whoJointAir2021.modeledDalys.reportedResolutionDalys,
    outcomeKind: 'attributable_dalys',
    unit: 'DALY',
    normalization: 'absolute_total',
    lower: whoJointAir2021.modeledDalys.lower95,
    central: whoJointAir2021.modeledDalys.central,
    upper: whoJointAir2021.modeledDalys.upper95,
  }),
});

export const REGISTERED_DIRECT_OUTCOME_OBSERVATIONS = Object.freeze({
  who_air_35_global_2021: Object.freeze({
    sourceId: 'who_air_35_global_2021',
    sourceVersion: whoJointAirDeaths2021.version,
    sourceArtifactSha256: WHO_JOINT_AIR_DEATHS_2021_ARTIFACT_SHA256,
    sourceUrl: whoJointAirDeaths2021.sourceUrl,
    sourceLocator: 'AIR_35; GLOBAL; 2021; both sexes; all included causes',
    endpointId: 'who_joint_air_pollution_attributable_deaths',
    affectedGroup: 'Modeled attributable deaths worldwide',
    geography: whoJointAirDeaths2021.scope.geography,
    assessmentWindow: String(whoJointAirDeaths2021.scope.year),
    outcomeKind: 'attributable_deaths',
    unit: 'modeled deaths',
    value: whoJointAirDeaths2021.modeledDeaths.central,
    lower: whoJointAirDeaths2021.modeledDeaths.lower95,
    upper: whoJointAirDeaths2021.modeledDeaths.upper95,
  }),
});
