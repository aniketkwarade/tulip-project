import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const firstMonitoringYear = 2003;
const latestMonitoringYear = 2020;
const snapshot = {
  version: 'china_acid_deposition_2003_2020_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'china_mee_ecology_environment_report_2020_acid_rain',
      name: 'Report on the State of the Ecology and Environment in China 2020',
      publisher: 'Ministry of Ecology and Environment of the People’s Republic of China',
      publication_date: '2021',
      url: 'https://english.mee.gov.cn/Resources/Reports/soe/SOEE2019/202204/P020220407417638702591.pdf',
      source_locators: [
        'Across 465 cities, districts or counties monitoring precipitation, mean acid-rain frequency was 10.3% in 2020.',
        'The official thresholds are annual precipitation pH below 5.6 for acid rain, below 5.0 for relatively serious acid rain and below 4.5 for serious acid rain.',
        'The acid-rain area was approximately 466,000 square kilometres, or 4.8% of China’s land area, 0.2 percentage point below 2019.'
      ]
    },
    {
      id: 'zhang_china_acid_deposition_material_loss_2017',
      name: 'Estimates of Economic Loss of Materials Caused by Acid Deposition in China',
      publisher: 'Sustainability',
      publication_date: '2017-03-24',
      url: 'https://doi.org/10.3390/su9040488',
      source_locators: [
        'The assessment uses annual precipitation pH and ambient SO2 from the China National Environmental Monitoring Network for 338 municipalities and prefecture-level cities and 1,436 air-quality stations.',
        'Dose-response functions, material exposure inventories and maintenance or replacement prices produce an estimated RMB 32.165 billion in acid-deposition material loss for 2013.',
        'The estimate equals 0.057% of GDP and 3.4% of national environmental-pollution-control investment in 2013; it is a modeled loss rather than audited expenditure.'
      ]
    },
    {
      id: 'china_mee_environment_quality_2003_acid_rain',
      name: 'China Environmental Quality Status 2003 — Acid Rain',
      publisher: 'Ministry of Ecology and Environment of the People’s Republic of China',
      publication_date: '2004',
      url: 'https://www.mee.gov.cn/gkml/sthjbgw/qt/200910/t20091023_179782.htm',
      source_locators: [
        'The 2003 national bulletin reports acid-rain monitoring across 487 cities and counties.',
        'Acid rain occurred in 265 monitored jurisdictions, while 182 had annual mean precipitation pH at or below 5.6.',
        'The bulletin provides the first year used in this receipt’s documented national monitoring span; the span is not interpreted as continuous station-level completeness.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'acid_rain_deposition',
    metric_id: 'acidic_wet_dry_deposition',
    unit: 'precipitation pH threshold frequency, affected area, monitoring duration and modeled material loss',
    geography: 'national precipitation-monitoring and city-level material assessment boundary for China',
    assessment_period: 'official national monitoring evidence from 2003–2020 with a 2013 material-loss assessment',
    boundary: 'Wet-deposition acidity and the study’s SO2-supported material damage model are retained separately. The receipt does not treat precursor emissions as deposition, convert modeled loss to realized cash expenditure, or generalize China to the globe.'
  },
  accumulated_impact: {
    latest_mean_acid_rain_frequency_percent: 10.3,
    latest_monitored_cities_districts_counties: 465,
    latest_acid_rain_area_square_kilometres: 466000,
    latest_acid_rain_area_share_percent: 4.8,
    latest_year_over_year_area_change_percentage_points: -0.2,
    modeled_material_loss_rmb_billions_2013: 32.165,
    modeled_material_loss_gdp_share_percent_2013: 0.057,
    modeled_material_loss_pollution_control_investment_share_percent_2013: 3.4,
    material_loss_assessment_cities: 338,
    material_loss_assessment_air_quality_stations: 1436,
    first_documented_national_monitoring_year: firstMonitoringYear,
    latest_documented_national_monitoring_year: latestMonitoringYear,
    documented_monitoring_span_years_derived: latestMonitoringYear - firstMonitoringYear
  },
  reviewed_normalization_anchors: {
    acid_rain_frequency_percent: [0, 5, 25, 75],
    modeled_material_loss_rmb_billions: [0, 1, 10, 50],
    documented_monitoring_span_years: [0, 1, 10, 30],
    affected_land_area_share_percent: [0, 1, 5, 20]
  },
  uncertainty: 'The 2013 monetary burden is a study estimate derived from precipitation pH, SO2, exposure-response functions, per-capita material inventories and maintenance or replacement prices; it is not an audited realized expenditure, and the authors identify limited city-level inventory cases and price uncertainty. The 2003 and 2020 bulletins document national monitoring in both endpoint years but do not prove a complete, unchanged station panel across all intervening years. China’s acid-rain area and severe-city shares improved substantially by 2020, and the receipt does not imply worsening momentum or global extent.'
};

await fs.writeFile(path.join(ROOT, 'public/china-acid-deposition-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/china-acid-deposition-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
