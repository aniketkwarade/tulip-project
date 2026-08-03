import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'peru_chrysaora_plocamia_bycatch_2008_2009_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'quinones_peru_jellyfish_bycatch_profit_2013',
      name: 'Jellyfish bycatch diminishes profit in an anchovy fishery off Peru',
      publisher: 'Fisheries Research',
      publication_date: '2013-03-01',
      url: 'https://doi.org/10.1016/j.fishres.2012.04.014',
      source_locators: [
        'During austral summer 2008–2009 off southern Peru, Chrysaora plocamia exceeded 30 percent of catch weight in 5 percent of observed hauls.',
        'Processing plants refused catches when jellyfish exceeded 40 percent by weight.',
        'The study estimated more than US$200,000 of losses during 35 fishing days using observer bycatch rates and interviews with processing-factory employees.'
      ]
    },
    {
      id: 'pices_jellyfish_working_group_peru_bycatch_2017',
      name: 'PICES Jellyfish Working Group Final Report',
      publisher: 'North Pacific Marine Science Organization',
      publication_date: '2017-01-01',
      url: 'https://www.pices.int/outgoing/2018-Climate/USB-files/Rpt51_Jellyfish.pdf',
      source_locators: [
        'The report preserves the Peru observer result that jellyfish exceeded 10 percent of catch weight in 10 percent of hauls and exceeded 30 percent in 5 percent of hauls.',
        'Catches above the 40-percent rejection threshold were refused 13 times at Ilo, with about 387 tonnes discarded.',
        'The bounded 35-day economic loss was approximately US$200,000; seasonal and national extrapolations are excluded from scoring.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'jellyfish_swarm_surges',
    metric_id: 'jellyfish_bloom_frequency_biomass_and_duration',
    unit: 'jellyfish share of catch biomass, affected-haul frequency, rejected catch mass, event days and realized loss',
    geography: 'southern Peruvian anchovy purse-seine fishery and the port of Ilo',
    assessment_period: '35 fishing days during the austral summer 2008–2009 bloom period',
    boundary: 'The receipt uses observer-based relative jellyfish biomass in named fishery hauls and realized processing rejection. It does not convert bycatch share to water-column density, infer causation by climate or fishing pressure, or score seasonal and national extrapolations.'
  },
  accumulated_impact: {
    hauls_above_10_percent_jellyfish_catch_share_percent: 10,
    hauls_above_30_percent_jellyfish_catch_share_percent: 5,
    jellyfish_catch_share_threshold_percent_scored: 30,
    processing_plant_rejection_threshold_percent: 40,
    rejected_catch_event_count: 13,
    rejected_catch_mass_tonnes: 387,
    bounded_loss_usd_more_than: 200000,
    observed_fishing_day_count: 35,
    seasonal_loss_extrapolation_usd_unscored: 1200000,
    national_annual_loss_extrapolation_usd_unscored: 7100000
  },
  reviewed_normalization_anchors: {
    jellyfish_catch_share_percent: [0, 5, 15, 40],
    bounded_loss_usd: [0, 25000, 100000, 300000],
    event_days: [0, 3, 14, 60],
    rejected_event_count: [0, 1, 5, 20]
  },
  uncertainty: 'Catch-share observations are a fishery-dependent relative-biomass indicator, not an individuals-per-cubic-metre water-column survey. Loss estimates combine observer records with factory interviews and are specific to fishing and processing practices at the time. The source reports values as thresholds or approximate lower bounds. Seasonal, national and climate-linked extrapolations remain unscored, and a single regional episode does not establish a global upward trend in jellyfish blooms.'
};

await fs.writeFile(path.join(ROOT, 'public/peru-jellyfish-bycatch-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/peru-jellyfish-bycatch-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
