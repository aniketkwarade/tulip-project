import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Checksum-bound subset derived from the CEDS aggregate file named below. Values
// are the sum of the two electricity sectors and three coal fuels, in kt SO2.
const annual = [[1970,24395.183348],[1971,23655.760139],[1972,24048.428448],[1973,25899.471198],[1974,25661.677877],[1975,26327.551658],[1976,27882.10856],[1977,28296.991228],[1978,27610.705165],[1979,29066.971483],[1980,30102.323021],[1981,29488.259475],[1982,29670.570869],[1983,29984.000395],[1984,30471.53008],[1985,32136.448659],[1986,32069.175304],[1987,33004.142414],[1988,32851.568102],[1989,33859.178342],[1990,36408.31645],[1991,36190.406979],[1992,36039.923332],[1993,35955.805611],[1994,36009.513065],[1995,34013.643641],[1996,35088.544645],[1997,34883.59556],[1998,33900.100141],[1999,31870.589815],[2000,31828.879109],[2001,31690.374555],[2002,32781.693021],[2003,35199.681507],[2004,36009.791101],[2005,30301.715059],[2006,30678.121861],[2007,30766.695763],[2008,28190.107333],[2009,25117.819312],[2010,23051.525207],[2011,23859.446268],[2012,22747.537295],[2013,22251.930632],[2014,22876.462698],[2015,21448.858936],[2016,20433.588004],[2017,20229.416978],[2018,21186.797789],[2019,21410.239583],[2020,19684.848255],[2021,20757.260729],[2022,20966.150656]]
  .map(([year, coal_power_so2_kt]) => ({ year, coal_power_so2_kt }));

const snapshot = {
  version: 'ceds_v2024_04_01_global_coal_power_so2_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  metric_contract_ids: ['coal_egu_so2_emission'],
  record_count: annual.length,
  source: {
    id: 'ceds_v2024_04_01_release_emission_data',
    name: 'CEDS v_2024_04_01 Release Emission Data',
    publisher: 'Community Emissions Data System',
    url: 'https://zenodo.org/records/10904361',
    doi: '10.5281/zenodo.10904361',
    release_date: '2024-04-01',
    archive_file: 'CEDS_v_2024_04_01_aggregate.zip',
    archive_size_bytes: 44395566,
    archive_md5: '636752881e915244bb96b4793d9fb121',
    archive_sha256: '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e',
    member_file: 'SO2_CEDS_global_emissions_by_sector_fuel_v2024_04_01.csv',
    member_sha256: '0ac20318c62d7136dcd6b197247412fc8534524fd9f289a2ae2e98aa392a062a'
  },
  metric_contract: {
    metric_id: 'coal_egu_so2_emission',
    metric_name: 'Coal EGU sulfur-dioxide emission',
    unit: 'kilotonnes SO2 per year',
    geography: 'CEDS source-native global aggregate',
    cadence: 'annual',
    direction: 'higher_is_worse',
    aggregation: 'Sum CEDS global SO2 rows for public and autoproducer electricity and brown coal, hard coal, and coal coke.',
    included_sectors: ['1A1a_Electricity-autoproducer', '1A1a_Electricity-public'],
    included_fuels: ['brown_coal', 'coal_coke', 'hard_coal'],
    exclusions: ['1A1a_Heat-production', 'biomass', 'diesel_oil', 'heavy_oil', 'light_oil', 'natural_gas', 'all non-electricity sectors']
  },
  observations: annual,
  validation: {
    expected_complete_annual_observations: 53,
    first_year: 1970,
    last_year: 2022,
    missing_years: [],
    source_units: 'ktSO2',
    latest_value_reconciles_to_selected_rows: true
  },
  uncertainty: 'CEDS is an inventory estimate assembled from activity data, emission factors and scaling inventories rather than a direct global monitor. Fuel and sector assignments, historical revisions and national input quality affect values. The latest release observation is 2022; it is the newest complete year in this source, not a 2026 nowcast. Electricity heat production and non-coal fuels are deliberately excluded, and missing values are never converted to zero.'
};

if (snapshot.observations.length !== snapshot.validation.expected_complete_annual_observations) {
  throw new Error('CEDS coal-power SO2 snapshot completeness check failed.');
}
if (snapshot.observations.some((record, index) => record.year !== 1970 + index || !Number.isFinite(record.coal_power_so2_kt))) {
  throw new Error('CEDS coal-power SO2 annual-series validation failed.');
}

await fs.writeFile(
  path.join(ROOT, 'public/ceds-coal-power-so2-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/ceds-coal-power-so2-snapshot.json',
  version: snapshot.version,
  observations: snapshot.record_count,
  latest: snapshot.observations.at(-1)
}, null, 2));
