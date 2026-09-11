import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { NODES } from '../src/data.js';

const OUTPUT_URL = new URL('../src/recent-major-events.generated.json', import.meta.url);
const GDELT_ENDPOINT = process.env.GDELT_API_BASE || 'https://api.gdeltproject.org/api/v2/doc/doc';
const BING_NEWS_ENDPOINT = process.env.BING_NEWS_RSS_BASE || 'https://www.bing.com/news/search';
const EVENTS_PER_NODE = 3;
const RECENCY_YEARS = 3;
const MAX_ARTICLES_PER_QUERY = 250;
const GDELT_TIMESPAN = process.env.RECENT_EVENTS_TIMESPAN || '3years';
const PROVIDER_TIMEOUT_MS = 20_000;
const ARTICLE_TIMEOUT_MS = 15_000;
const QUERY_CONCURRENCY = Math.min(4, Math.max(1, Number.parseInt(process.env.RECENT_EVENTS_QUERY_CONCURRENCY || '2', 10)));
const ARTICLE_CONCURRENCY = 6;
const MAX_FETCH_ATTEMPTS = 3;
const TARGET_APPROVED_ARTICLES = 12;
const BING_TRUSTED_SITE_FILTERS = Object.freeze([
  '(site:nature.com OR site:phys.org OR site:theguardian.com OR site:apnews.com OR site:reuters.com OR site:carbonbrief.org)',
  '(site:mongabay.com OR site:theconversation.com OR site:bbc.com OR site:npr.org OR site:aljazeera.com OR site:scientificamerican.com)'
]);
const TODAY_DATE = new Date().toISOString().slice(0, 10);
const minimumRecentDate = new Date(`${TODAY_DATE}T00:00:00Z`);
minimumRecentDate.setUTCFullYear(minimumRecentDate.getUTCFullYear() - RECENCY_YEARS);
const MINIMUM_RECENT_DATE = minimumRecentDate.toISOString().slice(0, 10);

const SEARCH_QUERY_OVERRIDES = Object.freeze({
  food: [
    '("food crisis" OR "food shortage" OR "food insecurity") agriculture',
    '("crop failure" OR "food price spike" OR famine)'
  ],
  industry_farming: [
    '("industrial agriculture" OR "factory farming" OR "intensive livestock" OR monoculture) environment',
    '(fertilizer runoff OR livestock pollution OR agricultural pollution)'
  ],
  personal_conveyance: [
    '("car dependence" OR "private vehicles" OR "vehicle emissions") transport'
  ],
  environ_anomalies: [
    '("compound climate hazards" OR "compound weather extremes")'
  ],
  amoc: [
    '("AMOC slowdown" OR "Atlantic overturning circulation" OR "Atlantic circulation weakening")'
  ],
  wet_bulb_heat: [
    '("wet bulb heat" OR "humid heat")'
  ],
  monsoon_volatility: [
    '("erratic monsoon" OR "monsoon rainfall extremes" OR "monsoon flooding")'
  ],
  rain_on_snow_flood_risk: [
    'snowmelt rainfall flooding',
    '("rain on snow" OR "rain-on-snow")',
    'snowpack rainfall flooding'
  ],
  peak_glacier_runoff_passage: [
    '("peak water" glacier OR "glacier runoff decline" OR "glacier meltwater decline")'
  ],
  thermal_stratification_intensification: [
    '("ocean stratification" OR "water column stratification") warming'
  ],
  marine_pathogen_range_expansion: [
    '("marine pathogens" OR "Vibrio bacteria" OR "flesh eating bacteria") warming'
  ],
  delta_salt_intrusion_fronts: [
    '("saltwater intrusion" OR "salt intrusion") delta'
  ],
  tropical_cyclone_rapid_intensification: [
    '("rapid intensification" OR "rapidly intensified") hurricane',
    '("rapid intensification" OR "rapidly intensified") cyclone'
  ],
  oceanic_upwelling_disruptions: [
    '("ocean upwelling" OR "coastal upwelling") disruption'
  ],
  pyrocumulonimbus_smoke_injection: [
    '(pyrocumulonimbus OR "fire thunderstorm") smoke'
  ],
  coastal_permafrost_erosion: [
    '("Arctic coastal erosion" OR "permafrost coast")'
  ],
  data_centers: [
    '"data center" electricity demand',
    '"data center" water use'
  ],
  ai_data_centers: [
    '"AI data center" electricity',
    '"AI data centre" energy demand'
  ],
  telecom_backbone: [
    '("fiber optic outage" OR "internet backbone outage" OR "telecom cable damage")'
  ],
  plastics_petrochemicals: [
    '("petrochemical expansion" OR "plastic pollution" OR "plastics treaty")'
  ],
  refrigerant_phase_down: [
    '("HFC phase-down" OR "HFC phasedown" OR "refrigerant transition")'
  ],
  methane_leak_detection: [
    '("methane leak detection" OR "methane satellite detection" OR "methane super emitter")'
  ],
  weatherization_retrofits: [
    '("home weatherization" OR "home insulation" OR "energy retrofit")'
  ],
  thermokarst_expansion: [
    '(thermokarst OR "permafrost collapse")'
  ],
  firn_layer_depletion: [
    '(firn OR "glacier snow layer") warming'
  ],
  talik_expansion: [
    '(talik OR "permafrost thaw layer")'
  ],
  tropospheric_ozone: [
    '("ground level ozone" OR "surface ozone" OR smog) pollution'
  ],
  tundra_methane_outgassing: [
    '("tundra methane" OR "Arctic methane emissions" OR "permafrost methane")'
  ],
  ice_albedo_feedback_loops: [
    '("ice albedo feedback" OR "darkening ice" OR "Arctic amplification")'
  ],
  subsea_cable_landing_chokepoint: [
    '("subsea cable landing station" OR "undersea cable landing")'
  ],
  cryoconite_hole_expansion: [
    '(cryoconite OR "dark ice algae") glacier'
  ],
  savannah_tree_cover_decline: [
    '("savanna tree loss" OR "savannah tree cover")'
  ],
  ice_algae_pigmentation: [
    '("ice algae" OR "dark ice") glacier'
  ],
  snowpack_dust_soot_coverage: [
    '("dust on snow" OR "soot on snow")'
  ],
  ice_cap_decapitation: [
    '("ice cap loss" OR "ice cap melting")'
  ],
  nunatak_habitat_shrinkage: [
    '(nunatak OR "mountain summit habitat") glacier'
  ],
  freeze_thaw_rock_fracturing: [
    '("freeze thaw" rockfall OR "frost cracking")'
  ],
  overstory_tree_mortality: [
    '("tree mortality" forest OR "forest canopy dieback")'
  ],
  tundra_shrubification_speeds: [
    '("Arctic shrub expansion" OR "tundra greening")'
  ],
  levee_and_channelization_works: [
    '("levee failure" OR "river channelization" OR "flood levee")'
  ],
  anaerobic_manure_lagoon_operation: [
    '("manure lagoon" OR "livestock waste lagoon")'
  ],
  urban_hydrologic_supply_shortfall: [
    '("urban water shortage" OR "city water supply")'
  ],
  refinery_combustion_co2: [
    '("refinery emissions" OR "oil refinery pollution")'
  ],
  peatland_drainage_co2: [
    '("drained peatland emissions" OR "peat drainage carbon")'
  ]
});

const RELEVANCE_KEYWORDS = Object.freeze({
  food: ['food', 'hunger', 'famine', 'crop', 'harvest', 'grain', 'wheat', 'rice', 'maize', 'nutrition', 'agriculture'],
  industry_farming: ['industrial', 'factory', 'intensive', 'livestock', 'chicken', 'poultry', 'cattle', 'pig', 'fertilizer', 'pollinator', 'pesticide', 'monoculture'],
  personal_conveyance: ['car', 'vehicle', 'traffic', 'transport', 'emission', 'petrol', 'scooter', 'suv', 'e-bike', 'rickshaw'],
  environ_anomalies: ['compound', 'extreme', 'hazard', 'flood', 'drought', 'wildfire', 'cyclone'],
  amoc: ['amoc', 'overturning', 'atlantic circulation'],
  wet_bulb_heat: ['wet bulb', 'wet-bulb', 'humid heat', 'heatwave', 'heat stress', 'humidity', 'extreme heat'],
  monsoon_volatility: ['monsoon'],
  rain_on_snow_flood_risk: ['rain on snow', 'rain-on-snow', 'snowmelt', 'snowpack'],
  peak_glacier_runoff_passage: ['glacier', 'glacial', 'meltwater'],
  thermal_stratification_intensification: ['stratification', 'stratified', 'ocean layers'],
  marine_pathogen_range_expansion: ['marine pathogen', 'vibrio', 'flesh eating bacteria', 'shellfish bacteria'],
  delta_salt_intrusion_fronts: ['saltwater intrusion', 'salt intrusion', 'salinity', 'salinization'],
  tropical_cyclone_rapid_intensification: ['rapid intensification', 'rapidly intensified', 'rapidly intensifying'],
  oceanic_upwelling_disruptions: ['upwelling'],
  pyrocumulonimbus_smoke_injection: ['pyrocumulonimbus', 'fire thunderstorm', 'smoke plume'],
  coastal_permafrost_erosion: ['permafrost', 'arctic erosion', 'coastal erosion'],
  data_centers: ['data center', 'data centre', 'server campus'],
  ai_data_centers: ['ai data center', 'ai data centre', 'artificial intelligence data center'],
  telecom_backbone: ['fiber optic', 'fibre optic', 'internet backbone', 'telecom cable', 'network outage'],
  plastics_petrochemicals: ['plastic', 'petrochemical', 'polymer'],
  refrigerant_phase_down: ['refrigerant', 'hfc', 'hydrofluorocarbon'],
  methane_leak_detection: ['methane leak', 'methane plume', 'super emitter', 'super-emitter'],
  weatherization_retrofits: ['weatherization', 'insulation', 'energy retrofit'],
  thermokarst_expansion: ['thermokarst', 'permafrost collapse'],
  firn_layer_depletion: ['firn', 'glacier snow'],
  talik_expansion: ['talik', 'permafrost thaw'],
  tropospheric_ozone: ['ground level ozone', 'surface ozone', 'smog'],
  tundra_methane_outgassing: ['tundra methane', 'Arctic methane', 'permafrost methane'],
  ice_albedo_feedback_loops: ['ice albedo', 'darkening ice', 'Arctic amplification'],
  subsea_cable_landing_chokepoint: ['cable landing', 'landing station'],
  cryoconite_hole_expansion: ['cryoconite', 'dark ice algae'],
  savannah_tree_cover_decline: ['savanna tree', 'savannah tree'],
  ice_algae_pigmentation: ['ice algae', 'dark ice'],
  snowpack_dust_soot_coverage: ['dust on snow', 'soot on snow'],
  ice_cap_decapitation: ['ice cap'],
  nunatak_habitat_shrinkage: ['nunatak', 'summit habitat'],
  freeze_thaw_rock_fracturing: ['freeze thaw', 'frost cracking', 'rockfall'],
  overstory_tree_mortality: ['tree mortality', 'canopy dieback'],
  tundra_shrubification_speeds: ['shrub expansion', 'tundra greening'],
  levee_and_channelization_works: ['levee', 'channelization'],
  anaerobic_manure_lagoon_operation: ['manure lagoon', 'waste lagoon'],
  urban_hydrologic_supply_shortfall: ['urban water shortage', 'city water supply'],
  refinery_combustion_co2: ['refinery emissions', 'refinery pollution'],
  peatland_drainage_co2: ['drained peatland', 'peat drainage'],
  coastal_property_insurance_redlines: ['property insurance', 'home insurance', 'insurance premium', 'insurance coverage', 'flood insurance', 'insurer'],
  shipping_bunker_fuel_co2: ['shipping emission', 'ship emission', 'maritime emission', 'shipping carbon', 'marine fuel', 'bunker fuel']
});

const seedSet = (articles, relevanceText) => articles.map((article) => ({ ...article, relevanceText }));

const compactSeedSet = (relevanceText, rows) => seedSet(rows.map(([title, url, seendate]) => ({
  title,
  url,
  domain: new URL(url).hostname.replace(/^www\./, ''),
  seendate
})), relevanceText);

const PERMAFROST_ARTICLES = [
  {
    title: 'Post-fire stabilization of thaw-affected permafrost terrain in northern Alaska',
    url: 'https://www.nature.com/articles/s41598-024-58998-5',
    domain: 'nature.com',
    seendate: '20240326T000000Z'
  },
  {
    title: 'Upland Yedoma taliks are an unpredicted source of atmospheric methane',
    url: 'https://www.nature.com/articles/s41467-024-50346-5',
    domain: 'nature.com',
    seendate: '20240725T000000Z'
  },
  {
    title: 'Long-term monitoring of active layer thickness confirms global permafrost degradation',
    url: 'https://www.nature.com/articles/s43247-026-03824-1',
    domain: 'nature.com',
    seendate: '20260826T000000Z'
  }
];

const FIRN_ARTICLES = [
  {
    title: 'Antarctic-wide ice-shelf firn emulation reveals robust future firn air depletion signal for the Antarctic Peninsula',
    url: 'https://www.nature.com/articles/s43247-024-01255-4',
    domain: 'nature.com',
    seendate: '20240224T000000Z'
  },
  {
    title: 'Continent-wide mapping shows increasing sensitivity of East Antarctica to meltwater ponding',
    url: 'https://www.nature.com/articles/s41558-025-02363-5',
    domain: 'nature.com',
    seendate: '20250716T000000Z'
  },
  {
    title: 'Contribution of surface and cloud radiative feedbacks to Greenland Ice Sheet meltwater production during 2002–2023',
    url: 'https://www.nature.com/articles/s43247-024-01714-y',
    domain: 'nature.com',
    seendate: '20241016T000000Z'
  }
];

const DARK_ICE_ARTICLES = [
  {
    title: 'Surface darkening by abundant and diverse algae on an Antarctic ice cap',
    url: 'https://www.nature.com/articles/s41467-025-57725-6',
    domain: 'nature.com',
    seendate: '20250318T000000Z'
  },
  {
    title: 'Single-cell imaging reveals efficient nutrient uptake and growth of microalgae darkening the Greenland Ice Sheet',
    url: 'https://www.nature.com/articles/s41467-025-56664-6',
    domain: 'nature.com',
    seendate: '20250219T000000Z'
  },
  {
    title: 'Contribution of surface and cloud radiative feedbacks to Greenland Ice Sheet meltwater production during 2002–2023',
    url: 'https://www.nature.com/articles/s43247-024-01714-y',
    domain: 'nature.com',
    seendate: '20241016T000000Z'
  }
];

const GLACIER_LOSS_ARTICLES = [
  {
    title: 'Peak glacier extinction in the mid-twenty-first century',
    url: 'https://www.nature.com/articles/s41558-025-02513-9',
    domain: 'nature.com',
    seendate: '20251208T000000Z'
  },
  {
    title: 'Impacts of deglaciation on biodiversity and ecosystem function',
    url: 'https://www.nature.com/articles/s44358-025-00049-6',
    domain: 'nature.com',
    seendate: '20250514T000000Z'
  },
  {
    title: 'Globally recognized island is losing its trademark glaciers',
    url: 'https://www.nature.com/articles/d41586-025-02473-2',
    domain: 'nature.com',
    seendate: '20250807T000000Z'
  }
];

const TUNDRA_SHRUB_ARTICLES = [
  {
    title: 'Regional fire–greening positive feedback loops in Alaskan Arctic tundra',
    url: 'https://www.nature.com/articles/s41477-024-01850-5',
    domain: 'nature.com',
    seendate: '20241114T000000Z'
  },
  {
    title: 'Nitrogen fixing shrubs advance the pace of tall-shrub expansion in low-Arctic tundra',
    url: 'https://www.nature.com/articles/s43247-023-01098-5',
    domain: 'nature.com',
    seendate: '20231120T000000Z'
  },
  {
    title: 'Plant diversity dynamics over space and time in a warming Arctic',
    url: 'https://www.nature.com/articles/s41586-025-08946-8',
    domain: 'nature.com',
    seendate: '20250430T000000Z'
  }
];

const FAST_FASHION_ARTICLES = [
  {
    title: "As fast fashion's waste pollutes Africa's environment, designers in Ghana are finding a solution",
    url: 'https://apnews.com/article/0809f25605722a53658bf21d7d9b1548',
    domain: 'apnews.com',
    seendate: '20241123T000000Z'
  },
  {
    title: 'AI machine sorts clothes faster than humans to boost textile recycling in China',
    url: 'https://apnews.com/article/863551cc54e88da6a7916894cb8980c4',
    domain: 'apnews.com',
    seendate: '20260415T000000Z'
  },
  {
    title: 'How to shop secondhand clothing sustainably and look cool doing it',
    url: 'https://apnews.com/article/13f8df04cf6076ca120b360f558fcd1c',
    domain: 'apnews.com',
    seendate: '20251001T000000Z'
  }
];

const OCEAN_STRATIFICATION_ARTICLES = [
  {
    title: 'A more quiescent deep ocean under global warming',
    url: 'https://www.nature.com/articles/s41558-024-02075-2',
    domain: 'nature.com',
    seendate: '20240801T000000Z'
  },
  {
    title: 'Transient overturning changes cause an upper-ocean nutrient decline in a warming climate',
    url: 'https://www.nature.com/articles/s41467-024-52200-0',
    domain: 'nature.com',
    seendate: '20240910T000000Z'
  },
  {
    title: 'The changing nature of future Arctic marine heatwaves and its potential impacts on the ecosystem',
    url: 'https://www.nature.com/articles/s41558-024-02224-7',
    domain: 'nature.com',
    seendate: '20250106T000000Z'
  }
];

const AI_DATA_CENTER_ARTICLES = [
  {
    title: 'OpenAI shows off Stargate AI data center in Texas and plans 5 more elsewhere with Oracle, Softbank',
    url: 'https://apnews.com/article/0b3f4fa6e8d8141b4c143e3e7f41aba1',
    domain: 'apnews.com',
    seendate: '20250923T000000Z'
  },
  {
    title: 'OpenAI looks across US for sites to build its Trump-backed Stargate AI data centers',
    url: 'https://apnews.com/article/4fc80ae87304c99a5189c05ca967e0d2',
    domain: 'apnews.com',
    seendate: '20250206T000000Z'
  },
  {
    title: "Meta's nuclear deal signals AI's growing energy needs",
    url: 'https://apnews.com/article/d16efaf2337f77fb2c9d84e9b923111d',
    domain: 'apnews.com',
    seendate: '20250603T000000Z'
  }
];

const SHIPPING_EMISSIONS_ARTICLES = [
  {
    title: 'Russia-Ukraine war has altered the pattern of carbon dioxide emissions from shipping in the Black Sea region',
    url: 'https://www.nature.com/articles/s43247-025-02537-1',
    domain: 'nature.com',
    seendate: '20250716T000000Z'
  },
  {
    title: 'Arctic Sea Route access reshapes global shipping carbon emissions',
    url: 'https://www.nature.com/articles/s41467-025-64437-4',
    domain: 'nature.com',
    seendate: '20250929T000000Z'
  },
  {
    title: 'Geopolitical risks impede global shipping decarbonization progress',
    url: 'https://www.nature.com/articles/s43247-025-02852-7',
    domain: 'nature.com',
    seendate: '20251026T000000Z'
  },
  {
    title: 'Detectable ship tracks account for just 5% of aerosol indirect forcing from ship emissions',
    url: 'https://www.nature.com/articles/s43247-025-02825-w',
    domain: 'nature.com',
    seendate: '20251114T000000Z'
  },
  {
    title: 'International shipping in a world below 2 °C',
    url: 'https://www.nature.com/articles/s41558-024-01997-1',
    domain: 'nature.com',
    seendate: '20240601T000000Z'
  }
];

const RESERVOIR_SHORTFALL_ARTICLES = [
  {
    title: 'New York City issues a drought warning as reservoirs run low',
    url: 'https://apnews.com/article/b70f2869073751cb44b1dc2b38894ad1',
    domain: 'apnews.com',
    seendate: '20241115T000000Z'
  },
  {
    title: 'Mexico City stops extracting water from a major reservoir as drought deepens',
    url: 'https://apnews.com/article/6f8b2189a3935468e5f61acf23f70711',
    domain: 'apnews.com',
    seendate: '20240410T000000Z'
  },
  {
    title: 'Low water threatens Glen Canyon Dam power and Colorado River releases',
    url: 'https://apnews.com/article/25901fb7e9f6896a27c1493a4bbf22f3',
    domain: 'apnews.com',
    seendate: '20240417T000000Z'
  }
];

const FISHERY_SUPPLY_ARTICLES = [
  {
    title: 'Report finds that America is catching and eating a little less fish',
    url: 'https://apnews.com/article/065ab36de04b9757e5575163f1fd7e80',
    domain: 'apnews.com',
    seendate: '20241118T000000Z'
  },
  {
    title: 'Wriggling gold: Fishermen who catch baby eels for $2,000 a pound hope for many years of fishing',
    url: 'https://apnews.com/article/a26c8c4d33615cca76007dd82a5fadb5',
    domain: 'apnews.com',
    seendate: '20240314T000000Z'
  },
  {
    title: "Fishers celebrate Trump's seafood order while conservation groups fear overfishing",
    url: 'https://apnews.com/article/14793f6b00adb48f9510dc9ed5c1a0f1',
    domain: 'apnews.com',
    seendate: '20250418T000000Z'
  }
];

const FISHERY_PROTEIN_ARTICLES = [
  {
    title: 'Illuminating the multidimensional contributions of small-scale fisheries',
    url: 'https://www.nature.com/articles/s41586-024-08448-z',
    domain: 'nature.com',
    seendate: '20250115T000000Z'
  },
  {
    title: 'Seafood supply mapping reveals production and consumption mismatches and large dietary nutrient losses through exports in the United Kingdom',
    url: 'https://www.nature.com/articles/s43016-024-01102-x',
    domain: 'nature.com',
    seendate: '20250102T000000Z'
  },
  {
    title: 'Cambodian fishermen turn to raising eels as Tonle Sap lake runs out of fish',
    url: 'https://apnews.com/article/2672faf10b8fb9b11508111877dcec27',
    domain: 'apnews.com',
    seendate: '20241010T000000Z'
  }
];

const NIGHT_HEAT_ARTICLES = [
  {
    title: 'Nonlinear exposure-response associations of daytime, nighttime, and day-night compound heatwaves with mortality amid climate change',
    url: 'https://www.nature.com/articles/s41467-025-56067-7',
    domain: 'nature.com',
    seendate: '20250114T000000Z'
  },
  {
    title: 'Too hot to sleep? How heatwaves at night affect our health',
    url: 'https://www.nature.com/articles/d41586-026-02532-2',
    domain: 'nature.com',
    seendate: '20260801T000000Z'
  },
  {
    title: 'Future heat-related mortality in Europe driven by compound day-night heatwaves and demographic shifts',
    url: 'https://www.nature.com/articles/s41467-025-62871-y',
    domain: 'nature.com',
    seendate: '20250818T000000Z'
  }
];

const GRID_PEAK_ARTICLES = [
  {
    title: 'Optimising peak energy reduction in networks of buildings',
    url: 'https://www.nature.com/articles/s41598-024-52676-2',
    domain: 'nature.com',
    seendate: '20240216T000000Z'
  },
  {
    title: 'The value of long-duration energy storage under various grid conditions in a zero-emissions future',
    url: 'https://www.nature.com/articles/s41467-024-53274-6',
    domain: 'nature.com',
    seendate: '20241015T000000Z'
  },
  {
    title: 'Interregional transmission can increase reliability while reducing costs and emissions in the US',
    url: 'https://www.nature.com/articles/s41560-025-01914-6',
    domain: 'nature.com',
    seendate: '20251001T000000Z'
  }
];

const TRANSFORMER_SUPPLY_ARTICLES = [
  {
    title: 'Transformer supply bottleneck threatens power system stability as load grows',
    url: 'https://www.utilitydive.com/news/electric-transformer-shortage-nrel-niac/738947/',
    domain: 'utilitydive.com',
    seendate: '20250212T000000Z'
  },
  {
    title: 'Transformer, breaker backlogs persist, despite reshoring progress',
    url: 'https://www.utilitydive.com/news/reshore-electrical-equipment-backlogs-transformer-breaker-nema/749265/',
    domain: 'utilitydive.com',
    seendate: '20250529T000000Z'
  },
  {
    title: 'US should create virtual electric transformer reserve amid shortage concerns',
    url: 'https://www.utilitydive.com/news/us-strategic-virtual-reserve-electric-transformers-niac/726934/',
    domain: 'utilitydive.com',
    seendate: '20240913T000000Z'
  }
];

const TRANSMISSION_BUILDOUT_ARTICLES = [
  {
    title: 'Interregional transmission can increase reliability while reducing costs and emissions in the US',
    url: 'https://www.nature.com/articles/s41560-025-01914-6',
    domain: 'nature.com',
    seendate: '20251001T000000Z'
  },
  {
    title: 'Electric transmission value and its drivers in United States power markets',
    url: 'https://www.nature.com/articles/s41467-025-63143-5',
    domain: 'nature.com',
    seendate: '20250825T000000Z'
  },
  {
    title: 'Grid-enhancing technologies for clean energy systems',
    url: 'https://www.nature.com/articles/s44359-024-00001-5',
    domain: 'nature.com',
    seendate: '20250115T000000Z'
  }
];

const AVIATION_DEMAND_ARTICLES = [
  {
    title: 'Benefits of UK sustainable aviation fuel will be wiped out by rising demand',
    url: 'https://www.carbonbrief.org/analysis-benefits-of-uk-sustainable-aviation-fuel-will-be-wiped-out-by-rising-demand/',
    domain: 'carbonbrief.org',
    seendate: '20240515T000000Z'
  },
  {
    title: 'UK climate advisers now more optimistic net-zero goals can be met',
    url: 'https://www.carbonbrief.org/ccc-uk-climate-advisers-now-more-optimistic-net-zero-goals-can-be-met',
    domain: 'carbonbrief.org',
    seendate: '20250625T000000Z'
  },
  {
    title: 'Fossil-fuel CO2 emissions to set new record in 2025, as land sink recovers',
    url: 'https://www.carbonbrief.org/analysis-fossil-fuel-co2-emissions-to-set-new-record-in-2025-as-land-sink-recovers',
    domain: 'carbonbrief.org',
    seendate: '20251113T000000Z'
  }
];

const RENEWABLE_CURTAILMENT_ARTICLES = [
  {
    title: 'Impacts of large-scale deployment of vertical bifacial photovoltaics on European electricity market dynamics',
    url: 'https://www.nature.com/articles/s41467-024-50762-7',
    domain: 'nature.com',
    seendate: '20240806T000000Z'
  },
  {
    title: 'The value of long-duration energy storage under various grid conditions in a zero-emissions future',
    url: 'https://www.nature.com/articles/s41467-024-53274-6',
    domain: 'nature.com',
    seendate: '20241015T000000Z'
  },
  {
    title: 'Interregional transmission can increase reliability while reducing costs and emissions in the US',
    url: 'https://www.nature.com/articles/s41560-025-01914-6',
    domain: 'nature.com',
    seendate: '20251001T000000Z'
  }
];

const FERTILIZER_SHOCK_ARTICLES = [
  {
    title: 'Iran war has US farmers worried about the cost and availability of fertilizer',
    url: 'https://apnews.com/article/aa846fb0e30d1060d8993c65d32fe12b',
    domain: 'apnews.com',
    seendate: '20260320T000000Z'
  },
  {
    title: 'The war in Iran sparks a global fertilizer shortage and threatens food prices',
    url: 'https://apnews.com/article/3b7c92d58dba0817c3aa8f1db47464b7',
    domain: 'apnews.com',
    seendate: '20260330T000000Z'
  },
  {
    title: 'Already under financial pressure, Midwest soybean farmers are squeezed further by tariffs and Iran war',
    url: 'https://apnews.com/article/5731e2d79ce125bfa0a667a862dbe35e',
    domain: 'apnews.com',
    seendate: '20260415T000000Z'
  }
];

const COOLING_EQUITY_ARTICLES = [
  {
    title: 'Heat inequality causing thousands of unreported deaths in poor countries',
    url: 'https://www.theguardian.com/environment/article/2024/aug/16/heat-inequality-causing-thousands-of-unreported-deaths-in-poor-countries',
    domain: 'theguardian.com',
    seendate: '20240816T000000Z'
  },
  {
    title: "It's unbearable: in ever-hotter US cities, air conditioning is no longer enough",
    url: 'https://www.theguardian.com/us-news/article/2024/jun/11/air-conditioning-protect-extreme-heat',
    domain: 'theguardian.com',
    seendate: '20240611T000000Z'
  },
  {
    title: '93F and no electricity: why some US utilities can cut power despite heatwaves',
    url: 'https://www.theguardian.com/us-news/2024/sep/25/utilities-cut-power-electricity-during-heatwaves',
    domain: 'theguardian.com',
    seendate: '20240925T000000Z'
  }
];

const DESERTIFICATION_ARTICLES = [
  {
    title: 'Less than 4% of dryland areas are projected to desertify despite increased aridity under climate change',
    url: 'https://www.nature.com/articles/s43247-024-01463-y',
    domain: 'nature.com',
    seendate: '20240605T000000Z'
  },
  {
    title: 'Land aridification persists in vulnerable drylands under climate mitigation scenarios',
    url: 'https://www.nature.com/articles/s43247-025-02742-y',
    domain: 'nature.com',
    seendate: '20250902T000000Z'
  },
  {
    title: 'Growing aridity poses threats to global land surface',
    url: 'https://www.nature.com/articles/s43247-024-01935-1',
    domain: 'nature.com',
    seendate: '20241219T000000Z'
  }
];

const COASTAL_INSURANCE_ARTICLES = [
  {
    title: 'How climate risks are driving up insurance premiums around the US',
    url: 'https://www.theguardian.com/environment/2024/dec/05/climate-crisis-insurance-premiums',
    domain: 'theguardian.com',
    seendate: '20241205T000000Z'
  },
  {
    title: 'A break from the heat: Americans most affected by climate crisis head midwest',
    url: 'https://www.theguardian.com/us-news/2024/sep/22/climate-crisis-americans-move-midwest',
    domain: 'theguardian.com',
    seendate: '20240922T000000Z'
  },
  {
    title: 'Report warns 1.6m Australian households struggling to insure their homes',
    url: 'https://www.theguardian.com/australia-news/article/2024/aug/26/report-warns-australian-households-struggling-to-insure-their-homes',
    domain: 'theguardian.com',
    seendate: '20240826T000000Z'
  }
];

const FREEZE_THAW_ROCK_ARTICLES = [
  {
    title: 'Climate warming drives rockfall activity from mountain permafrost',
    url: 'https://www.nature.com/articles/s41561-024-01390-9',
    domain: 'nature.com',
    seendate: '20240223T000000Z'
  },
  {
    title: 'Freeze-thaw damage in granite on the Tibetan Plateau',
    url: 'https://www.nature.com/articles/s41598-024-74780-z',
    domain: 'nature.com',
    seendate: '20241015T000000Z'
  },
  {
    title: 'Fractured rock mass slope response under freeze-thaw cycles',
    url: 'https://www.nature.com/articles/s41598-024-56346-1',
    domain: 'nature.com',
    seendate: '20240307T000000Z'
  }
];

// Narrow topics sometimes produce fewer than three usable results through news
// discovery alone. These direct article sets keep the weekly refresh complete
// without relaxing publisher, recency, article-page, or relevance validation.
const REMEDIATION_EVENT_SEEDS = Object.freeze({
  mobile_wireless_networks: compactSeedSet('large mobile or wireless network outages disrupting calls and internet access', [
    ['Vodafone outage leaves thousands without broadband or mobile services', 'https://www.theguardian.com/business/2025/oct/13/vodafone-outage-broadband-mobile-down-internet-calls', '20251013T000000Z'],
    ['Thousands of EE and BT customers hit by mobile network outage', 'https://www.theguardian.com/business/2025/jul/24/thousands-of-ee-and-bt-customers-across-uk-hit-by-mobile-network-outage', '20250724T000000Z'],
    ['Thousands affected by Three network outage in the UK', 'https://www.theguardian.com/technology/2025/jan/23/thousands-of-customers-affected-by-outages-across-three-network-in-uk', '20250123T000000Z']
  ]),
  weatherization_retrofits: compactSeedSet('building weatherization, insulation, and energy-efficiency retrofits reducing heating and cooling demand', [
    ['Passive ultra-low energy residential envelope retrofit', 'https://www.nature.com/articles/s41598-025-07421-8', '20250702T000000Z'],
    ['Robust residential renovation strategies in Switzerland', 'https://www.nature.com/articles/s41467-024-46305-9', '20240312T000000Z'],
    ['Building energy renovation balances decarbonization, circularity and cost', 'https://www.nature.com/articles/s41467-025-62442-1', '20250801T000000Z'],
    ['Residential building retrofit pathways for lower energy demand', 'https://www.nature.com/articles/s41598-025-00045-y', '20250430T000000Z']
  ]),
  electric_vehicle_transition: compactSeedSet('electric vehicle adoption and the infrastructure or material constraints slowing the transition', [
    ['Electric vehicle adoption reaches a market tipping point', 'https://www.nature.com/articles/s41467-025-66945-9', '20251208T000000Z'],
    ['Grid congestion limits the climate benefit of electric vehicles', 'https://www.nature.com/articles/s41467-025-61976-8', '20250806T000000Z'],
    ['Critical mineral bottlenecks constrain electric vehicle deployment', 'https://www.nature.com/articles/s41467-024-51152-9', '20240809T000000Z']
  ]),
  aquifer_overdraft: compactSeedSet('groundwater extraction exceeding aquifer recharge and threatening long-term water supply', [
    ['Ending groundwater overdraft without harming food security', 'https://www.nature.com/articles/s41893-024-01376-w', '20240614T000000Z'],
    ['Rapid groundwater decline is widespread across global aquifers', 'https://www.nature.com/articles/s41586-023-06879-8', '20240124T000000Z'],
    ['Large-scale aquifer recovery after groundwater depletion', 'https://www.nature.com/articles/s41467-025-62719-5', '20250807T000000Z']
  ]),
  atlantic_multidecadal_oscillation: compactSeedSet('Atlantic multidecadal variability changing ocean temperatures and connected climate patterns', [
    ['Intensified Atlantic multidecadal variability under warming', 'https://www.nature.com/articles/s41558-025-02252-x', '20250213T000000Z'],
    ['Atlantic multidecadal and Pacific variability shape Arctic atmospheric rivers', 'https://www.nature.com/articles/s41467-024-45159-5', '20240201T000000Z'],
    ['Decadal ocean variability amplifies marine heatwaves', 'https://www.nature.com/articles/s41612-025-01179-6', '20250901T000000Z']
  ]),
  glacier_meltwater_dependency: compactSeedSet('communities and river systems depending on shrinking glacier meltwater supplies', [
    ['Asian Water Tower cities depend on glacier meltwater', 'https://www.nature.com/articles/s41467-026-73245-3', '20260601T000000Z'],
    ['Glacier meltwater contributions to Tibetan Plateau rivers', 'https://www.nature.com/articles/s41612-025-01060-6', '20250601T000000Z'],
    ['Glacier meltwater lost through evapotranspiration and human extraction', 'https://www.nature.com/articles/s41558-025-02359-1', '20250609T000000Z']
  ]),
  peaker_plant_lock_in: compactSeedSet('high-emitting peaker power plants retained for short periods of grid demand', [
    ['Low-capacity thermal power plants have sharply higher emissions intensity', 'https://www.nature.com/articles/s41467-025-59800-4', '20250701T000000Z'],
    ['Four-hour batteries can replace aging Maine peaker plants', 'https://www.utilitydive.com/news/4-hour-batteries-best-replacements-for-aging-maine-peaker-plants-study/715118/', '20240503T000000Z'],
    ['New Jersey peaker plants exploit an air-pollution loophole', 'https://apnews.com/article/ad86fe01a0aac51353c5818dae411a97', '20240304T000000Z']
  ]),
  transformer_supply_bottleneck: seedSet([
    ...TRANSFORMER_SUPPLY_ARTICLES,
    { title: 'Grid-enhancing technologies include dynamic transformer ratings', url: 'https://www.nature.com/articles/s44359-024-00001-5', domain: 'nature.com', seendate: '20250115T000000Z' },
    { title: 'Low-carbon technologies can overload transformers and require replacement', url: 'https://www.nature.com/articles/s41560-024-01542-6', domain: 'nature.com', seendate: '20240601T000000Z' },
    { title: 'Critical material constraints affect power-system transitions', url: 'https://www.nature.com/articles/s41467-025-56592-5', domain: 'nature.com', seendate: '20250203T000000Z' }
  ], 'transformer shortages and overloads delaying reliable grid expansion'),
  utility_disconnection_risk: compactSeedSet('household electricity or utility disconnections during dangerous heat and financial hardship', [
    ['Demographic and weather factors shape utility disconnections', 'https://www.nature.com/articles/s41467-024-53913-y', '20241105T000000Z'],
    ['Utility shutoffs continue during deadly summer heat', 'https://apnews.com/article/501f94370487a50db40f1b32d1fe66b0', '20250905T000000Z'],
    ['US utilities cut electricity despite heatwaves', 'https://www.theguardian.com/us-news/2024/sep/25/utilities-cut-power-electricity-during-heatwaves', '20240925T000000Z']
  ]),
  freight_electrification_gap: compactSeedSet('slow electrification of heavy road freight and the infrastructure barriers facing electric trucks', [
    ['Battery and fuel-cell costs shape truck electrification', 'https://www.nature.com/articles/s41560-024-01531-9', '20240514T000000Z'],
    ['Long-haul electric trucks can reduce freight carbon emissions', 'https://www.nature.com/articles/s41467-025-64792-2', '20251029T000000Z'],
    ['Road freight emissions require faster electrification', 'https://www.nature.com/articles/s41467-025-57861-z', '20250315T000000Z']
  ]),
  topsoil_erosion_acceleration: compactSeedSet('accelerating erosion stripping productive topsoil from cropland and burned landscapes', [
    ['Global post-fire soil erosion rises after severe burning', 'https://www.nature.com/articles/s41561-025-01876-0', '20260105T000000Z'],
    ['Climate extremes increase global cropland soil exposure', 'https://www.nature.com/articles/s41467-025-59544-1', '20250501T000000Z'],
    ['Topsoil loss across United States cropland', 'https://www.nature.com/articles/s43247-024-01299-6', '20240301T000000Z']
  ]),
  fracking_wastewater_lakes: compactSeedSet('fracking wastewater, produced-water ponds, and spills contaminating water and soil', [
    ['Frac-out contaminated private drinking water', 'https://www.nature.com/articles/s41598-025-16976-5', '20250917T000000Z'],
    ['PFAS detected in waters associated with oil, gas and fracking operations', 'https://www.nature.com/articles/s41598-025-33394-9', '20251201T000000Z'],
    ['Produced wastewater reuse raises pollution concerns', 'https://apnews.com/article/86973f8d0c8b4807281fa179df790deb', '20240513T000000Z']
  ]),
  deepwater_petroleum_spill_risk: compactSeedSet('offshore and deepwater petroleum spills threatening marine ecosystems and coastlines', [
    ['Shell offshore fleet faces renewed oil-spill risk scrutiny', 'https://apnews.com/article/49a5a62a94deb109d30ef567b7111250', '20250403T000000Z'],
    ['Deepwater Horizon damage remains visible fifteen years later', 'https://apnews.com/article/01247f5b76c028b09c4ef80d9f982a50', '20250420T000000Z'],
    ['Tobago offshore oil spill spreads across the Caribbean', 'https://apnews.com/article/9b9a5b76a8da777b27ab8b6ef10faf86', '20240228T000000Z'],
    ['Probabilistic analysis maps marine oil-spill risk', 'https://www.nature.com/articles/s41598-024-57048-4', '20240319T000000Z'],
    ['Oil droplets complicate offshore spill risk assessments', 'https://www.nature.com/articles/s43247-025-02805-0', '20251001T000000Z']
  ]),
  topsoil_salinization_fields: compactSeedSet('salt accumulation degrading farm soils, irrigation water, and crop productivity', [
    ['Soil salinization and waterlogging spread across the northeastern Nile Delta', 'https://www.nature.com/articles/s41598-024-77954-x', '20241113T000000Z'],
    ['Remote sensing maps soil salinity under vegetation cover', 'https://www.nature.com/articles/s41598-024-82868-9', '20250121T000000Z'],
    ['Salinized farmland faces soil-quality and contaminant risks', 'https://www.nature.com/articles/s41598-024-80314-4', '20241126T000000Z'],
    ['Multiple land-degradation pathways include agricultural soil salinization', 'https://www.nature.com/articles/s41467-024-48252-x', '20240501T000000Z']
  ]),
  pesticide_bioaccumulation_chains: compactSeedSet('persistent pesticides accumulating through organisms and food webs', [
    ['Transboundary impacts of pesticide use in food production', 'https://www.nature.com/articles/s43017-025-00673-y', '20250529T000000Z'],
    ['Pesticides harm non-target organisms across trophic levels', 'https://www.nature.com/articles/s41467-025-56732-x', '20250201T000000Z'],
    ['Pesticide residues spread through soil and vegetation', 'https://www.nature.com/articles/s41598-024-84811-4', '20250121T000000Z'],
    ['Gut bacteria bioaccumulate pesticides and prolong residues', 'https://www.nature.com/articles/s41467-025-59747-6', '20250501T000000Z']
  ]),
  wildfire_smoke_hospitalization_burden: compactSeedSet('wildfire smoke driving respiratory, cardiovascular, and other hospital admissions', [
    ['Wildfire-specific PM2.5 raises respiratory hospitalization risk across countries', 'https://www.nature.com/articles/s41893-025-01533-9', '20250501T000000Z'],
    ['Prolonged 2024 fire season increased São Paulo hospitalizations', 'https://www.nature.com/articles/s41598-025-08542-w', '20250701T000000Z'],
    ['Wildfire smoke exposure creates a growing mortality burden', 'https://www.nature.com/articles/s41586-025-09611-w', '20250918T000000Z'],
    ['Fine particles emitted by fires create a global health burden', 'https://www.nature.com/articles/s44407-025-00024-7', '20250601T000000Z']
  ]),
  emergency_response_overload: compactSeedSet('emergency dispatch, evacuation, and firefighting systems overwhelmed during major disasters', [
    ['Maui wildfire investigations document overwhelmed emergency dispatch', 'https://apnews.com/article/269a56345a92cdbd5a65db4314a9ba59', '20240802T000000Z'],
    ['Maui fire report details equipment and mutual-aid shortfalls', 'https://apnews.com/article/410e83c0608eaf630d5916151b2601ef', '20240416T000000Z'],
    ['Maui 911 recordings show limited staffing and communication failures', 'https://apnews.com/article/0c3cf0365e20ececefc08828245f2b36', '20240120T000000Z']
  ]),
  supply_chain_port_bottlenecks: compactSeedSet('port closures, congestion, and shipping disruptions delaying global supply chains', [
    ['Baltimore bridge collapse closes port and forces cargo rerouting', 'https://apnews.com/article/12a611fc5dece0124a6cc3b7772a34c6', '20240326T000000Z'],
    ['Redirected ships strain terminals during Baltimore port cleanup', 'https://apnews.com/article/2c0273f1e6ef2340a17b4cd25469a780', '20240403T000000Z'],
    ['Red Sea attacks delay cargo and raise shipping costs', 'https://apnews.com/article/124d5445bec8ce6864112e3095646308', '20240128T000000Z'],
    ['Dockworker strike threatens shortages and higher retail prices', 'https://apnews.com/article/d926e9cfb3f10efb50af89d3c96bdc3d', '20240930T000000Z']
  ]),
  asphalt_pavement_heat_absorbers: compactSeedSet('dark asphalt and paved urban surfaces absorbing heat and worsening urban heat exposure', [
    ['Retro-reflective pavements can untrap radiation and cool cities', 'https://www.nature.com/articles/s44284-024-00047-3', '20240311T000000Z'],
    ['Practitioners and researchers differ on reflective pavement heat mitigation', 'https://www.nature.com/articles/s42949-024-00155-y', '20240321T000000Z'],
    ['Persistent urban heat islands intensify multi-day heat events', 'https://www.nature.com/articles/s44284-025-00290-2', '20250901T000000Z']
  ]),
  palm_oil_canopy_clearance: compactSeedSet('oil-palm expansion clearing tropical forest and peat-swamp canopy', [
    ['Oil-palm plantations replace Southeast Asian peat-swamp forests', 'https://www.nature.com/articles/s41467-025-55892-0', '20250201T000000Z'],
    ['Deforestation-linked oil-crop restrictions risk emissions leakage', 'https://www.nature.com/articles/s41467-025-56693-1', '20250201T000000Z'],
    ['Indonesia forest loss rises as palm-oil plantations expand', 'https://apnews.com/article/48a4503e383a52e4dbbee81209c87887', '20240429T000000Z']
  ]),
  estuary_eutrophication: compactSeedSet('nutrient pollution causing eutrophication, algal growth, and oxygen loss in estuaries', [
    ['Eutrophication and stratification control hypoxia in the Yangtze Estuary', 'https://www.nature.com/articles/s43247-024-01403-w', '20240504T000000Z'],
    ['Low-oxygen microbial communities reveal recurring estuary eutrophication', 'https://www.nature.com/articles/s41597-024-03850-8', '20240912T000000Z'],
    ['Climate change increases estuarine hypoxia risk', 'https://www.nature.com/articles/s41598-024-68329-3', '20240730T000000Z']
  ]),
  lightning_regime_shifts: compactSeedSet('warming changing lightning frequency, intensity, geography, and wildfire ignition risk', [
    ['Extreme precipitation shifts toward lightning-producing convective storms', 'https://www.nature.com/articles/s41561-025-01686-4', '20250401T000000Z'],
    ['Warmer climate simulations show significant increases in lightning', 'https://www.nature.com/articles/s41598-024-54544-5', '20240201T000000Z'],
    ['Thunderstorm growth and lightning respond to soil moisture and wind shear', 'https://www.nature.com/articles/s41586-025-10045-7', '20260301T000000Z']
  ]),
  trade_wind_weakening: compactSeedSet('weakening tropical trade winds altering upwelling, rainfall, and ocean-atmosphere circulation', [
    ['Enhanced equatorial Atlantic warming emerges as trade winds weaken', 'https://www.nature.com/articles/s41467-025-68015-6', '20260101T000000Z'],
    ['Southern Ocean warming weakens tropical trade winds and shifts rainfall', 'https://www.nature.com/articles/s41467-025-57654-4', '20250301T000000Z'],
    ['Deep-ocean warming weakens trade winds and amplifies El Niño-like conditions', 'https://www.nature.com/articles/s41467-024-50663-9', '20240801T000000Z'],
    ['Extreme El Niño growth begins with weakened Pacific trade winds', 'https://www.nature.com/articles/s41586-024-07984-y', '20240901T000000Z']
  ]),
  urban_distribution_water_loss: compactSeedSet('aging city pipes leaking treated water and triggering major service outages', [
    ['Trillions of gallons leak from aging US drinking-water systems', 'https://apnews.com/article/b9bfa6a0bb52d92ff5ec5a13e00906a2', '20240304T000000Z'],
    ['Atlanta water-main failures trigger citywide service problems', 'https://apnews.com/article/a1f06ef6c7f8348a44b183374a84994b', '20240606T000000Z'],
    ['Five days of Atlanta outages follow ruptured water mains', 'https://apnews.com/article/859a8f8ec69053a28c3b9bb56722cc59', '20240604T000000Z'],
    ['New York repairs massive leaks in its main aqueduct', 'https://apnews.com/article/2657dd169130c5339dbf3149201abbea', '20240930T000000Z']
  ]),
  surface_water_inflow_deficit: seedSet([
    ...RESERVOIR_SHORTFALL_ARTICLES,
    { title: 'Drought-driven reservoir inflow deficits constrain environmental flows', url: 'https://www.nature.com/articles/s41467-024-49770-4', domain: 'nature.com', seendate: '20240701T000000Z' }
  ], 'drought reducing river and reservoir inflows below water-supply and ecosystem needs'),
  surface_water_withdrawal_pressure: compactSeedSet('surface-water withdrawals increasing scarcity for people, farms, energy, and ecosystems', [
    ['Water scarcity intensifies when surface-water quality is included', 'https://www.nature.com/articles/s41558-024-02007-0', '20240523T000000Z'],
    ['Surface-water scarcity increases transboundary conflict risk', 'https://www.nature.com/articles/s41467-025-63568-y', '20250901T000000Z'],
    ['Managing stored water can reduce drought withdrawal conflicts', 'https://www.nature.com/articles/s41467-024-49770-4', '20240701T000000Z']
  ]),
  coal_power_co2_output: compactSeedSet('coal-fired electricity generation producing large carbon dioxide emissions', [
    ['Carbon dioxide emissions from overseas coal-fired power plants', 'https://www.nature.com/articles/s41558-024-02114-y', '20240919T000000Z'],
    ['Coal power phaseout in India yields large carbon benefits', 'https://www.nature.com/articles/s41467-025-66580-4', '20251124T000000Z'],
    ['Low-utilization coal plants have higher carbon intensity', 'https://www.nature.com/articles/s41467-025-59800-4', '20250701T000000Z']
  ]),
  oil_gas_flaring_co2: compactSeedSet('oil and gas flaring wasting fuel and releasing carbon dioxide, methane, soot, and other pollutants', [
    ['New Mexico reaches record settlement over natural-gas flaring', 'https://apnews.com/article/a2658012c8bc11e35e81c9b61454e3bc', '20240429T000000Z'],
    ['Oil and gas methane emissions far exceed official estimates', 'https://apnews.com/article/401cc08ad784d42fc463ed00bce4983e', '20240313T000000Z'],
    ['Natural-gas flares spark two North Dakota wildfires', 'https://apnews.com/article/203920026741e1cbd64e51221bcd1ea4', '20241114T000000Z'],
    ['Azerbaijan gas flaring rises before global climate conference', 'https://apnews.com/article/b7b740770555ec250efa885d02d5e3f4', '20241101T000000Z']
  ]),
  rail_diesel_co2: compactSeedSet('diesel-powered passenger and freight rail emitting carbon dioxide and air pollution', [
    ['Hydrogen conversion could replace diesel trains and cut emissions', 'https://www.nature.com/articles/s41598-025-90887-3', '20250222T000000Z'],
    ['Fuel shifts reduce transportation emissions including diesel rail', 'https://www.nature.com/articles/s43247-024-01924-4', '20241201T000000Z'],
    ['Rail investment can displace higher-carbon road and air travel', 'https://www.nature.com/articles/d41586-025-02980-2', '20250916T000000Z']
  ]),
  desalination_dependence: compactSeedSet('water-stressed regions increasingly depending on energy-intensive seawater desalination for freshwater supply', [
    ['Large-scale implementation of solar interfacial desalination', 'https://www.nature.com/articles/s41893-024-01485-6', '20250101T000000Z'],
    ['Solar-powered desalination deployment remains too slow for growing water scarcity', 'https://www.nature.com/articles/s43246-024-00646-6', '20240930T000000Z'],
    ['The hunt for fresh solutions to a growing briny-water problem', 'https://www.nature.com/articles/d41586-024-02073-6', '20240704T000000Z']
  ]),
  jellyfish_swarm_surges: compactSeedSet('recurring jellyfish blooms expanding or intensifying as marine conditions change', [
    ['Climate change expands the invasion and bloom potential of Pelagia jellyfish', 'https://www.nature.com/articles/s41598-026-48886-5', '20260701T000000Z'],
    ['Jellyfish bloom hotspots recur along Italian coasts', 'https://www.nature.com/articles/s41598-025-05789-1', '20250601T000000Z'],
    ['Warmer winter conditions can intensify later jellyfish blooms', 'https://phys.org/news/2026-07-winter-conditions-future-jellyfish-blooms.html', '20260702T000000Z']
  ]),
  estuarine_nursery_loss: compactSeedSet('degraded and warming estuaries losing their capacity to shelter and feed juvenile fish', [
    ['Marine heatwaves reduce the nursery function of coastal fish habitat', 'https://www.nature.com/articles/s41598-024-63897-w', '20240627T000000Z'],
    ['Broken coastal seascape connectivity weakens estuarine nursery habitat', 'https://www.nature.com/articles/s44183-025-00128-3', '20250601T000000Z'],
    ['Intermittent estuaries are vulnerable ecosystems under growing human and climate pressure', 'https://www.nature.com/articles/s43247-025-02428-5', '20250606T000000Z']
  ]),
  wetland_peat_fires: compactSeedSet('drying peat wetlands burning deeply and releasing stored carbon and hazardous smoke', [
    ['Scottish megafire drives widespread peat carbon losses', 'https://www.nature.com/articles/s41561-026-01994-3', '20260601T000000Z'],
    ['Fire-severity records reveal repeated burning of tropical peat deposits', 'https://www.nature.com/articles/s41598-025-01123-x', '20250519T000000Z'],
    ['Drying makes tropical peat more vulnerable to severe smouldering fires', 'https://www.nature.com/articles/s41467-024-50916-7', '20240801T000000Z']
  ]),
  riparian_zone_erosion: compactSeedSet('riverbank erosion stripping riparian land, destabilizing channels, and threatening nearby settlements', [
    ['Riverbank and soil erosion threaten the upper Ghaghara basin', 'https://www.nature.com/articles/s41598-025-33264-4', '20260101T000000Z'],
    ['Extreme river flood exposes latent bank and bed erosion risk', 'https://www.nature.com/articles/s41586-025-09305-3', '20250701T000000Z'],
    ['Riparian vegetation stabilizes streambanks against erosion', 'https://www.nature.com/articles/s41598-025-22133-9', '20251101T000000Z']
  ]),
  nighttime_heat_retention: seedSet(NIGHT_HEAT_ARTICLES, 'hotter nights retaining heat, disrupting sleep, and preventing physiological recovery'),
  walker_circulation_shift: compactSeedSet('human-caused warming weakening or reorganizing the Pacific Walker circulation and connected rainfall', [
    ['Human-induced Walker circulation weakening emerges in climate models', 'https://www.nature.com/articles/s41467-024-53509-6', '20241024T000000Z'],
    ['Sea-surface temperature changes temporarily strengthen the Walker circulation', 'https://www.nature.com/articles/s41561-024-01510-5', '20240829T000000Z'],
    ['Tropical Pacific warming controls are shifting toward Walker circulation weakening', 'https://www.nature.com/articles/s41586-024-07452-7', '20240501T000000Z']
  ]),
  nunatak_habitat_shrinkage: compactSeedSet('glacier disappearance shrinking and homogenizing isolated ice-free mountain habitats around nunataks', [
    ['Peak glacier extinction will transform isolated mountain habitats', 'https://www.nature.com/articles/s41558-025-02513-9', '20260101T000000Z'],
    ['Deglaciation threatens specialist biodiversity and ecosystem function', 'https://www.nature.com/articles/s44358-025-00049-6', '20250601T000000Z'],
    ['A globally recognized island is losing its trademark glaciers', 'https://www.nature.com/articles/d41586-025-02473-2', '20250807T000000Z']
  ]),
  fjord_sedimentation_pulses: compactSeedSet('accelerating glacier melt and iceberg discharge sending large sediment pulses into fjords', [
    ['Greenland glacier sediment discharge is linked to surface melt', 'https://www.nature.com/articles/s41467-024-45694-1', '20240213T000000Z'],
    ['Greenland icebergs transport large sediment loads into fjords', 'https://www.nature.com/articles/s41467-025-67938-4', '20260114T000000Z'],
    ['Deglaciation changes sediment and nutrient delivery to downstream ecosystems', 'https://www.nature.com/articles/s44358-025-00049-6', '20250601T000000Z']
  ]),
  transformer_heat_failure_risk: compactSeedSet('extreme heat and overload raising transformer temperatures, degradation, and grid failure risk', [
    ['Thermal modelling identifies early signs of transformer failure', 'https://www.nature.com/articles/s41598-025-20747-7', '20251001T000000Z'],
    ['Low-carbon technology growth can overload local transformers', 'https://www.nature.com/articles/s41560-024-01542-6', '20240601T000000Z'],
    ['Grid-enhancing technologies improve transformer and line utilization', 'https://www.nature.com/articles/s44359-024-00001-5', '20250115T000000Z']
  ]),
  subpolar_gyre_weakening: compactSeedSet('North Atlantic warming and freshening weakening subpolar circulation and ocean heat transport', [
    ['Observations constrain future weakening of Atlantic overturning', 'https://www.nature.com/articles/s41561-025-01709-0', '20250501T000000Z'],
    ['The abyssal North Atlantic overturning limb is weakening', 'https://www.nature.com/articles/s41561-024-01422-4', '20240419T000000Z'],
    ['Observed North Atlantic temperature and salinity changes exceed model estimates', 'https://www.nature.com/articles/s41612-025-01210-w', '20250930T000000Z']
  ]),
  shelf_sea_hypoxia: compactSeedSet('oxygen loss and hypoxia spreading through continental shelf and coastal seas', [
    ['Hydrological-cycle amplification reshapes Atlantic oxygen loss', 'https://www.nature.com/articles/s41558-023-01897-w', '20240108T000000Z'],
    ['Eutrophication and stratification intensify estuarine and shelf hypoxia', 'https://www.nature.com/articles/s43247-024-01403-w', '20240504T000000Z'],
    ['Hypoxia threatens fish welfare and production on northern shelves', 'https://www.nature.com/articles/s41598-025-12697-x', '20250801T000000Z']
  ]),
  riverine_habitat_fragmentation: compactSeedSet('dams and barriers breaking river connectivity, fish migration routes, and freshwater habitat', [
    ['Dam construction fragments most of China’s major river systems', 'https://www.nature.com/articles/s43247-025-02416-9', '20250603T000000Z'],
    ['Impoundments alter more than 200,000 kilometres of European river habitat', 'https://www.nature.com/articles/s41467-023-40922-6', '20230901T000000Z'],
    ['Anthropogenic barriers strongly fragment fish habitat in the Mekong basin', 'https://www.nature.com/articles/s43247-025-02467-y', '20250701T000000Z']
  ]),
  high_altitude_forest_shrinkage: compactSeedSet('warming, drying, and land clearance shrinking and reorganizing high-elevation forests', [
    ['African montane forest loss amplifies warming and cloud-base rise', 'https://www.nature.com/articles/s41467-024-51324-7', '20240814T000000Z'],
    ['Alpine treelines shift upward while drought stress increases', 'https://www.nature.com/articles/s43017-025-00703-9', '20250701T000000Z'],
    ['Andean montane forest diversity changes as climates warm and dry', 'https://www.nature.com/articles/s41559-025-02956-5', '20251001T000000Z']
  ]),
  methane_hydroxyl_sink_loss: compactSeedSet('changes in hydroxyl radicals weakening or destabilizing the atmosphere’s main methane sink', [
    ['Air pollution changes the hydroxyl-controlled global methane sink', 'https://www.nature.com/articles/s41586-025-09004-z', '20250601T000000Z'],
    ['Atmospheric oxidation changes alter methane climate forcing', 'https://www.nature.com/articles/s41467-024-47436-9', '20240401T000000Z'],
    ['Methane seasonality reveals large changes in the hydroxyl sink', 'https://www.nature.com/articles/s41586-025-08900-8', '20250501T000000Z']
  ]),
  stratospheric_chlorine_sinks: compactSeedSet('chlorinated gases sustaining stratospheric chlorine and slowing ozone-layer recovery', [
    ['Short-lived chlorinated gases offset stratospheric chlorine reductions', 'https://www.nature.com/articles/s43247-025-02478-9', '20250701T000000Z'],
    ['Industrial chlorine emissions continue to affect stratospheric ozone', 'https://www.nature.com/articles/s41467-026-70533-w', '20260501T000000Z'],
    ['Antarctic ozone loss remains tied to stratospheric chlorine loading', 'https://www.nature.com/articles/s43247-025-03042-1', '20251201T000000Z']
  ]),
  fossil_power_backup_co2: compactSeedSet('coal and gas plants operating as renewable backup and continuing to emit carbon dioxide', [
    ['Coal plants remain a barrier to the global solar transition', 'https://www.nature.com/articles/s41893-026-01836-5', '20260601T000000Z'],
    ['Part-load fossil backup plants have higher carbon intensity', 'https://www.nature.com/articles/s41467-025-59800-4', '20250802T000000Z'],
    ['Grid carbon factors reveal continuing fossil-generator emissions', 'https://www.nature.com/articles/s41598-025-08053-8', '20250801T000000Z']
  ])
});

const CURATED_EVENT_SEEDS = Object.freeze({
  coal_retirement: compactSeedSet('coal-fired power plant retirement and closure', [
    ['Queensland\'s biggest coal-fired power station could close six years early', 'https://www.theguardian.com/environment/2025/oct/01/gladstone-queensland-biggest-coal-fired-power-station-could-close-six-years-early', '20251001T000000Z'],
    ['End of an era as Britain\'s last coal-fired power plant shuts down', 'https://www.theguardian.com/business/2024/sep/30/end-of-an-era-as-britains-last-coal-fired-power-plant-shuts-down', '20240930T000000Z'],
    ['G7 agree to end use of unabated coal power plants by 2035', 'https://www.theguardian.com/world/2024/apr/30/g7-agree-to-end-use-of-unabated-coal-power-plants-by-2035', '20240430T000000Z']
  ]),
  mortgage_market_exposure: compactSeedSet('climate hazards are affecting property insurance, mortgages, and housing finance', [
    ['How extreme weather is leaving thousands of homes uninsurable', 'https://www.theguardian.com/environment/2026/feb/26/insurance-industry-mortgage-prisoners-climate-crisis-down-to-earth', '20260226T000000Z'],
    ['How climate risks are driving up insurance premiums around the US - visualized', 'https://www.theguardian.com/environment/2024/dec/05/climate-crisis-insurance-premiums', '20241205T000000Z'],
    ['Nationwide stops lending on some flood-risk properties', 'https://www.theguardian.com/business/2024/apr/30/nationwide-stops-lending-on-some-flood-risk-properties', '20240430T000000Z']
  ]),
  hydrological_runoff_surges: compactSeedSet('extreme rainfall generated rapid runoff and destructive flash flooding', [
    ['Human-induced climate change amplification on storm dynamics in Valencia\'s 2024 catastrophic flash flood', 'https://www.nature.com/articles/s41467-026-68929-9', '20260217T000000Z'],
    ['Southern Florida sees record-breaking storms with up to 8in of rainfall', 'https://www.theguardian.com/us-news/article/2024/jun/12/florida-record-rain-flooding', '20240612T000000Z'],
    ['Weather tracker: rains bring deadly flash floods to Afghanistan and Pakistan', 'https://www.theguardian.com/environment/2024/apr/19/weather-tracker-rains-bring-deadly-flash-floods-to-afghanistan-and-pakistan', '20240419T000000Z']
  ]),
  aquifer_recharge_failure: compactSeedSet('drought and aridification reduced groundwater recharge and aquifer replenishment', [
    ['Drying groundwater', 'https://www.nature.com/articles/s41558-024-02126-8', '20240906T000000Z'],
    ['Groundwater recharge is sensitive to changing long-term aridity', 'https://www.nature.com/articles/s41558-024-01953-z', '20240312T000000Z'],
    ['Millennium-scale changes in the Atlantic Multidecadal Oscillation influenced groundwater recharge rates in Italy', 'https://www.nature.com/articles/s43247-024-01229-6', '20240129T000000Z']
  ]),
  migration: compactSeedSet('climate disasters and extreme weather forced people to leave their homes', [
    ['Climate disasters displaced 250 million people in past 10 years, UN report finds', 'https://www.theguardian.com/environment/2025/nov/09/climate-disasters-displaced-250-million-people-in-past-10-years-un-report-finds', '20251109T000000Z'],
    ['I don\'t want to be here. But we can\'t go home: what life is like for people forced to flee floods and fighting', 'https://www.theguardian.com/global-development/2025/may/23/floods-trauma-displaced-conflict-climate-crisis-safety-bangladesh-sudan-colombia-idp-camps', '20250523T000000Z'],
    ['Thirty-five million Africans driven from homes by war and climate disasters - report', 'https://www.theguardian.com/global-development/2024/nov/26/thirty-five-million-africans-driven-from-homes-by-war-and-climate-disasters-report', '20241126T000000Z']
  ]),
  data_centers: compactSeedSet('data centers increased electricity and water demand at regional scale', [
    ['Amazon strategised about keeping its datacentres full water use secret, leaked document shows', 'https://www.theguardian.com/technology/2025/oct/25/amazon-datacentres-water-use-disclosure', '20251025T000000Z'],
    ['Revealed: Big tech\'s new datacentres will take water from the world\'s driest areas', 'https://www.theguardian.com/environment/2025/apr/09/big-tech-datacentres-water', '20250409T000000Z'],
    ['Ireland\'s datacentres overtake electricity use of all urban homes combined', 'https://www.theguardian.com/world/article/2024/jul/23/ireland-datacentres-overtake-electricity-use-of-all-homes-combined-figures-show', '20240723T000000Z']
  ]),
  water_stress: compactSeedSet('water demand and drought exceeded renewable water supplies', [
    ['Groundwater recharge is sensitive to changing long-term aridity', 'https://www.nature.com/articles/s41558-024-01953-z', '20240312T000000Z'],
    ['Rapid groundwater decline and some cases of recovery in aquifers globally', 'https://www.nature.com/articles/s41586-023-06879-8', '20240124T000000Z'],
    ['Global peak water limit of future groundwater withdrawals', 'https://www.nature.com/articles/s41893-024-01306-w', '20240422T000000Z']
  ]),
  carbon_emission: compactSeedSet('global carbon dioxide emissions and atmospheric accumulation reached new highs', [
    ['Half of world\'s CO2 emissions come from just 32 fossil fuel firms, study shows', 'https://www.theguardian.com/environment/2026/jan/21/carbon-dioxide-co2-emissions-fossil-fuel-firms-study', '20260121T000000Z'],
    ['Global carbon emissions and decarbonization in 2024', 'https://www.nature.com/articles/s43017-025-00658-x', '20250411T000000Z'],
    ['No sign of promised fossil fuel transition as emissions hit new high', 'https://www.theguardian.com/environment/2024/nov/13/no-sign-of-promised-fossil-fuel-transition-as-emissions-hit-new-high', '20241113T000000Z']
  ]),
  industry_farming: compactSeedSet('industrial and intensive farming caused large-scale pollution and health impacts', [
    ['Drugs, hormones and excrement: the polluting pig mega-farms supplying pork to the world', 'https://www.theguardian.com/environment/2024/nov/25/drugs-hormones-excrement-pig-farms-mexico-water-yucatan', '20241125T000000Z'],
    ['I am always tired: life in the long shadow of factory farming in Europe', 'https://www.theguardian.com/world/article/2024/aug/23/long-shadow-life-under-the-veiled-grasp-of-factory-farming-in-europe', '20240823T000000Z'],
    ['Agricultural intensification in Lake Naivasha Catchment in Kenya and associated nutrients and pesticides pollution', 'https://www.nature.com/articles/s41598-024-67460-5', '20240809T000000Z']
  ]),
  resource_depletion: compactSeedSet('large-scale extraction depleted groundwater and finite agricultural resources', [
    ['Global peak water limit of future groundwater withdrawals', 'https://www.nature.com/articles/s41893-024-01306-w', '20240422T000000Z'],
    ['Groundwater decline is global but not universal', 'https://www.nature.com/articles/d41586-024-00070-3', '20240124T000000Z'],
    ['Phosphorus applications adjusted to optimal crop yields can help sustain global phosphorus reserves', 'https://www.nature.com/articles/s43016-024-00952-9', '20240401T000000Z']
  ]),
  fast_fashion: seedSet(FAST_FASHION_ARTICLES, 'fast fashion waste and textile overproduction'),
  ai_data_centers: seedSet(AI_DATA_CENTER_ARTICLES, 'rapid AI data-center expansion and its electricity demand'),
  shipping: seedSet(SHIPPING_EMISSIONS_ARTICLES, 'fossil-fueled shipping growth and maritime emissions'),
  reservoir_operating_shortfall: seedSet(RESERVOIR_SHORTFALL_ARTICLES, 'reservoir levels too low to maintain expected water or power operations'),
  fish_landing_supply_disruption: seedSet(FISHERY_SUPPLY_ARTICLES, 'reduced or disrupted fish landings and seafood supply'),
  nocturnal_heat_stress: seedSet(NIGHT_HEAT_ARTICLES, 'dangerous nighttime heat that prevents recovery and raises mortality'),
  grid_peak_load_stress: seedSet(GRID_PEAK_ARTICLES, 'peak electricity demand straining grid capacity and reliability'),
  transformer_supply_bottleneck: seedSet(TRANSFORMER_SUPPLY_ARTICLES, 'transformer shortages delaying grid repairs and expansion'),
  transmission_buildout_lag: seedSet(TRANSMISSION_BUILDOUT_ARTICLES, 'insufficient transmission capacity delaying clean power and reliability gains'),
  aviation_demand_growth: seedSet(AVIATION_DEMAND_ARTICLES, 'rising flight demand increasing aviation fuel use and emissions'),
  renewable_curtailment_losses: seedSet(RENEWABLE_CURTAILMENT_ARTICLES, 'renewable electricity curtailed when grids lack transmission or storage'),
  fertilizer_price_shock: seedSet(FERTILIZER_SHOCK_ARTICLES, 'fertilizer shortages and price spikes threatening farm yields and food costs'),
  fishery_protein_dependence: seedSet(FISHERY_PROTEIN_ARTICLES, 'communities relying on threatened fisheries for dietary protein and income'),
  cooling_equity_gaps: seedSet(COOLING_EQUITY_ARTICLES, 'unequal access to safe indoor cooling during extreme heat'),
  desertification_frontiers: seedSet(DESERTIFICATION_ARTICLES, 'aridity expanding dryland degradation and desertification risk'),
  coastal_property_insurance_redlines: seedSet(COASTAL_INSURANCE_ARTICLES, 'coastal climate risk making property insurance unavailable or unaffordable'),
  freeze_thaw_rock_fracturing: seedSet(FREEZE_THAW_ROCK_ARTICLES, 'freeze-thaw cycles fracturing rock and destabilizing mountain slopes'),
  shipping_bunker_fuel_co2: seedSet(SHIPPING_EMISSIONS_ARTICLES, 'bunker-fuel combustion driving shipping carbon dioxide emissions'),
  thermokarst_expansion: seedSet(PERMAFROST_ARTICLES, 'thermokarst and permafrost collapse'),
  talik_expansion: seedSet(PERMAFROST_ARTICLES, 'talik development from permafrost thaw'),
  tundra_methane_outgassing: seedSet(PERMAFROST_ARTICLES, 'Arctic tundra methane released by permafrost thaw'),
  firn_layer_depletion: seedSet(FIRN_ARTICLES, 'firn pore-space depletion and reduced glacier snow retention'),
  ice_albedo_feedback_loops: seedSet(DARK_ICE_ARTICLES, 'darkening ice lowers albedo and accelerates melt'),
  ice_algae_pigmentation: seedSet(DARK_ICE_ARTICLES, 'pigmented ice algae darken glacier surfaces'),
  cryoconite_hole_expansion: [
    {
      title: 'Antarctic Blue Ice Areas are hydrologically active, nutrient rich and contain microbially diverse cryoconite holes',
      url: 'https://www.nature.com/articles/s43247-024-01487-4',
      domain: 'nature.com',
      seendate: '20240624T000000Z',
      relevanceText: 'cryoconite holes across Antarctic blue ice areas'
    },
    ...seedSet(DARK_ICE_ARTICLES.slice(0, 2), 'cryoconite and dark biological material increase ice melt')
  ],
  snowpack_dust_soot_coverage: [
    {
      title: 'Dark brown carbon from wildfires: a potent snow radiative forcing agent?',
      url: 'https://www.nature.com/articles/s41612-024-00738-7',
      domain: 'nature.com',
      seendate: '20241018T000000Z',
      relevanceText: 'soot on snow lowers albedo and accelerates snowmelt'
    },
    {
      title: 'Contribution of surface and cloud radiative feedbacks to Greenland Ice Sheet meltwater production during 2002–2023',
      url: 'https://www.nature.com/articles/s43247-024-01714-y',
      domain: 'nature.com',
      seendate: '20241016T000000Z',
      relevanceText: 'dust on snow and black carbon darken the Greenland Ice Sheet'
    },
    {
      title: 'Climate change impacts on ocean light in Arctic ecosystems',
      url: 'https://www.nature.com/articles/s41467-025-64790-4',
      domain: 'nature.com',
      seendate: '20251103T000000Z',
      relevanceText: 'soot on snow and anthropogenic dust reduce snow and ice albedo'
    }
  ],
  savannah_tree_cover_decline: [
    {
      title: 'Fire weakens land carbon sinks before 1.5 °C',
      url: 'https://www.nature.com/articles/s41561-024-01554-7',
      domain: 'nature.com',
      seendate: '20241003T000000Z',
      relevanceText: 'fire and drought reduce savanna tree cover'
    },
    {
      title: 'Fire, environmental and anthropogenic controls on pantropical tree cover',
      url: 'https://www.nature.com/articles/s43247-024-01869-8',
      domain: 'nature.com',
      seendate: '20241212T000000Z',
      relevanceText: 'burning and land pressure reduce savanna tree cover'
    },
    {
      title: 'Severe decline in large farmland trees in India over the past decade',
      url: 'https://www.nature.com/articles/s41893-024-01356-0',
      domain: 'nature.com',
      seendate: '20240515T000000Z',
      relevanceText: 'large tree loss reduces savanna tree cover in open landscapes'
    }
  ],
  ice_cap_decapitation: seedSet(GLACIER_LOSS_ARTICLES, 'ice cap and glacier disappearance from sustained warming'),
  nunatak_habitat_shrinkage: seedSet(GLACIER_LOSS_ARTICLES, 'glacier loss reshapes nunatak and summit habitat'),
  overstory_tree_mortality: [
    {
      title: 'Droughts preceding tree mortality events have increased in duration and intensity, especially in dry biomes',
      url: 'https://www.nature.com/articles/s41467-025-60856-5',
      domain: 'nature.com',
      seendate: '20250623T000000Z',
      relevanceText: 'drought drives overstory tree mortality and canopy dieback'
    },
    {
      title: 'Hot droughts in the Amazon provide a window to a future hypertropical climate',
      url: 'https://www.nature.com/articles/s41586-025-09728-y',
      domain: 'nature.com',
      seendate: '20251217T000000Z',
      relevanceText: 'hot drought raises overstory tree mortality and forest dieback risk'
    },
    {
      title: 'Tree mortality during long-term droughts is lower in structurally complex forest stands',
      url: 'https://www.nature.com/articles/s41467-023-43083-8',
      domain: 'nature.com',
      seendate: '20231117T000000Z',
      relevanceText: 'canopy structure changes overstory tree mortality during prolonged drought'
    }
  ],
  tundra_shrubification_speeds: seedSet(TUNDRA_SHRUB_ARTICLES, 'shrub expansion and tundra greening accelerate landscape change'),
  subsea_cable_landing_chokepoint: [
    {
      title: 'Internet outage hits several African countries as undersea cables fail',
      url: 'https://apnews.com/article/ac67fd11b4d9ae7cb3959622c5e9e78b',
      domain: 'apnews.com',
      seendate: '20240314T000000Z',
      relevanceText: 'failures near subsea cable landing points caused regional internet outages'
    },
    {
      title: 'Undersea cables cut in the Red Sea, disrupting internet access in Asia and the Mideast',
      url: 'https://apnews.com/article/b79fe7b9764647ac0851b9390a313e70',
      domain: 'apnews.com',
      seendate: '20250907T000000Z',
      relevanceText: 'subsea cable cuts exposed cable landing chokepoints'
    },
    {
      title: 'Commercial shipping likely cut Red Sea cables that disrupted internet access, experts say',
      url: 'https://apnews.com/article/0b08fc5f02daf72710e0010c11ea21ae',
      domain: 'apnews.com',
      seendate: '20250909T000000Z',
      relevanceText: 'multiple subsea cable cuts exposed a narrow cable landing and transit chokepoint'
    }
  ],
  levee_and_channelization_works: [
    {
      title: 'Crews use sandbags to shore up levee breach near Seattle after failure prompts flood warning',
      url: 'https://apnews.com/article/446e4f8f027550db1afee2a214450de8',
      domain: 'apnews.com',
      seendate: '20251215T000000Z',
      relevanceText: 'levee failure prompted evacuations and flash flood warnings'
    },
    {
      title: 'Tiny town swamped as flood waters the size of NSW inundate western Queensland',
      url: 'https://www.theguardian.com/environment/2025/apr/03/thargomindah-inundated-as-floodwaters-swamp-western-queensland',
      domain: 'theguardian.com',
      seendate: '20250403T000000Z',
      relevanceText: 'levee breach inundated most homes and businesses'
    },
    {
      title: 'Floodwaters breach levees in Iowa as Midwest faces another round of severe storms',
      url: 'https://www.pbs.org/newshour/nation/floodwaters-breach-levees-in-iowa-as-midwest-faces-another-round-of-severe-storms',
      domain: 'pbs.org',
      seendate: '20240625T000000Z',
      relevanceText: 'levee breaches flooded Iowa communities and farmland'
    }
  ],
  anaerobic_manure_lagoon_operation: [
    {
      title: 'Converting cow manure to fuel is growing climate solution, but critics say communities put at risk',
      url: 'https://apnews.com/article/c4c39b3519fce4219d76d17332e4aa8a',
      domain: 'apnews.com',
      seendate: '20240424T000000Z',
      relevanceText: 'covered anaerobic manure lagoons capture methane while raising community concerns'
    },
    {
      title: 'Unlocking the potential of biogas systems for energy production and climate solutions in rural communities',
      url: 'https://www.nature.com/articles/s41467-024-50091-9',
      domain: 'nature.com',
      seendate: '20240716T000000Z',
      relevanceText: 'anaerobic manure lagoon operation can leak methane when biogas is not fully used'
    },
    {
      title: 'Co-benefits for cropland yield, nitrogen emissions, and climate impact through multi-objective optimization agricultural manure solutions',
      url: 'https://www.nature.com/articles/s41467-025-61885-w',
      domain: 'nature.com',
      seendate: '20250711T000000Z',
      relevanceText: 'manure lagoon and livestock waste management drive methane and nitrogen pollution'
    }
  ],
  urban_hydrologic_supply_shortfall: [
    {
      title: "Colombia's capital ends drought-related water rationing. Its case is a warning to other cities",
      url: 'https://apnews.com/article/146a70d3048f574c8317bf70c280a5a8',
      domain: 'apnews.com',
      seendate: '20250411T000000Z',
      relevanceText: 'Bogotá urban water shortage forced yearlong rationing'
    },
    {
      title: "Taps have run dry across South Africa's largest city in an unprecedented water crisis",
      url: 'https://apnews.com/article/fa8c921c6a063a31aec37e05864d61fb',
      domain: 'apnews.com',
      seendate: '20240321T000000Z',
      relevanceText: 'Johannesburg city water supply failed for millions'
    },
    {
      title: "India's Bengaluru is fast running out of water, and a long, scorching summer still looms",
      url: 'https://apnews.com/article/17554235dba0741a266f2251b91aec8f',
      domain: 'apnews.com',
      seendate: '20240317T000000Z',
      relevanceText: 'Bengaluru urban water shortage depleted wells and drove emergency rationing'
    }
  ],
  refinery_combustion_co2: [
    {
      title: 'Unaddressed non-energy use in the chemical industry can undermine fossil fuels phase-out',
      url: 'https://www.nature.com/articles/s41467-024-52434-y',
      domain: 'nature.com',
      seendate: '20240918T000000Z',
      relevanceText: 'petroleum refinery emissions persist when fossil feedstocks and combustion remain in use'
    },
    {
      title: 'Reducing uncertainties in greenhouse gas emissions from chemical production',
      url: 'https://www.nature.com/articles/s44286-024-00047-z',
      domain: 'nature.com',
      seendate: '20240326T000000Z',
      relevanceText: 'petrochemical refinery emissions include on-site fuel combustion and chemical reactions'
    },
    {
      title: 'Climate, air quality, and equity benefits from hydrogen substitution for fossil fuels used in process heat',
      url: 'https://www.nature.com/articles/s41467-025-65216-x',
      domain: 'nature.com',
      seendate: '20251117T000000Z',
      relevanceText: 'petroleum refinery emissions from process heat and fossil fuel combustion'
    }
  ],
  peatland_drainage_co2: [
    {
      title: 'Identifying hotspots of greenhouse gas emissions from drained peatlands in the European Union',
      url: 'https://www.nature.com/articles/s41467-025-65841-6',
      domain: 'nature.com',
      seendate: '20251202T000000Z',
      relevanceText: 'drained peatland releases carbon dioxide and other greenhouse gases'
    },
    {
      title: 'Temporally dynamic carbon dioxide and methane emission factors for rewetted peatlands',
      url: 'https://www.nature.com/articles/s43247-024-01226-9',
      domain: 'nature.com',
      seendate: '20240214T000000Z',
      relevanceText: 'peat drainage causes carbon dioxide emissions that rewetting can reduce'
    },
    {
      title: 'Ditch emissions partially offset global reductions in methane emissions from peatland drainage',
      url: 'https://www.nature.com/articles/s43247-024-01818-5',
      domain: 'nature.com',
      seendate: '20241205T000000Z',
      relevanceText: 'peat drainage ditches release methane and alter greenhouse gas emissions'
    }
  ],
  rain_on_snow_flood_risk: [
    {
      title: 'Heavy rain and snowmelt are hurtling large chunks of ice into northeastern Michigan homes',
      url: 'https://apnews.com/article/d83a13de0568aefe4fb5d2fc6ffa4287',
      domain: 'apnews.com',
      seendate: '20260422T000000Z',
      relevanceText: 'heavy rain and snowmelt flooding'
    },
    {
      title: 'A bomb cyclone brings blizzards to the Midwest before turning east',
      url: 'https://apnews.com/article/cb49c60e237aa67d7a296d04da78193b',
      domain: 'apnews.com',
      seendate: '20251229T000000Z',
      relevanceText: 'flood watches from snowmelt and heavy rain'
    },
    {
      title: 'Flooding in southeastern Oregon prompts evacuation orders, school closures and health concerns',
      url: 'https://apnews.com/article/ddf0f15585910405373cc412219ff1b8',
      domain: 'apnews.com',
      seendate: '20250403T000000Z',
      relevanceText: 'historic snowmelt and rainfall flooding'
    }
  ],
  thermal_stratification_intensification: seedSet(OCEAN_STRATIFICATION_ARTICLES, 'ocean warming strengthens stratification and reduces deep-water mixing'),
  marine_pathogen_range_expansion: [
    {
      title: '40 priority questions to advance understanding of the risks and opportunities of UK marine heatwaves',
      url: 'https://www.nature.com/articles/s44183-025-00171-0',
      domain: 'nature.com',
      seendate: '20260101T000000Z',
      relevanceText: 'Vibrio marine bacteria grow in warm coastal waters'
    },
    {
      title: 'Global distribution and predictive modeling of Vibrio vulnificus abundance',
      url: 'https://www.nature.com/articles/s43247-025-02182-8',
      domain: 'nature.com',
      seendate: '20250318T000000Z',
      relevanceText: 'Vibrio marine pathogens expand poleward as coastal waters warm'
    },
    {
      title: 'How to protect yourself from Vibrio vulnificus, the bacteria found in some coastal waters',
      url: 'https://apnews.com/article/ad470f8d062303510e1adaae22440b04',
      domain: 'apnews.com',
      seendate: '20250820T000000Z',
      relevanceText: 'Vibrio marine pathogen infections are increasing along warmer coastlines'
    }
  ],
  delta_salt_intrusion_fronts: [
    {
      title: "Water rises and land sinks in Vietnam's Mekong Delta",
      url: 'https://www.lemonde.fr/en/environment/article/2025/11/01/water-rises-and-land-sinks-in-vietnam-s-mekong-delta_6746986_114.html',
      domain: 'lemonde.fr',
      seendate: '20251101T000000Z',
      relevanceText: 'saltwater intrusion moves inland through the Mekong Delta'
    }
  ],
  oceanic_upwelling_disruptions: [
    {
      title: 'This El Niño Will Be Unlike Any in the Past Eight Decades',
      url: 'https://www.theatlantic.com/science/2026/08/el-nino-effects/688429/',
      domain: 'theatlantic.com',
      seendate: '20260830T000000Z',
      relevanceText: 'El Niño disrupts cold nutrient rich upwelling and fisheries'
    },
    {
      title: 'Human-induced intensification of sea surface temperature regime shifts threatens global Large Marine Ecosystems',
      url: 'https://www.nature.com/articles/s41467-026-70986-z',
      domain: 'nature.com',
      seendate: '20260401T000000Z',
      relevanceText: 'warming disrupts coastal upwelling and marine food systems'
    }
  ],
  tropical_cyclone_rapid_intensification: [
    {
      title: 'Hurricane Lee is charting a new course in weather and could signal more monster storms',
      url: 'https://apnews.com/article/36e45b46071f8b68fd7a83a6d4936a51',
      domain: 'apnews.com',
      seendate: '20230909T000000Z',
      relevanceText: 'Hurricane Lee underwent rapid intensification into a Category 5 storm'
    }
  ],
  coastal_permafrost_erosion: [
    {
      title: 'Reduced Arctic Ocean CO2 uptake due to coastal permafrost erosion',
      url: 'https://www.nature.com/articles/s41558-024-02074-3',
      domain: 'nature.com',
      seendate: '20240801T000000Z',
      relevanceText: 'Arctic coastal permafrost erosion accelerates with warming'
    },
    {
      title: 'Glacial isostatic adjustment reduces past and future Arctic subsea permafrost',
      url: 'https://www.nature.com/articles/s41467-024-45906-8',
      domain: 'nature.com',
      seendate: '20240401T000000Z',
      relevanceText: 'coastal erosion converts terrestrial Arctic permafrost into subsea permafrost'
    }
  ],
  telecom_backbone: [
    {
      title: 'Undersea cables cut in the Red Sea, disrupting internet access in Asia and the Mideast',
      url: 'https://apnews.com/article/b79fe7b9764647ac0851b9390a313e70',
      domain: 'apnews.com',
      seendate: '20250907T000000Z',
      relevanceText: 'fiber optic internet backbone cable cuts caused regional network disruption'
    },
    {
      title: 'Officials say 911 emergency lines are back up in Mississippi and Louisiana',
      url: 'https://apnews.com/article/aa5c376f7772522e6d1506b5e250df54',
      domain: 'apnews.com',
      seendate: '20250925T000000Z',
      relevanceText: 'fiber optic line damage disrupted emergency telecom networks'
    },
    {
      title: 'Air traffic controllers in Florida briefly lost radar after fiber optic line was cut',
      url: 'https://apnews.com/article/e9ddd49aa10f3af6b9006291c67ff43d',
      domain: 'apnews.com',
      seendate: '20250620T000000Z',
      relevanceText: 'fiber optic backbone line damage disrupted a critical communications network'
    }
  ],
  methane_leak_detection: [
    {
      title: "Revealed: the world’s worst mega-leaks of methane driving global heating",
      url: 'https://www.theguardian.com/environment/2026/mar/17/revealed-world-worst-methane-leaks-global-heating',
      domain: 'theguardian.com',
      seendate: '20260317T000000Z',
      relevanceText: 'satellite detection revealed methane super-emitter leaks'
    },
    {
      title: "Invisible plumes and ‘terrible pollution’: the reality of the US gas sites rated ‘grade A’",
      url: 'https://www.theguardian.com/environment/2026/apr/01/invisible-plumes-and-terrible-pollution-the-reality-of-the-us-gas-sites-rated-grade-a',
      domain: 'theguardian.com',
      seendate: '20260401T000000Z',
      relevanceText: 'methane monitoring and leak detection exposed gas site pollution'
    },
    {
      title: 'Hunt for methane leaks reveals persistent pollution around French oil and gas sites',
      url: 'https://www.lemonde.fr/en/environment/article/2026/05/04/hunt-for-methane-leaks-reveals-persistent-pollution-around-french-oil-and-gas-sites_6753118_114.html',
      domain: 'lemonde.fr',
      seendate: '20260504T000000Z',
      relevanceText: 'optical methane leak detection found persistent gas infrastructure emissions'
    }
  ],
  refrigerant_phase_down: [
    {
      title: 'Why companies are phasing out these super-pollutants despite Trump',
      url: 'https://www.washingtonpost.com/climate-solutions/2026/01/30/refrigerators-air-conditioners-superpollutants/',
      domain: 'washingtonpost.com',
      seendate: '20260130T000000Z',
      relevanceText: 'companies phase out high warming HFC refrigerants in cooling equipment'
    },
    {
      title: 'UK HFC phase down stalls',
      url: 'https://www.climatecontrolnews.com.au/refrigeration/uk-hfc-phase-down-stalls',
      domain: 'climatecontrolnews.com.au',
      seendate: '20260518T000000Z',
      relevanceText: 'HFC refrigerant phase down schedule delayed in the United Kingdom'
    },
    {
      title: 'Regulatory Changes Are Reshaping The HVACR Industry',
      url: 'https://www.achrnews.com/articles/165019-regulatory-changes-are-reshaping-the-hvacr-industry',
      domain: 'achrnews.com',
      seendate: '20250601T000000Z',
      relevanceText: 'HFC refrigerant phase down shifts cooling equipment to lower warming gases'
    },
    {
      title: 'A2Ls Advance Despite Regulatory Uncertainty',
      url: 'https://www.achrnews.com/articles/166001-a2ls-advance-despite-regulatory-uncertainty',
      domain: 'achrnews.com',
      seendate: '20260101T000000Z',
      relevanceText: 'lower warming A2L refrigerants advance as the HFC phase down continues'
    }
  ],
  ...REMEDIATION_EVENT_SEEDS
});

const TRUSTED_PUBLISHERS = Object.freeze(new Map([
  ['apnews.com', 'Associated Press'],
  ['reuters.com', 'Reuters'],
  ['bbc.com', 'BBC'],
  ['bbc.co.uk', 'BBC'],
  ['theguardian.com', 'The Guardian'],
  ['nytimes.com', 'The New York Times'],
  ['washingtonpost.com', 'The Washington Post'],
  ['npr.org', 'NPR'],
  ['pbs.org', 'PBS NewsHour'],
  ['cnn.com', 'CNN'],
  ['cbc.ca', 'CBC News'],
  ['abc.net.au', 'ABC News Australia'],
  ['channelnewsasia.com', 'CNA'],
  ['thehindu.com', 'The Hindu'],
  ['indianexpress.com', 'The Indian Express'],
  ['straitstimes.com', 'The Straits Times'],
  ['scmp.com', 'South China Morning Post'],
  ['smh.com.au', 'The Sydney Morning Herald'],
  ['latimes.com', 'Los Angeles Times'],
  ['swissinfo.ch', 'SWI swissinfo.ch'],
  ['aljazeera.com', 'Al Jazeera'],
  ['dw.com', 'Deutsche Welle'],
  ['france24.com', 'France 24'],
  ['euronews.com', 'Euronews'],
  ['time.com', 'TIME'],
  ['bloomberg.com', 'Bloomberg'],
  ['ft.com', 'Financial Times'],
  ['economist.com', 'The Economist'],
  ['nature.com', 'Nature'],
  ['science.org', 'Science'],
  ['scientificamerican.com', 'Scientific American'],
  ['newscientist.com', 'New Scientist'],
  ['nationalgeographic.com', 'National Geographic'],
  ['carbonbrief.org', 'Carbon Brief'],
  ['insideclimatenews.org', 'Inside Climate News'],
  ['climatechangenews.com', 'Climate Home News'],
  ['grist.org', 'Grist'],
  ['mongabay.com', 'Mongabay'],
  ['e360.yale.edu', 'Yale Environment 360'],
  ['theconversation.com', 'The Conversation'],
  ['phys.org', 'Phys.org'],
  ['kathmandupost.com', 'The Kathmandu Post'],
  ['dialogue.earth', 'Dialogue Earth'],
  ['chinadialogue.net', 'China Dialogue'],
  ['canarymedia.com', 'Canary Media'],
  ['utilitydive.com', 'Utility Dive'],
  ['heatmap.news', 'Heatmap News'],
  ['wired.com', 'WIRED'],
  ['arstechnica.com', 'Ars Technica'],
  ['technologyreview.com', 'MIT Technology Review'],
  ['datacenterdynamics.com', 'Data Center Dynamics'],
  ['theregister.com', 'The Register'],
  ['restofworld.org', 'Rest of World'],
  ['theatlantic.com', 'The Atlantic'],
  ['lemonde.fr', 'Le Monde'],
  ['axios.com', 'Axios'],
  ['techradar.com', 'TechRadar'],
  ['achrnews.com', 'ACHR News'],
  ['climatecontrolnews.com.au', 'Climate Control News']
]));

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const rewriteExistingSummaries = args.has('--rewrite-existing-summaries');
const writeSelected = args.has('--write-selected');
const maxNodes = Number.parseInt(process.env.RECENT_EVENTS_MAX_NODES || '', 10);
const nodeOffset = Math.max(0, Number.parseInt(process.env.RECENT_EVENTS_NODE_OFFSET || '0', 10));
const requestedNodeIds = new Set(String(process.env.RECENT_EVENTS_NODE_IDS || '').split(',').map(value => value.trim()).filter(Boolean));
const debug = process.env.RECENT_EVENTS_DEBUG === '1';

function normalizeDomain(value) {
  return String(value || '').toLowerCase().replace(/^www\./, '');
}

function publisherForDomain(domain) {
  const normalized = normalizeDomain(domain);
  for (const [trustedDomain, label] of TRUSTED_PUBLISHERS) {
    if (normalized === trustedDomain || normalized.endsWith(`.${trustedDomain}`)) return label;
  }
  return '';
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetaDescriptions(html) {
  const patterns = [
    /<meta[^>]+(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]*>/gi
  ];
  const descriptions = [];
  for (const pattern of patterns) {
    for (const match of String(html || '').matchAll(pattern)) {
      if (match[1]) descriptions.push(decodeHtml(match[1]));
    }
  }
  return descriptions;
}

function collectJsonLdText(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdText(item, output);
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  for (const [key, child] of Object.entries(value)) {
    if (['description', 'articleBody', 'text'].includes(key) && typeof child === 'string') output.push(decodeHtml(child));
    else collectJsonLdText(child, output);
  }
  return output;
}

function extractArticleMaterials(html, title) {
  const materials = [...extractMetaDescriptions(html)];
  const scripts = String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      collectJsonLdText(JSON.parse(match[1]), materials);
    } catch {
      // Some publishers emit non-JSON data in ld+json blocks; ordinary article paragraphs remain available below.
    }
  }
  for (const match of String(html || '').matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)) {
    materials.push(decodeHtml(match[1]));
  }
  materials.push(decodeHtml(title));
  const seen = new Set();
  return materials
    .map(value => value.replace(/\s*(Read more|Continue reading).*$/i, '').replace(/\s+/g, ' ').trim())
    .filter(value => countWords(value) >= 8)
    .filter(value => !/(subscribe|sign up|cookie policy|all rights reserved|javascript is disabled)/i.test(value))
    .filter(value => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const GENERIC_NODE_TERMS = new Set([
  'amplification', 'burden', 'change', 'collapse', 'competition', 'crisis', 'decline', 'dependence', 'depletion',
  'disruption', 'expansion', 'exposure', 'failure', 'footprint', 'gap', 'global', 'growth', 'hazard', 'inefficiency',
  'instability', 'intensification', 'lag', 'lock', 'loss', 'pressure', 'regime', 'risk', 'shift', 'shortfall', 'stress',
  'supply', 'transition', 'vulnerability', 'weakening', 'areas', 'chains', 'events', 'fields', 'heat', 'layers', 'levels',
  'operation', 'output', 'power', 'rates', 'scales', 'source', 'speeds', 'urban', 'water', 'works', 'zones'
]);

const SHORT_TOPIC_TERMS = new Set(['ai', 'cfc', 'co2', 'gas', 'hfc', 'oil', 'pm25']);

const SEARCH_TERM_NORMALIZATION = Object.freeze({
  littoral: 'coastal',
  nocturnal: 'nighttime',
  oceanic: 'ocean',
  pelagic: 'marine',
  photovoltaic: 'solar'
});

function nodeSearchTerms(node) {
  const terms = String(node.name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map(term => SEARCH_TERM_NORMALIZATION[term] || term)
    .filter(term => (term.length >= 4 || SHORT_TOPIC_TERMS.has(term)) && !GENERIC_NODE_TERMS.has(term));
  return [...new Set(terms)];
}

function articleMatchesNode(node, article, materials) {
  if (article.curated) return true;
  const manualKeywords = RELEVANCE_KEYWORDS[node.id];
  const keywords = manualKeywords || nodeSearchTerms(node);
  if (!keywords.length) return true;
  const haystack = `${decodeHtml(article.title)} ${article.relevanceText || ''} ${materials.join(' ')}`.toLowerCase();
  const matches = keywords.filter(keyword => new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\b`, 'i').test(haystack));
  return matches.length > 0;
}


const LOW_INFORMATION_SUMMARY_PATTERN = /recent documented example|full article context|affected place or system|reported consequence preserved|linked source preserves/i;

function gdeltDate(value) {
  const match = String(value || '').match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function extractPublishedDate(html, fallback = '') {
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:article:published_time|datePublished|date|pubdate)["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:article:published_time|datePublished|date|pubdate)["'][^>]*>/i,
    /"datePublished"\s*:\s*"([^"]+)"/i
  ];
  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);
    const date = match?.[1]?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (date) return date;
  }
  return fallback;
}

function baseNodeQuery(node) {
  const name = String(node.name || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(term => term.length >= 3)
    .join(' ')
    .trim();
  const sphereContext = {
    atmosphere: 'climate',
    oceans: 'ocean',
    cryosphere: 'glacier',
    biosphere: 'environment',
    agriculture: 'food OR farming',
    energy: 'energy',
    digital: 'technology',
    economy: 'economy',
    sociopolitical: 'people OR policy',
    transport: 'transport'
  }[node.sphere] || 'climate OR environment';
  const contextQuery = sphereContext.includes(' OR ') ? `(${sphereContext})` : sphereContext;
  return `${name} ${contextQuery} sourcelang:english`;
}

function relaxedNodeQuery(node) {
  const terms = nodeSearchTerms(node).slice(0, 3);
  if (!terms.length) return '';
  const phrase = terms[0];
  const context = {
    atmosphere: 'climate',
    oceans: 'ocean',
    cryosphere: 'glacier',
    biosphere: 'environment',
    agriculture: 'agriculture',
    energy: 'energy',
    digital: 'technology',
    economy: 'economy',
    sociopolitical: 'people',
    transport: 'transport'
  }[node.sphere] || 'climate';
  return `${phrase} ${context}`;
}

function nodeQueries(node) {
  const overrides = SEARCH_QUERY_OVERRIDES[node.id] || [];
  return [...new Set([...overrides, baseNodeQuery(node), relaxedNodeQuery(node)].filter(Boolean))]
    .map(query => query.includes('sourcelang:') ? query : `${query} sourcelang:english`);
}

function eventContext(node) {
  const reach = String(node.context?.reach || 'global');
  return `${reach.charAt(0).toUpperCase()}${reach.slice(1)} reporting`;
}

function eventId(nodeId, articleUrl) {
  return `${nodeId}-${createHash('sha256').update(articleUrl).digest('hex').slice(0, 12)}`;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchText(url, { attempts = MAX_FETCH_ATTEMPTS, timeoutMs = PROVIDER_TIMEOUT_MS } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'TULIP recent-major-events refresh/1.0 (+https://tulip-project-six.vercel.app/)' },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'follow'
      });
      if (response.ok) return response.text();
      lastError = new Error(`${response.status} ${response.statusText}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
      const retryAfter = Number.parseInt(response.headers.get('retry-after') || '', 10);
      await wait(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 3000);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(attempt * 2000);
    }
  }
  throw lastError;
}

async function fetchGdeltQuery(query) {
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('maxrecords', String(MAX_ARTICLES_PER_QUERY));
  url.searchParams.set('timespan', GDELT_TIMESPAN);
  url.searchParams.set('format', 'json');
  const body = await fetchText(url);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`GDELT rejected query "${query}": ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
}

async function fetchGdeltArticles(node) {
  const rawArticles = [];
  const queryErrors = [];
  for (const query of nodeQueries(node)) {
    try {
      const payload = await fetchGdeltQuery(query);
      rawArticles.push(...(Array.isArray(payload?.articles) ? payload.articles : []));
    } catch (error) {
      queryErrors.push(error.message);
      if (debug) console.error(`${node.id}: ${error.message}`);
    }
    const approvedCount = rawArticles.filter(article => publisherForDomain(article.domain)).length;
    if (approvedCount >= TARGET_APPROVED_ARTICLES) break;
    await wait(1200);
  }
  if (!rawArticles.length && queryErrors.length) throw new Error(queryErrors.join(' | '));
  const seenTitles = new Set();
  const seenUrls = new Set();
  const approved = rawArticles
    .filter(article => publisherForDomain(article.domain))
    .filter(article => {
      const key = String(article.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const url = String(article.url || '');
      if (!key || seenTitles.has(key) || seenUrls.has(url)) return false;
      seenTitles.add(key);
      seenUrls.add(url);
      return /^https:\/\//.test(url) && gdeltDate(article.seendate);
    });
  if (debug) {
    const domains = [...new Set(rawArticles.map(article => normalizeDomain(article.domain)))];
    console.error(`${node.id}: ${rawArticles.length} GDELT candidates; ${approved.length} from approved publishers.`);
    console.error(`${node.id}: candidate domains: ${domains.slice(0, 30).join(', ')}`);
    console.error(`${node.id}: approved candidates: ${approved.slice(0, 20).map(article => `${normalizeDomain(article.domain)} | ${article.title}`).join(' || ')}`);
  }
  return approved;
}

function xmlTag(item, tagName) {
  const match = String(item || '').match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return decodeHtml(match?.[1] || '');
}

function rssDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '';
  return parsed.toISOString().replace(/[-:]/g, '').replace('.000', '');
}

function directBingArticleUrl(value) {
  try {
    const rssUrl = new URL(decodeHtml(value));
    const direct = rssUrl.searchParams.get('url') || (rssUrl.hostname === 'www.bing.com' ? '' : rssUrl.href);
    if (!direct) return '';
    const articleUrl = new URL(direct);
    articleUrl.protocol = 'https:';
    return articleUrl.href;
  } catch {
    return '';
  }
}

async function fetchBingQuery(query) {
  const url = new URL(BING_NEWS_ENDPOINT);
  url.searchParams.set('q', query.replace(/\s*sourcelang:english\s*/gi, ' ').trim());
  url.searchParams.set('format', 'rss');
  url.searchParams.set('count', '50');
  const xml = await fetchText(url, { attempts: 2, timeoutMs: 15_000 });
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, item]) => {
    const articleUrl = directBingArticleUrl(xmlTag(item, 'link'));
    let domain = '';
    try {
      domain = normalizeDomain(new URL(articleUrl).hostname);
    } catch {
      // Invalid or non-direct RSS links are filtered below.
    }
    return {
      title: xmlTag(item, 'title'),
      url: articleUrl,
      domain,
      seendate: rssDate(xmlTag(item, 'pubDate')),
      relevanceText: xmlTag(item, 'description')
    };
  });
}

async function fetchBingArticles(node) {
  const rawArticles = [];
  const queryErrors = [];
  const ordinaryQueries = nodeQueries(node);
  const trustedStem = baseNodeQuery(node).replace(/\s*sourcelang:english\s*/gi, ' ').trim();
  const queries = [...ordinaryQueries, ...BING_TRUSTED_SITE_FILTERS.map(filter => `${trustedStem} ${filter}`)];
  for (const query of queries) {
    try {
      rawArticles.push(...await fetchBingQuery(query));
    } catch (error) {
      queryErrors.push(error.message);
      if (debug) console.error(`${node.id}: Bing RSS ${error.message}`);
    }
    if (rawArticles.filter(article => publisherForDomain(article.domain)).length >= TARGET_APPROVED_ARTICLES) break;
    await wait(500);
  }
  if (!rawArticles.length && queryErrors.length) throw new Error(queryErrors.join(' | '));
  const seenTitles = new Set();
  const seenUrls = new Set();
  const approved = rawArticles
    .filter(article => publisherForDomain(article.domain))
    .filter(article => {
      const key = String(article.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!key || !article.url || seenTitles.has(key) || seenUrls.has(article.url)) return false;
      seenTitles.add(key);
      seenUrls.add(article.url);
      return /^https:\/\//.test(article.url) && gdeltDate(article.seendate);
    });
  if (debug) console.error(`${node.id}: ${rawArticles.length} Bing candidates; ${approved.length} from approved publishers.`);
  return approved;
}

let gdeltOnline = true;

async function probeGdelt() {
  if (process.env.RECENT_EVENTS_DISCOVERY === 'bing') return false;
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set('query', 'climate sourcelang:english');
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('maxrecords', '1');
  url.searchParams.set('timespan', '1week');
  url.searchParams.set('format', 'json');
  try {
    await fetchText(url, { attempts: 1, timeoutMs: 8_000 });
    return true;
  } catch {
    return false;
  }
}

async function discoverArticles(node) {
  if (gdeltOnline) {
    try {
      const articles = await fetchGdeltArticles(node);
      if (articles.length) return articles;
    } catch (error) {
      if (debug) console.error(`${node.id}: GDELT discovery unavailable (${error.message}); trying Bing RSS.`);
    }
  }
  return fetchBingArticles(node);
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function hydrateArticle(node, article) {
  try {
    const html = await fetchText(article.url, { attempts: 1, timeoutMs: ARTICLE_TIMEOUT_MS });
    const materials = extractArticleMaterials(html, article.title);
    if (!articleMatchesNode(node, article, materials)) {
      if (debug) console.error(`${node.id}: rejected ${article.url}: article text does not match the node topic`);
      return null;
    }
    const date = extractPublishedDate(html, gdeltDate(article.seendate));
    if (!date || date < MINIMUM_RECENT_DATE || date > TODAY_DATE) {
      if (debug) console.error(`${node.id}: rejected ${article.url}: article date ${date || 'missing'} is outside ${MINIMUM_RECENT_DATE}–${TODAY_DATE}`);
      return null;
    }
    const publisher = publisherForDomain(article.domain);
    return {
      id: eventId(node.id, article.url),
      date,
      place: eventContext(node),
      title: decodeHtml(article.title),
      status: 'reported',
      summary: '',
      sources: [{ label: publisher, url: article.url }]
    };
  } catch (error) {
    if (debug) console.error(`${node.id}: rejected ${article.url}: ${error.message}`);
    return null;
  }
}

function validateSnapshot(snapshot, expectedNodeIds) {
  const problems = [];
  for (const nodeId of expectedNodeIds) {
    const profile = snapshot?.profiles?.[nodeId];
    const occurrences = profile?.occurrences;
    const profileKeys = Object.keys(profile || {}).sort();
    if (profileKeys.join(',') !== 'occurrences,profileKind,title,updatedAt') {
      problems.push(`${nodeId}: profile schema changed (${profileKeys.join(',') || 'missing'})`);
    }
    if (profile?.title !== 'Recent Major Events') problems.push(`${nodeId}: unexpected section title`);
    if (profile?.profileKind !== 'events') problems.push(`${nodeId}: unexpected profile kind`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile?.updatedAt || '')) problems.push(`${nodeId}: invalid updatedAt`);
    if (!Array.isArray(occurrences) || occurrences.length !== EVENTS_PER_NODE) {
      problems.push(`${nodeId}: expected ${EVENTS_PER_NODE} events`);
      continue;
    }
    for (const occurrence of occurrences) {
      const occurrenceKeys = Object.keys(occurrence || {}).sort();
      if (occurrenceKeys.join(',') !== 'date,id,place,sources,status,summary,title') {
        problems.push(`${nodeId}/${occurrence.id || 'unknown'}: event schema changed (${occurrenceKeys.join(',') || 'missing'})`);
      }
      if (typeof occurrence.id !== 'string' || !occurrence.id) problems.push(`${nodeId}: missing event id`);
      if (typeof occurrence.title !== 'string' || !occurrence.title.trim()) problems.push(`${nodeId}/${occurrence.id}: missing title`);
      if (typeof occurrence.place !== 'string' || !occurrence.place.trim()) problems.push(`${nodeId}/${occurrence.id}: missing place`);
      if (occurrence.status !== 'reported') problems.push(`${nodeId}/${occurrence.id}: unexpected status ${occurrence.status || 'missing'}`);
      if (occurrence.summary !== '') problems.push(`${nodeId}/${occurrence.id}: generated descriptions must remain empty`);
      if (occurrence.summary && LOW_INFORMATION_SUMMARY_PATTERN.test(occurrence.summary)) problems.push(`${nodeId}/${occurrence.id}: low-information summary`);
      if (!occurrence.date || occurrence.date < MINIMUM_RECENT_DATE || occurrence.date > TODAY_DATE) {
        problems.push(`${nodeId}/${occurrence.id}: date ${occurrence.date || 'missing'} is outside ${MINIMUM_RECENT_DATE}–${TODAY_DATE}`);
      }
      if (occurrence.relationship || occurrence.scale) problems.push(`${nodeId}/${occurrence.id}: obsolete tag field`);
      if (!occurrence.sources?.length) problems.push(`${nodeId}/${occurrence.id}: missing article source`);
      for (const source of occurrence.sources || []) {
        const sourceKeys = Object.keys(source || {}).sort();
        if (sourceKeys.join(',') !== 'label,url') problems.push(`${nodeId}/${occurrence.id}: source schema changed`);
        if (typeof source.label !== 'string' || !source.label.trim()) problems.push(`${nodeId}/${occurrence.id}: missing source label`);
        if (typeof source.url !== 'string' || !source.url.startsWith('https://')) {
          problems.push(`${nodeId}/${occurrence.id}: source URL must use HTTPS`);
          continue;
        }
        const domain = normalizeDomain(new URL(source.url).hostname);
        if (!publisherForDomain(domain)) problems.push(`${nodeId}/${occurrence.id}: unapproved source ${domain}`);
      }
    }
  }
  if (problems.length) throw new Error(`Recent-major-events validation failed:\n${problems.slice(0, 50).join('\n')}${problems.length > 50 ? `\n...and ${problems.length - 50} more` : ''}`);
}

async function refreshNode(node) {
  const seeds = (CURATED_EVENT_SEEDS[node.id] || []).map(article => ({ ...article, curated: true }));
  let discovered = [];
  try {
    discovered = await discoverArticles(node);
  } catch (error) {
    if (seeds.length < EVENTS_PER_NODE) throw error;
    console.warn(`${node.id}: provider discovery failed; validating ${seeds.length} curated article seeds (${error.message})`);
  }
  const seedUrls = new Set(seeds.map(article => article.url));
  const articleGroups = [seeds, discovered.filter(article => !seedUrls.has(article.url))];
  await wait(1000);
  const hydrated = [];
  for (const articles of articleGroups) {
    const groupHydrated = [];
    for (let index = 0; index < Math.min(articles.length, 48) && hydrated.length < EVENTS_PER_NODE; index += ARTICLE_CONCURRENCY) {
      const batch = articles.slice(index, index + ARTICLE_CONCURRENCY);
      groupHydrated.push(...(await mapWithConcurrency(batch, ARTICLE_CONCURRENCY, article => hydrateArticle(node, article))).filter(Boolean));
    }
    groupHydrated.sort((left, right) => right.date.localeCompare(left.date));
    hydrated.push(...groupHydrated.slice(0, EVENTS_PER_NODE - hydrated.length));
    if (hydrated.length >= EVENTS_PER_NODE) break;
  }
  hydrated.sort((left, right) => right.date.localeCompare(left.date));
  hydrated.splice(EVENTS_PER_NODE);
  if (hydrated.length !== EVENTS_PER_NODE) throw new Error(`${node.id}: found ${hydrated.length} approved article-backed events`);
  if (debug) console.error(`${node.id}: selected events: ${hydrated.map(event => `${event.date} | ${event.title}`).join(' || ')}`);
  else console.log(`${node.id}: validated ${hydrated.length} article-backed events`);
  return {
    title: 'Recent Major Events',
    updatedAt: new Date().toISOString().slice(0, 10),
    profileKind: 'events',
    occurrences: hydrated
  };
}

const selectedNodes = requestedNodeIds.size
  ? NODES.filter(node => requestedNodeIds.has(node.id))
  : Number.isFinite(maxNodes) && maxNodes > 0
    ? NODES.slice(nodeOffset, nodeOffset + maxNodes)
    : NODES;
if (requestedNodeIds.size && selectedNodes.length !== requestedNodeIds.size) {
  const found = new Set(selectedNodes.map(node => node.id));
  throw new Error(`Unknown node ids: ${[...requestedNodeIds].filter(nodeId => !found.has(nodeId)).join(', ')}`);
}
const smokeRun = selectedNodes.length !== NODES.length;
if (rewriteExistingSummaries) {
  const snapshot = JSON.parse(await readFile(OUTPUT_URL, 'utf8'));
  for (const node of NODES) {
    const occurrences = snapshot?.profiles?.[node.id]?.occurrences || [];
    for (const occurrence of occurrences) {
      occurrence.summary = '';
    }
  }
  snapshot.generated_at = new Date().toISOString();
  validateSnapshot(snapshot, NODES.map(node => node.id));
  await writeFile(OUTPUT_URL, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Rebuilt summaries for ${NODES.length} recent-major-event profiles.`);
} else if (checkOnly) {
  const snapshot = JSON.parse(await readFile(OUTPUT_URL, 'utf8'));
  validateSnapshot(snapshot, Object.keys(snapshot.profiles || {}));
  console.log(`Validated ${Object.keys(snapshot.profiles || {}).length} generated recent-major-event profiles.`);
} else {
  gdeltOnline = await probeGdelt();
  if (!gdeltOnline) console.warn('GDELT is unavailable; using Bing News RSS discovery for this refresh.');
  const previous = JSON.parse(await readFile(OUTPUT_URL, 'utf8'));
  const profiles = { ...(previous.profiles || {}) };
  const lastErrors = new Map();
  let pendingNodes = selectedNodes;
  for (let attempt = 1; attempt <= 3 && pendingNodes.length; attempt += 1) {
    if (attempt > 1) {
      console.warn(`Retrying ${pendingNodes.length} nodes after transient discovery or article-fetch misses (attempt ${attempt}/3).`);
      await wait(5000);
    }
    const roundConcurrency = attempt === 1 ? QUERY_CONCURRENCY : Math.min(2, QUERY_CONCURRENCY);
    const refreshed = await mapWithConcurrency(pendingNodes, roundConcurrency, async node => {
      try {
        return { node, profile: await refreshNode(node) };
      } catch (error) {
        const message = error.message.startsWith(`${node.id}:`) ? error.message : `${node.id}: ${error.message}`;
        console.error(message);
        return { node, error: message };
      }
    });
    pendingNodes = [];
    for (const result of refreshed) {
      if (result.profile) {
        profiles[result.node.id] = result.profile;
        lastErrors.delete(result.node.id);
      } else {
        pendingNodes.push(result.node);
        lastErrors.set(result.node.id, result.error);
      }
    }
  }
  const failures = pendingNodes.map(node => lastErrors.get(node.id));
  const snapshot = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    provider: gdeltOnline ? 'GDELT DOC 2.0 with Bing News RSS fallback' : 'Bing News RSS fallback (GDELT unavailable)',
    source_policy: 'Reputed article publishers only; government and dataset pages excluded.',
    profiles
  };
  if (failures.length) throw new Error(`Refresh did not complete:\n${failures.join('\n')}`);
  validateSnapshot(snapshot, writeSelected ? NODES.map(node => node.id) : selectedNodes.map(node => node.id));
  if (smokeRun && !writeSelected) {
    console.log(`Validated a ${selectedNodes.length}-node provider smoke test without changing the production snapshot.`);
  } else {
    await writeFile(OUTPUT_URL, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(`${writeSelected ? 'Updated' : 'Refreshed'} ${selectedNodes.length} recent-major-event profiles.`);
  }
}
