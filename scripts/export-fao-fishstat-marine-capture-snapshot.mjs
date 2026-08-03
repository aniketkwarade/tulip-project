import fs from 'node:fs/promises';
import path from 'node:path';

const annual = [
  [1991, 77448074.900], [1992, 78997135.520], [1993, 79999415.995], [1994, 85413300.395],
  [1995, 84954301.672], [1996, 86356609.472], [1997, 85696515.032], [1998, 78021273.751],
  [1999, 83460811.140], [2000, 84969915.611], [2001, 82239537.787], [2002, 82674158.903],
  [2003, 79713633.363], [2004, 84216522.103], [2005, 83085238.478], [2006, 80409500.997],
  [2007, 80478324.600], [2008, 79384707.982], [2009, 78715242.294], [2010, 76316009.109],
  [2011, 81054027.313], [2012, 77739191.612], [2013, 78782481.893], [2014, 79254002.350],
  [2015, 80482524.214], [2016, 78195590.523], [2017, 81141936.636], [2018, 84164253.792],
  [2019, 80146233.770], [2020, 77930873.360], [2021, 79926781.238], [2022, 78991160.291],
  [2023, 78372507.279], [2024, 79619643.538]
].map(([year, tonnes]) => ({ year, tonnes }));

if (annual.length < 20) throw new Error('Marine capture history must contain at least 20 complete annual observations.');
if (annual.some((row, index) => index > 0 && row.year !== annual[index - 1].year + 1)) throw new Error('Marine capture history must be contiguous.');

const OUTPUT_PATH = path.resolve('public/fao-fishstat-marine-capture-snapshot.json');
const snapshot = {
  version: 'fao_fishstat_global_marine_capture_2026_1_0',
  captured_at: new Date().toISOString(),
  source: {
    id: 'fao_fishstat_global_marine_capture_2026',
    name: 'FAO FishStat Global Capture Production 2026.1.0',
    publisher: 'Food and Agriculture Organization of the United Nations',
    url: 'https://www.fao.org/fishery/static/FishStatJ/FAO_FI_Global_Production_2026.1.0.fws',
    documentation_url: 'https://www.fao.org/fishery/en/collection/capture',
    extraction_package_url: 'https://cran.r-project.org/package=fishstat'
  },
  ingestion_job_id: 'export_fao_fishstat_marine_capture_snapshot',
  metric_contract_ids: ['marine_fish_landings_shortfall'],
  contract_bindings: [{ node_id: 'fish_landing_supply_disruption', metric_id: 'marine_fish_landings_shortfall', measurement_role: 'global_annual_marine_capture_production_primary' }],
  cadence: 'Annual after the FAO FishStat Global Production release.',
  provenance: 'FAO FishStat 2026.1.0 capture quantities filtered to tonnes live weight, FAO marine fishing areas, and the SOFIA Fish, crustaceans and molluscs yearbook category, then summed globally by year. The official workspace and extraction package are checksum-bound.',
  uncertainty: 'National submissions include official, estimated, provisional and negligible-value flags; reporting coverage, illegal or unreported catch, species and area attribution, revisions and live-weight conversions affect totals. Global stability can mask severe regional or species-level disruption.',
  failure_behavior: 'Retain the last checksum-validated release and mark stale. Reject non-contiguous histories, fewer than 20 complete baseline years, non-tonnage measures or changed marine-area classification. Never combine inland capture or aquaculture, fill missing years with zero or infer local landings from the global aggregate.',
  extraction: {
    official_workspace_sha256: 'e232ca53320c1b93b497cf98999007cd50cba6c0eec3d49b61656fd3989c126c',
    extraction_package_version: '2026.1.0.0',
    extraction_package_sha256: '543531f00a624d0b238135face88f1f5402c0e398c4dac0546de56414b88fdd5',
    capture_rdata_sha256: '25f9089cf28724efc7e14daaa5805d38c4dd58dd9df1f873b9984c2f8ce9219e',
    measure_filter: 'Q_tlw',
    area_filter: 'inlandmarine == Marine areas',
    species_filter: 'yearbook contains Fish, crustaceans and molluscs'
  },
  baseline: { start_year: 1991, end_year: 2020, complete_annual_observations: 30 },
  series: annual,
  excluded_from_scoring: ['inland capture', 'aquaculture', 'number-of-individual records', 'regional disruption inference', 'unreported-catch adjustment']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, years: annual.length, latest: annual.at(-1) }, null, 2));
