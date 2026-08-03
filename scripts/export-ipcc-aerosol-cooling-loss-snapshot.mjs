import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/ipcc-aerosol-cooling-loss-snapshot.json');
const annualSeries = [
  { year: 1990, aerosol_erf_w_m2: -1.4292851950282623, erfari_w_m2: -0.37521230446272225, erfaci_w_m2: -1.05407289056554 },
  { year: 1991, aerosol_erf_w_m2: -1.524401905143926, erfari_w_m2: -0.3918171876401975, erfaci_w_m2: -1.1325847175037285 },
  { year: 1992, aerosol_erf_w_m2: -1.3605511867035625, erfari_w_m2: -0.35386282593319407, erfaci_w_m2: -1.0066883607703685 },
  { year: 1993, aerosol_erf_w_m2: -1.3658161610745219, erfari_w_m2: -0.3496858016741685, erfaci_w_m2: -1.0161303594003532 },
  { year: 1994, aerosol_erf_w_m2: -1.4225481533357816, erfari_w_m2: -0.3555214346385065, erfaci_w_m2: -1.067026718697275 },
  { year: 1995, aerosol_erf_w_m2: -1.3411205655272633, erfari_w_m2: -0.3281360671471326, erfaci_w_m2: -1.0129844983801308 },
  { year: 1996, aerosol_erf_w_m2: -1.3033979880525488, erfari_w_m2: -0.31904164798324286, erfaci_w_m2: -0.984356340069306 },
  { year: 1997, aerosol_erf_w_m2: -1.4601899347499434, erfari_w_m2: -0.3565921210286446, erfaci_w_m2: -1.1035978137212987 },
  { year: 1998, aerosol_erf_w_m2: -1.423464966846149, erfari_w_m2: -0.33889070126160925, erfaci_w_m2: -1.0845742655845396 },
  { year: 1999, aerosol_erf_w_m2: -1.2629984073327445, erfari_w_m2: -0.3033058329388054, erfaci_w_m2: -0.959692574393939 },
  { year: 2000, aerosol_erf_w_m2: -1.2211888949190368, erfari_w_m2: -0.3010886608239266, erfaci_w_m2: -0.9201002340951103 },
  { year: 2001, aerosol_erf_w_m2: -1.2205552280689047, erfari_w_m2: -0.2981516782853386, erfaci_w_m2: -0.922403549783566 },
  { year: 2002, aerosol_erf_w_m2: -1.312410305810868, erfari_w_m2: -0.31674794347172375, erfaci_w_m2: -0.9956623623391444 },
  { year: 2003, aerosol_erf_w_m2: -1.3559290546417933, erfari_w_m2: -0.33265356742982694, erfaci_w_m2: -1.0232754872119663 },
  { year: 2004, aerosol_erf_w_m2: -1.3572680823663215, erfari_w_m2: -0.3293844326569752, erfaci_w_m2: -1.0278836497093462 },
  { year: 2005, aerosol_erf_w_m2: -1.3978423375020848, erfari_w_m2: -0.34076152179201685, erfaci_w_m2: -1.057080815710068 },
  { year: 2006, aerosol_erf_w_m2: -1.4362716923802243, erfari_w_m2: -0.3588298615890487, erfaci_w_m2: -1.0774418307911757 },
  { year: 2007, aerosol_erf_w_m2: -1.3943217428845425, erfari_w_m2: -0.3354178035624007, erfaci_w_m2: -1.0589039393221418 },
  { year: 2008, aerosol_erf_w_m2: -1.3395735473921864, erfari_w_m2: -0.3215570218501339, erfaci_w_m2: -1.0180165255420524 },
  { year: 2009, aerosol_erf_w_m2: -1.2655737964553289, erfari_w_m2: -0.2923461121343693, erfaci_w_m2: -0.9732276843209596 },
  { year: 2010, aerosol_erf_w_m2: -1.265505475768164, erfari_w_m2: -0.2738984136348954, erfaci_w_m2: -0.9916070621332688 },
  { year: 2011, aerosol_erf_w_m2: -1.246356168330872, erfari_w_m2: -0.28026948968789756, erfaci_w_m2: -0.9660866786429744 },
  { year: 2012, aerosol_erf_w_m2: -1.2743378845939435, erfari_w_m2: -0.28265776456650377, erfaci_w_m2: -0.9916801200274398 },
  { year: 2013, aerosol_erf_w_m2: -1.1869263563878336, erfari_w_m2: -0.2595969544181066, erfaci_w_m2: -0.9273294019697269 },
  { year: 2014, aerosol_erf_w_m2: -1.1932909983048214, erfari_w_m2: -0.25466505676462703, erfaci_w_m2: -0.9386259415401944 },
  { year: 2015, aerosol_erf_w_m2: -1.1174501020233967, erfari_w_m2: -0.2285099881228313, erfaci_w_m2: -0.8889401139005655 },
  { year: 2016, aerosol_erf_w_m2: -1.0872511332826769, erfari_w_m2: -0.2197975524025137, erfaci_w_m2: -0.8674535808801631 },
  { year: 2017, aerosol_erf_w_m2: -1.0628171753299587, erfari_w_m2: -0.21197753506442624, erfaci_w_m2: -0.8508396402655325 },
  { year: 2018, aerosol_erf_w_m2: -1.0655076463940742, erfari_w_m2: -0.21553991360444297, erfaci_w_m2: -0.8499677327896312 },
  { year: 2019, aerosol_erf_w_m2: -1.058340266771186, erfari_w_m2: -0.21556193839611998, erfaci_w_m2: -0.8427783283750662 }
];

const snapshot = {
  version: 'ipcc_ar6_aerosol_cooling_loss_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'ipcc_ar6_global_aerosol_erf_time_series',
    name: 'IPCC AR6 WGI global effective radiative forcing time series',
    publisher: 'Intergovernmental Panel on Climate Change',
    report_url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
    data_url: 'https://raw.githubusercontent.com/chrisroadmap/ar6/refs/heads/main/data_output/AR6_ERF_1750-2019.csv',
    data_repository: 'https://github.com/chrisroadmap/ar6',
    repository_doi: '10.5281/zenodo.5211357',
    source_file_sha256: '420e5b0bb96d6b19eed6bf1f1e890bf6f9e8548f29b6600c628c80a7e66ed63e'
  },
  ingestion_job_id: 'export_ipcc_aerosol_cooling_loss_snapshot',
  metric_contract_ids: ['anthropogenic_aerosol_effective_radiative_forcing'],
  contract_bindings: [{ node_id: 'aerosol_cooling_loss', metric_id: 'anthropogenic_aerosol_effective_radiative_forcing', measurement_role: 'global_annual_assessment_constrained_aerosol_erf_cooling_loss' }],
  cadence: 'IPCC physical-science assessment release review.',
  provenance: 'The retained 1990-2019 values are exact rows and columns from the AR6 Chapter 7 authors’ published 1750-2019 best-estimate forcing CSV. Total aerosol ERF is the source aerosol column and equals aerosol-radiation plus aerosol-cloud interactions. The full source file has 270 annual rows; this scoring snapshot retains the 30-year interval needed to establish the assessed 1991 maximum cooling and 20 prior decadal-momentum windows.',
  uncertainty: 'Aerosol forcing is assessment-constrained rather than directly observed, with especially large aerosol-cloud uncertainty. IPCC assesses total aerosol ERF in 2019 as -1.1 [-1.7, -0.4] W m-2 and has low confidence in the magnitude of post-2014 change because lines of evidence conflict. The annual best-estimate series must not be interpreted as uncertainty-free observations.',
  failure_behavior: 'Retain the checksum-validated series and mark stale. Reject changed columns, units, years or checksum. Never substitute emissions, aerosol optical depth, projections or regional trends for global total aerosol ERF; never turn uncertainty bounds into annual observations or fill missing years with zero.',
  assessment: {
    baseline_year: 1750,
    source_start_year: 1750,
    source_end_year: 2019,
    source_complete_annual_observations: 270,
    retained_start_year: 1990,
    retained_end_year: 2019,
    retained_complete_annual_observations: annualSeries.length,
    assessed_maximum_cooling_year: 1991,
    assessed_maximum_cooling_erf_w_m2: -1.524401905143926,
    latest_year: 2019,
    latest_total_aerosol_erf_w_m2: -1.058340266771186,
    latest_ipcc_assessed_range_w_m2: [-1.7, -0.4],
    latest_ipcc_rounded_best_estimate_w_m2: -1.1,
    geographic_scope: 'Global mean effective radiative forcing',
    global_extent_normalized: 1,
    values: annualSeries
  },
  excluded_from_scoring: ['future forcing scenarios', 'regional aerosol trends', 'SO2 emissions as a proxy for total aerosol forcing', 'source-count or evidence-volume multipliers', 'missing observations as zero']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, retained_annual_observations: annualSeries.length, latest_year: annualSeries.at(-1).year }, null, 2));
