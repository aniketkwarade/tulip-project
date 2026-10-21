import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/watershed-forest-loss-reference-snapshot.json');
const checkedOn = '2026-09-23';
const mumbai = JSON.parse(await readFile(resolve(root, 'public/mumbai-watershed-forest-loss-impact-snapshot.json'), 'utf8'));

const endpoints = {
  caldwell: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:37080318%20AND%20SRC:MED&format=json&resulttype=core',
  rasolofoson: 'https://api.crossref.org/works/10.1088/1748-9326/abff88',
  forestRecovery: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_xml/PMC6402850/unicode',
  worldBankAnnex: 'https://documents1.worldbank.org/curated/en/099051525161534881/pdf/P180155-0f0375e6-9bea-4feb-a98d-5154778d5c55.pdf',
  treatmentCosts: 'https://research.fs.usda.gov/treesearch/69655',
  landscapeMetaAnalysis: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:38906080%20AND%20SRC:MED&format=json&resulttype=core',
};

async function fetchSource(url) {
  let lastStatus = 'request_failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' } });
    if (response.ok) return response;
    lastStatus = `HTTP ${response.status}`;
    if (response.status < 500 || attempt === 3) break;
    await new Promise(resolveRetry => setTimeout(resolveRetry, attempt * 500));
  }
  throw new Error(`${url}: ${lastStatus}`);
}

async function fetchText(url) {
  return (await fetchSource(url)).text();
}

async function fetchBytes(url) {
  return Buffer.from(await (await fetchSource(url)).arrayBuffer());
}

const [caldwellJson, rasolofosonJson, recoveryXml, worldBankPdf, treatmentCostsHtml, landscapeJson] = await Promise.all([
  fetchText(endpoints.caldwell),
  fetchText(endpoints.rasolofoson),
  fetchText(endpoints.forestRecovery),
  fetchBytes(endpoints.worldBankAnnex),
  fetchText(endpoints.treatmentCosts),
  fetchText(endpoints.landscapeMetaAnalysis),
]);
const caldwell = JSON.parse(caldwellJson).resultList.result[0];
const rasolofoson = JSON.parse(rasolofosonJson).message;
const rasolofosonAbstract = rasolofoson.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const treatmentCostsText = treatmentCostsHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();
const landscape = JSON.parse(landscapeJson).resultList.result[0];
const worldBankPdfDigest = createHash('sha256').update(worldBankPdf).digest('hex');

assert.equal(caldwell.doi, '10.1016/j.scitotenv.2023.163550');
assert.match(caldwell.abstractText, /1746 PWS drinking water intake facilities/i);
assert.match(caldwell.abstractText, /15\s*% had high raw water quality/i);
assert.match(caldwell.abstractText, /75\s*% had at least 50\s*% forest land cover upstream/i);

assert.equal(rasolofoson.DOI, '10.1088/1748-9326/abff88');
assert.match(rasolofosonAbstract, /Haiti and Honduras/i);
assert.match(rasolofosonAbstract, /3\.4 percentage points reduction/i);
assert.match(rasolofosonAbstract, /moderately forested/i);

for (const pattern of [
  /56 chronosequence sites/i,
  /80% recovery after 20 years/i,
  /only 34% recovery after 20 years/i,
  /median time of five decades/i,
  /Full recovery of species composition takes centuries/i,
]) assert.match(recoveryXml, pattern);

assert.equal(worldBankPdfDigest, 'b5702e5fc824bed88cd3d3e26f0c05ca691d1c19f1c91a35799c2cbc12e03c76');
assert.equal(worldBankPdf.byteLength, 7455807);

assert.match(treatmentCostsText, /1\s*% forest loss could increase treatment costs by 1\.7\s*%/i);
assert.match(treatmentCostsText, /0\.046\s*%[–-]0\.091\s*%/i);
assert.match(treatmentCostsText, /0\.951\s*%[–-]1\.144\s*%/i);
assert.match(treatmentCostsText, /modest net cost impacts overall \(<10\s*% for most facilities\)/i);

assert.equal(landscape.doi, '10.1016/j.watres.2024.121946');
assert.match(landscape.abstractText, /625 regional studies from 63 countries/i);
assert.match(landscape.abstractText, /Increasing forest cover, particularly low-latitude forests, significantly decreased the risk of water pollution/i);

assert.equal(mumbai.accumulated_impact.deforestation_induced_cost_inr_per_year_2010_2011_prices, 3730000);
assert.equal(mumbai.accumulated_impact.watershed_monitoring_site_count, 6);

const snapshot = {
  version: 'tulip_watershed_forest_loss_reference_2026_09_23_v2',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'watershed_forest_loss',
  sources: [
    {
      id: 'singh_mishra_mumbai_watershed_deforestation_costs_2014',
      title: mumbai.sources[0].name,
      publisher: mumbai.sources[0].publisher,
      doi: mumbai.sources[0].url,
      publicationDate: mumbai.sources[0].publication_date,
      metric: 'forest-cover change, turbidity and estimated drinking-water treatment cost in selected Mumbai water-supply watersheds',
      facts: {
        evidencePeriod: mumbai.metric_contract.assessment_period,
        geography: mumbai.metric_contract.geography,
        monitoringSites: mumbai.accumulated_impact.watershed_monitoring_site_count,
        treatmentPlantObservationEndYear: mumbai.accumulated_impact.treatment_plant_observation_end_year,
        annualTreatmentCostInr2010To2011Prices: mumbai.accumulated_impact.deforestation_induced_cost_inr_per_year_2010_2011_prices,
        forestCoverLossPctPerYear: mumbai.accumulated_impact.forest_cover_loss_percent_per_year_absolute,
        globalRepresentativeness: false,
      },
    },
    {
      id: 'caldwell_southeast_us_forest_water_quality_2023',
      title: caldwell.title,
      publisher: 'Science of the Total Environment; peer-reviewed study led by the USDA Forest Service',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/37080318/',
      doi: `https://doi.org/${caldwell.doi}`,
      publicationDate: caldwell.firstPublicationDate,
      metric: 'observed and modelled nitrogen, phosphorus and suspended-sediment water quality in relation to upstream land cover',
      facts: {
        geography: 'southeastern United States',
        publicWaterSupplyIntakes: 1746,
        highRawWaterQualityIntakesPct: 15,
        highQualityRunOfRiverIntakesWithAtLeastHalfForestUpstreamPct: 75,
        finding: 'Nitrogen, phosphorus and suspended-sediment concentrations generally decreased as forest cover increased, with substantial variation by catchment and intake setting.',
        globalRepresentativeness: false,
      },
    },
    {
      id: 'rasolofoson_watershed_forest_chlorination_2021',
      title: rasolofoson.title[0],
      publisher: rasolofoson.publisher,
      doi: `https://doi.org/${rasolofoson.DOI}`,
      publicationDate: '2021-05-25',
      metric: 'association between upstream forest influence and point-of-use chlorination effectiveness for childhood diarrhoea',
      facts: {
        geography: ['Haiti', 'Honduras'],
        averageChlorinationAssociatedDiarrhoeaReductionPercentagePoints: 3.4,
        finding: 'The study detected a significant chlorination association only where upstream watersheds were moderately forested; it did not estimate a global burden caused by forest loss.',
        causalBoundary: 'Observational study integrating household health and treatment data with upstream tree-cover influence; it does not randomize forest loss.',
        globalRepresentativeness: false,
      },
    },
    {
      id: 'rozendaal_neotropical_secondary_forest_recovery_2019',
      title: 'Biodiversity recovery of Neotropical secondary forests',
      publisher: 'Science Advances; peer-reviewed open-access multi-site analysis',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6402850/',
      doi: 'https://doi.org/10.1126/sciadv.aau3114',
      publicationDate: '2019-03-06',
      metric: 'tree-species richness and composition recovery in secondary forests relative to old-growth reference forest',
      facts: {
        chronosequenceSites: 56,
        geography: 'Neotropical secondary forests',
        speciesRichnessRecoveryAfter20YearsPct: 80,
        speciesCompositionRecoveryAfter20YearsPct: 34,
        medianSpeciesRichnessRecoveryYears: 50,
        fullSpeciesCompositionRecovery: 'centuries',
        watershedSpecificRecoveryMeasure: false,
      },
    },
    {
      id: 'world_bank_upstream_deforestation_child_diarrhoea_2025',
      title: "Nature's Paradox: Stepping Stone or Millstone? Chapter Annexes — Annex 3A",
      publisher: 'World Bank Group',
      articleUrl: 'https://hdl.handle.net/10986/42610',
      sourcePdf: endpoints.worldBankAnnex,
      publicationDate: '2025-05-15',
      metric: 'association between annual upstream forest-cover loss and two-week diarrhoeal-disease incidence among rural children younger than five',
      facts: {
        geography: 'rural communities in 54 developing countries',
        evidencePeriod: { start: 2004, end: 2020 },
        countries: 54,
        observations: 794517,
        population: 'children younger than five in georeferenced Demographic and Health Survey clusters',
        healthOutcomeWindowWeeks: 2,
        forestLossIncrementPercentagePoints: 1,
        nonRichestAdditionalDiarrhoeaProbabilityPercentagePoints: { lower: 0.611, upper: 0.788 },
        nonRichestRelativeIncreasePct: { lower: 4.73, upper: 6.11 },
        higherUnderrepresentationRelativeIncreasePct: { lower: 3.34, upper: 3.39 },
        pooledOls: true,
        forestLossSafeWaterInteractionCoefficient: -0.374,
        forestLossPipedWaterInteractionCoefficient: -1.467,
        sourcePdfSha256: worldBankPdfDigest,
        finding: 'The observed association is stronger for non-richest and politically underrepresented households, while access to safe or piped water reduces vulnerability.',
        causalBoundary: 'Pooled observational regressions with fixed effects and controls support an association and vulnerability gradient. They do not supply a randomized forest-loss effect or a global count of attributable cases.',
        globalRepresentativeness: false,
      },
    },
    {
      id: 'nehra_southeast_us_forest_loss_treatment_costs_2025',
      title: 'The potential impact of forest loss on drinking water treatment costs in the southeastern U.S.',
      publisher: 'Forest Policy and Economics; peer-reviewed study archived by the USDA Forest Service',
      articleUrl: endpoints.treatmentCosts,
      doi: 'https://doi.org/10.1016/j.forpol.2025.103603',
      publicationDate: '2025-10-01',
      metric: 'modelled drinking-water treatment-cost response to projected land-use and water-quality change',
      facts: {
        geography: 'southeastern United States',
        forestLossIncrementPct: 1,
        treatmentCostIncreasePct: 1.7,
        turbidityReductionPct: 1,
        treatmentCostReductionFromTurbidityPct: { lower: 0.046, upper: 0.091 },
        totalOrganicCarbonReductionPct: 1,
        treatmentCostReductionFromTotalOrganicCarbonPct: { lower: 0.951, upper: 1.144 },
        mostFacilitiesProjectedNetCostImpactPct: 'less than 10',
        projectedNotObservedCurrentBurden: true,
        finding: 'Projected forest loss can raise regional treatment costs, but the estimate is a future model result and cannot set current human severity or reach.',
        globalRepresentativeness: false,
      },
    },
    {
      id: 'wang_global_landscape_water_quality_meta_analysis_2024',
      title: landscape.title,
      publisher: 'Water Research; peer-reviewed meta-analysis',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/38906080/',
      doi: `https://doi.org/${landscape.doi}`,
      publicationDate: landscape.firstPublicationDate,
      metric: 'direction and heterogeneity of surface-water-quality responses to catchment landscape composition',
      facts: {
        regionalStudies: 625,
        countries: 63,
        finding: 'Increasing forest cover was associated with lower water-pollution risk, especially for biological and heavy-metal contamination and in low-latitude forests.',
        reachBoundary: 'Study and country counts describe evidence coverage, not the share of global watersheds currently harmed by forest loss.',
        globalRepresentativeness: false,
      },
    },
  ],
  evidenceSynthesis: {
    currentBurden: 'Realised treatment cost is measured in selected Mumbai water-supply watersheds through 2011. A newer 2004–2020 observational analysis links upstream forest loss to childhood diarrhoeal disease across rural communities in 54 developing countries, without estimating a global attributable burden.',
    mechanism: 'The 2021, 2023, 2024 and 2025 studies strengthen the pathway from upstream forest condition to raw-water quality, treatment effectiveness, health vulnerability and material costs across multiple regions.',
    severityBoundary: 'The health association supports material illness and the Mumbai study supports realised cost. Neither study count, sample size, intake count nor projected cost coefficient establishes severe outcomes for every affected person or collapse-equivalent ecosystem loss.',
    reachBoundary: 'Children observed, study sites, countries and public-water intakes are evidence coverage, not the global share of source-water watersheds, ecosystems or people experiencing attributable harm.',
    persistenceBoundary: 'Neotropical forest biodiversity recovery can take decades to centuries, but this is ecosystem recovery evidence and does not establish the duration of drinking-water consequences everywhere.',
    attributionBoundary: 'Water quality also depends on agriculture, development, geology, reservoirs and catchment properties. Forest cover cannot receive every observed water-quality effect.',
    currentDataGap: 'A current comparable reach estimate requires a geospatial join of recent annual forest-cover loss, source-water watershed boundaries, drinking-water intakes and people served. The literature sources alone do not supply that denominator.',
  },
  tulipUse: {
    admissible: [
      'Use the Mumbai study as direct regional evidence of realised material treatment cost, retaining its 2011 evidence endpoint and local geography.',
      'Use the 2021 and 2023 studies to strengthen mechanism plausibility and geographic transfer uncertainty, not to manufacture a global harmed-person count.',
      'Use the forest-recovery study as an ecosystem-persistence bound, with its Neotropical and metric limits retained.',
      'Use the 2025 World Bank analysis as direct multi-country evidence of a material human-health association and vulnerability gradient, retaining its observational design and 2004–2020 evidence period.',
      'Use the 2024 water-quality meta-analysis to corroborate the ecosystem pathway across regions, without converting study coverage into reach.',
      'Use the 2025 treatment-cost model only in the separate outlook and material-consequence context, not as observed current harm.',
    ],
    excluded: [
      'Do not use 1,746 public-water intakes as a harmed-person count or an affected-watershed denominator.',
      'Do not use 15%, 75% or 50% from the intake study as forest-loss severity or global reach.',
      'Do not treat a 3.4 percentage-point chlorination association as the health effect of forest loss itself.',
      'Do not use monitoring years, study counts or publication dates as consequence persistence.',
      'Do not mark the current burden as refreshed beyond 2011 merely because newer mechanism studies exist.',
      'Do not count 794,517 children, 54 countries, 625 studies or 63 countries as harmed people or affected ecosystem area.',
      'Do not use the projected 1.7% treatment-cost response as present harm or as an SSP2-4.5 projection.',
    ],
    scoreDisposition: 'Recalculate the candidate from direct health, material-cost, water-quality and recovery evidence. Keep a broad B–D range because current global reach and human recovery duration remain unmeasured.',
  },
};
snapshot.snapshotDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  evidenceSynthesis: snapshot.evidenceSynthesis,
  tulipUse: snapshot.tulipUse,
})).digest('hex');

await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, sources: snapshot.sources.length, snapshotDigest: snapshot.snapshotDigest }, null, 2));
