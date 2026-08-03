export const PERSONAL_FOOTPRINT_CONTEXT_VERSION = '2026-07-30';

export const CARBON_PERCENTILE_ANCHORS = Object.freeze([
  { percentile: 20, tonnesCo2e: 1.8 },
  { percentile: 50, tonnesCo2e: 3.1 },
  { percentile: 90, tonnesCo2e: 13 },
  { percentile: 99, tonnesCo2e: 46 },
  { percentile: 99.9, tonnesCo2e: 130 },
  { percentile: 99.99, tonnesCo2e: 569 }
]);

export const FOOTPRINT_EQUIVALENCY_FACTORS = Object.freeze({
  carbonTonnesPerGasolineVehicleYear: 4.29,
  carbonTonnesPerGasolineVehicleMile: 0.000393,
  litresPerAverageShower: 65.1,
  landM2PerBasketballCourt: 436.64,
  materialTonnesPerIllustrativeCar: 2
});

export const FOOTPRINT_CONTEXT_REFERENCES = Object.freeze({
  carbonGlobalAverageTonnes: 6.6,
  carbonOnePointFiveDegreeTonnes: 1.1,
  waterGlobalAverageM3: 1385,
  landGlobalAverageM2: 1900,
  landPlanetaryBoundaryM2: 2500,
  materialGlobalAverageTonnes: 12.3
});

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function interpolateLogarithmically(value, lower, upper) {
  const valueLog = Math.log(Math.max(value, Number.EPSILON));
  const lowerLog = Math.log(lower.tonnesCo2e);
  const upperLog = Math.log(upper.tonnesCo2e);
  const progress = clamp((valueLog - lowerLog) / (upperLog - lowerLog), 0, 1);
  return lower.percentile + ((upper.percentile - lower.percentile) * progress);
}

export function estimateGlobalCarbonPercentile(tonnesCo2e) {
  const value = Number(tonnesCo2e);
  if (!Number.isFinite(value) || value < 0) return null;

  const first = CARBON_PERCENTILE_ANCHORS[0];
  const last = CARBON_PERCENTILE_ANCHORS[CARBON_PERCENTILE_ANCHORS.length - 1];

  if (value < first.tonnesCo2e) {
    return {
      kind: 'below-range',
      percentile: null,
      label: 'Below the 20th percentile',
      populationLabel: 'Among the lowest 20% of global population',
      comparisonText: 'Among the lowest-emitting 20% globally',
      sourcePrecision: 'bounded'
    };
  }

  if (value >= last.tonnesCo2e) {
    return {
      kind: 'above-range',
      percentile: last.percentile,
      label: 'Above the 99.99th percentile',
      populationLabel: 'Above 99.99% of global population',
      comparisonText: 'Higher than at least 99.99% of people globally',
      sourcePrecision: 'bounded'
    };
  }

  const upperIndex = CARBON_PERCENTILE_ANCHORS.findIndex(anchor => value < anchor.tonnesCo2e);
  const lower = CARBON_PERCENTILE_ANCHORS[upperIndex - 1];
  const upper = CARBON_PERCENTILE_ANCHORS[upperIndex];
  const percentile = interpolateLogarithmically(value, lower, upper);
  const roundedPercentile = percentile < 99 ? Math.round(percentile) : Math.round(percentile * 10) / 10;

  return {
    kind: 'estimate',
    percentile: roundedPercentile,
    label: `≈ ${formatOrdinal(roundedPercentile)} percentile`,
    populationLabel: `Around ${formatPercent(roundedPercentile)} of global population`,
    comparisonText: `Higher than roughly ${formatPercent(roundedPercentile)} of people globally`,
    sourcePrecision: 'interpolated'
  };
}

export function formatOrdinal(value) {
  if (!Number.isFinite(value)) return '';
  if (!Number.isInteger(value)) return `${value.toFixed(1)}th`;
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${value}th`;
  const suffix = value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}

function formatPercent(value) {
  return value < 99 ? `${Math.round(value)}%` : `${value.toFixed(1)}%`;
}

function formatRelativeBenchmark(value, reference, label) {
  const differencePercent = Math.round(Math.abs((value / reference) - 1) * 100);
  if (differencePercent <= 2) return `Near ${label}`;
  return `${differencePercent}% ${value > reference ? 'above' : 'below'} ${label}`;
}

function formatWholeComparison(value, singular, plural = `${singular}s`) {
  const rounded = Math.max(1, Math.round(value));
  const ratio = value / rounded;
  const qualifier = ratio < 0.95 ? 'Nearly' : ratio > 1.05 ? 'More than' : '~';
  const count = `${rounded.toLocaleString('en-US')} ${rounded === 1 ? singular : plural}`;
  return qualifier === '~' ? `~${count}` : `${qualifier} ${count}`;
}

function roundReadableCount(value) {
  const interval = value >= 10000 ? 1000 : value >= 1000 ? 100 : value >= 100 ? 10 : 1;
  return Math.max(1, Math.round(value / interval) * interval);
}

export function getFootprintEquivalencies({
  carbonTotal = 0,
  waterTotalM3 = 0,
  landTotalM2 = 0,
  materialTotalTonnes = 0
} = {}) {
  const carbonVehicleYears = carbonTotal / FOOTPRINT_EQUIVALENCY_FACTORS.carbonTonnesPerGasolineVehicleYear;
  const carbonUsesCars = carbonVehicleYears >= 0.75;
  const carbonMiles = roundReadableCount(
    carbonTotal / FOOTPRINT_EQUIVALENCY_FACTORS.carbonTonnesPerGasolineVehicleMile
  );
  const waterLitres = Math.round(waterTotalM3 * 1000);
  const showers = roundReadableCount(waterLitres / FOOTPRINT_EQUIVALENCY_FACTORS.litresPerAverageShower);
  const basketballCourts = landTotalM2 / FOOTPRINT_EQUIVALENCY_FACTORS.landM2PerBasketballCourt;
  const materialCarMasses = materialTotalTonnes / FOOTPRINT_EQUIVALENCY_FACTORS.materialTonnesPerIllustrativeCar;

  return [
    {
      key: 'carbon',
      label: 'Carbon emissions',
      headline: carbonUsesCars
        ? formatWholeComparison(carbonVehicleYears, 'car')
        : `~${carbonMiles.toLocaleString('en-US')} miles`,
      descriptor: carbonUsesCars
        ? 'driven for an entire year'
        : 'driven in a gasoline car',
      evidence: `≈ ${carbonTotal.toFixed(1)} tonnes CO₂e annually`,
      context: [
        formatRelativeBenchmark(
          carbonTotal,
          FOOTPRINT_CONTEXT_REFERENCES.carbonGlobalAverageTonnes,
          'the 2019 global average'
        ),
        `${(carbonTotal / FOOTPRINT_CONTEXT_REFERENCES.carbonOnePointFiveDegreeTonnes).toFixed(1)}× the 1.5°C-aligned level`
      ],
      className: 'is-carbon'
    },
    {
      key: 'water',
      label: 'Water footprint',
      headline: `~${showers.toLocaleString('en-US')} showers`,
      descriptor: 'worth of water every year',
      evidence: `≈ ${waterLitres.toLocaleString('en-US')} litres annually`,
      context: [
        formatRelativeBenchmark(
          waterTotalM3,
          FOOTPRINT_CONTEXT_REFERENCES.waterGlobalAverageM3,
          'the global consumer average'
        )
      ],
      className: 'is-water'
    },
    {
      key: 'land',
      label: 'Land footprint',
      headline: formatWholeComparison(basketballCourts, 'basketball court'),
      descriptor: 'of cropland used throughout the year',
      evidence: `≈ ${Math.round(landTotalM2).toLocaleString('en-US')} m² annually`,
      context: [
        formatRelativeBenchmark(
          landTotalM2,
          FOOTPRINT_CONTEXT_REFERENCES.landGlobalAverageM2,
          'the global average'
        ),
        `${Math.round((landTotalM2 / FOOTPRINT_CONTEXT_REFERENCES.landPlanetaryBoundaryM2) * 100)}% of the cropland boundary`
      ],
      className: 'is-nature'
    },
    {
      key: 'materials',
      label: 'Material footprint',
      headline: formatWholeComparison(materialCarMasses, 'car'),
      descriptor: 'in raw-material weight every year',
      evidence: `≈ ${materialTotalTonnes.toFixed(1)} tonnes extracted and processed`,
      context: [
        formatRelativeBenchmark(
          materialTotalTonnes,
          FOOTPRINT_CONTEXT_REFERENCES.materialGlobalAverageTonnes,
          'the 2022 global average'
        )
      ],
      className: 'is-material'
    }
  ];
}
