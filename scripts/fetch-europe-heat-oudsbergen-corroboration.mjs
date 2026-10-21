import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const outputPath = path.join(artifactDir, 'europe-heat-oudsbergen-secondary-corroboration.json');
const checkedOn = '2026-09-23';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const round = (value, digits = 3) => Number(value.toFixed(digits));
const sources = {
  opglabbeek: 'https://allecijfers.be/deelgemeente/opglabbeek/',
  oudsbergen: 'https://allecijfers.be/gemeente/oudsbergen/',
};

async function fetchHtml(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(180_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+population-boundary-corroboration)' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function populationForYear(html, year) {
  const sectionStart = html.search(/id=['"]inwoners['"]/i);
  assert(sectionStart >= 0, 'population section not found');
  const section = html.slice(sectionStart, sectionStart + 50_000);
  const match = section.match(new RegExp(`<tr><td>${year}<\\/td><td>([0-9.]+)<\\/td>`, 'i'));
  assert(match, `${year} population row not found`);
  return Number(match[1].replaceAll('.', ''));
}

const [opglabbeekBuffer, oudsbergenBuffer] = await Promise.all([
  fetchHtml(sources.opglabbeek),
  fetchHtml(sources.oudsbergen),
]);
const opglabbeekHtml = opglabbeekBuffer.toString('utf8');
const oudsbergenHtml = oudsbergenBuffer.toString('utf8');
assert.match(opglabbeekHtml, /data van\s*<abbr[^>]*>STATBEL<\/abbr>/i);
assert.match(opglabbeekHtml, /op 1 januari in het bevolkingsregister/i);
assert.match(oudsbergenHtml, /data van\s*<abbr[^>]*>STATBEL<\/abbr>/i);
assert.match(oudsbergenHtml, /op 1 januari in het bevolkingsregister/i);

const opglabbeek2022 = populationForYear(opglabbeekHtml, 2022);
const oudsbergen2022 = populationForYear(oudsbergenHtml, 2022);
const impliedMeeuwenGruitrode2022 = oudsbergen2022 - opglabbeek2022;
assert.equal(opglabbeek2022, 10_444);
assert.equal(oudsbergen2022, 23_611);
assert.equal(impliedMeeuwenGruitrode2022, 13_167);

const supplement = JSON.parse(await readFile(path.join(artifactDir, 'europe-heat-population-boundary-supplement.json'), 'utf8'));
const merge = supplement.belgiumEstoniaBoundaryChanges.mergeAllocations[0];
assert.equal(merge.newLauName, 'Oudsbergen');
assert.equal(merge.population2022, 23_641);
const opglabbeekComponent = merge.oldComponents.find(row => row.oldLauName === 'Opglabbeek');
const meeuwenComponent = merge.oldComponents.find(row => row.oldLauName === 'Meeuwen-Gruitrode');
assert(opglabbeekComponent && meeuwenComponent);
const proportionalOpglabbeek2022 = merge.population2022 * opglabbeekComponent.allocationShare;
const proportionalMeeuwenGruitrode2022 = merge.population2022 * meeuwenComponent.allocationShare;

const currentBe221 = supplement.belgiumEstoniaBoundaryChanges.regions.find(row => row.regionId === 'BE221').population2022;
const currentBe222 = supplement.belgiumEstoniaBoundaryChanges.regions.find(row => row.regionId === 'BE222').population2022;
const secondaryBe221 = currentBe221 - proportionalOpglabbeek2022 + opglabbeek2022;
const secondaryBe222 = currentBe222 - proportionalMeeuwenGruitrode2022 + impliedMeeuwenGruitrode2022;
const currentTotal = supplement.checks.fullySupplementedSensitivityTotal;
const secondaryTotal = currentTotal - merge.population2022 + oudsbergen2022;

const payload = {
  version: 'tulip_europe_heat_oudsbergen_secondary_corroboration_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'secondary_corroboration_ingested_not_primary_calibration_input',
  productionRatingsEnabled: 0,
  purpose: 'Quantify the residual Oudsbergen split uncertainty while an accessible date-defined Statbel small-area file remains unavailable to the automated pipeline.',
  sourceBoundary: {
    publisher: 'AlleCijfers.be',
    publisherType: 'secondary statistical presentation',
    claimedUnderlyingSource: 'Statbel',
    claimedReferenceDate: '1 January of each year',
    licenceForReuse: 'not established in this ingestion',
    admissionRule: 'Corroboration and sensitivity only. These values cannot replace a directly ingested Statbel file in calibration.',
  },
  sources: {
    opglabbeek: { url: sources.opglabbeek, bytes: opglabbeekBuffer.length, sha256: sha256(opglabbeekBuffer) },
    oudsbergen: { url: sources.oudsbergen, bytes: oudsbergenBuffer.length, sha256: sha256(oudsbergenBuffer) },
    boundarySupplement: { version: supplement.version, digest: supplement.digest },
  },
  observed2022: {
    opglabbeek: opglabbeek2022,
    oudsbergen: oudsbergen2022,
    meeuwenGruitrodeImpliedBySubtraction: impliedMeeuwenGruitrode2022,
  },
  comparisonWithCurrentSensitivity: {
    lauEditionOudsbergenPopulation: merge.population2022,
    secondaryOudsbergenPopulation: oudsbergen2022,
    totalDifference: oudsbergen2022 - merge.population2022,
    currentProportionalAllocation: {
      opglabbeek: round(proportionalOpglabbeek2022),
      meeuwenGruitrode: round(proportionalMeeuwenGruitrode2022),
    },
    secondaryPredecessorValues: {
      opglabbeek: opglabbeek2022,
      meeuwenGruitrode: impliedMeeuwenGruitrode2022,
    },
    allocationDifference: {
      opglabbeek: round(opglabbeek2022 - proportionalOpglabbeek2022),
      meeuwenGruitrode: round(impliedMeeuwenGruitrode2022 - proportionalMeeuwenGruitrode2022),
    },
    currentRegionSensitivity: { BE221: currentBe221, BE222: currentBe222 },
    secondaryRegionSensitivity: { BE221: round(secondaryBe221), BE222: round(secondaryBe222) },
    currentFullySupplementedTotal: currentTotal,
    secondaryFullySupplementedTotal: round(secondaryTotal),
    totalChange: round(secondaryTotal - currentTotal),
  },
  interpretation: {
    finding: 'The secondary 1 January series differs from the LAU-edition Oudsbergen total by 30 people and shifts roughly 50 people between BE221 and BE222 relative to the proportional allocation.',
    ratingEffect: 'None. The discrepancy is negligible for the Europe-wide population total and does not resolve the missing regional temperature pattern or terminal endpoint uncertainty.',
    nextRequiredEvidence: 'Download and checksum-pin the direct Statbel 1 January 2022 predecessor-area population data, with its licence and definitions, before replacing the declared proportional split.',
  },
};
payload.digest = sha256(Buffer.from(JSON.stringify({ sources: payload.sources, observed2022: payload.observed2022, comparison: payload.comparisonWithCurrentSensitivity })));
await mkdir(artifactDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), status: payload.status, observed2022: payload.observed2022, comparison: payload.comparisonWithCurrentSensitivity, digest: payload.digest }, null, 2));
