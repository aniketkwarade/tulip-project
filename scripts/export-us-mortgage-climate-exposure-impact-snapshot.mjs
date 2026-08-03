import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'fhfa_hurricane_mortgage_exposure_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'fhfa_helene_milton_mortgage_exposure_2024',
      name: 'Estimating the Impact of Hurricanes Helene and Milton on Single-Family Mortgages',
      publisher: 'U.S. Federal Housing Finance Agency',
      url: 'https://www.fhfa.gov/blog/insights/estimating-the-impact-of-hurricanes-helene-and-milton-on-single-family-mortgages'
    },
    {
      id: 'fhfa_hurricane_mortgage_performance_2024',
      name: 'How Does Mortgage Performance Vary Across Borrower Demographics Following a Hurricane?',
      publisher: 'U.S. Federal Housing Finance Agency',
      url: 'https://www.fhfa.gov/research/papers/wp2409',
      report_url: 'https://www.fhfa.gov/sites/default/files/2024-11/wp2409.pdf'
    }
  ],
  assessment: {
    event_exposure: {
      events: ['Hurricane Helene', 'Hurricane Milton'],
      portfolio_as_of: '2024-09',
      hazard_boundary: 'Counties eligible for FEMA Individual Assistance following Hurricanes Helene and Milton',
      enterprise_backed_single_family_loan_count: 2641253,
      unpaid_principal_balance_millions_usd: 526388,
      mean_unpaid_principal_balance_usd: 199295,
      loans_in_special_flood_hazard_areas_at_origination_pct: 5.15,
      loans_60_plus_days_delinquent_before_events_pct: 0.88,
      scoring_boundary: 'The unpaid principal balance is mortgage exposure in disaster-affected counties, not an estimate of realized credit loss.'
    },
    observed_outcome_persistence: {
      hurricane_event_count: 28,
      post_event_observation_months: 12,
      average_90_day_delinquency_increase_percentage_points: 0.025,
      additional_90_day_delinquency_increase_per_inch_rain_percentage_points: 0.013,
      delinquencies_modifications_and_foreclosures_increased: true,
      scoring_boundary: 'The working-paper estimates establish persistence and realized loan-performance effects across a separate multi-storm sample; they are not applied as a loss rate to the Helene/Milton balance.'
    },
    geographic_extent: {
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1,
      scoring_boundary: 'Both FHFA analyses are limited to United States Enterprise-backed mortgages and are not extrapolated to other mortgage markets.'
    }
  },
  uncertainty: 'The Helene/Milton estimates include active Fannie Mae and Freddie Mac single-family portfolio loans in FEMA Individual Assistance counties, not property-level damage determinations. Only a small portion of unpaid principal may become loss. Special Flood Hazard Area status is measured at origination and does not represent all voluntary flood-insurance coverage. The 28-storm working paper reports average associations across its sample and should not be mechanically applied to the event-specific balance. Both sources cover one country.'
};

await fs.writeFile(
  path.join(ROOT, 'public/us-mortgage-climate-exposure-impact-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/us-mortgage-climate-exposure-impact-snapshot.json',
  version: snapshot.version,
  source_count: snapshot.sources.length
}, null, 2));
