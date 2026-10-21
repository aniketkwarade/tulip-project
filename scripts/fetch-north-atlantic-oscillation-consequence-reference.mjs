import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'north-atlantic-oscillation-consequence-reference-snapshot.json');
const doi = '10.1029/2019GL081956';
const articleUrl = `https://doi.org/${doi}`;
const crossrefUrl = `https://api.crossref.org/works/${doi}`;
const independentDoi = '10.1029/2019EF001450';
const independentArticleUrl = `https://doi.org/${independentDoi}`;
const independentCrossrefUrl = `https://api.crossref.org/works/${independentDoi}`;
const independentPdfUrl = 'https://re.public.polimi.it/retrieve/e0c31c0f-7266-4599-e053-1705fe0aef77/Nobre2020_oscillations.pdf';
const hanzeRecordUrl = 'https://zenodo.org/records/8410025';
const hanzeApiUrl = 'https://zenodo.org/api/records/8410025';
const hanzeEventsUrl = 'https://zenodo.org/api/records/8410025/files/HANZE_events.csv/content';
const noaaNaoUrl = 'https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.nao.cdas.z500.19500101_current.csv';
const osfViewToken = '761c589ff3a94f47aa6c0459b9e7d373';
const osfProjectId = 'rauem';
const osfProjectUrl = `https://api.osf.io/v2/nodes/${osfProjectId}/?view_only=${osfViewToken}`;
const osfFilesUrl = `https://api.osf.io/v2/nodes/${osfProjectId}/files/osfstorage/?view_only=${osfViewToken}&page%5Bsize%5D=100`;

const sha256 = value => createHash('sha256').update(value).digest('hex');
const fetchBuffer = async url => {
  const response = await fetch(url, {
    headers: {
      accept: '*/*',
      'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
};
const fetchJson = async url => JSON.parse((await fetchBuffer(url)).toString('utf8'));
const stripMarkup = value => String(value ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#x2010;|&#x2011;|&#x2012;|&#x2013;|&#x2014;/gi, '–')
  .replace(/&#x2018;|&#x2019;/gi, '’')
  .replace(/&#x201c;|&#x201d;/gi, '“')
  .replace(/\s+/g, ' ')
  .trim();

const parseCsv = (buffer, encoding = 'latin1') => {
  const input = buffer.toString(encoding).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some(value => value.length)) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...values] = rows;
  return values.map(cells => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
};

const EUROPEAN_SUBREGIONS = new Map(Object.entries({
  Albania: 'Southern', Andorra: 'Southern', 'Bosnia and Herzegovina': 'Southern', Croatia: 'Southern', Cyprus: 'Southern', Greece: 'Southern', Italy: 'Southern', Kosovo: 'Southern', Malta: 'Southern', Montenegro: 'Southern', 'North Macedonia': 'Southern', Portugal: 'Southern', 'San Marino': 'Southern', Serbia: 'Southern', Slovenia: 'Southern', Spain: 'Southern',
  Austria: 'Western', Belgium: 'Western', France: 'Western', Germany: 'Western', Liechtenstein: 'Western', Luxembourg: 'Western', Monaco: 'Western', Netherlands: 'Western', Switzerland: 'Western',
  Belarus: 'Eastern', Bulgaria: 'Eastern', Czechia: 'Eastern', Hungary: 'Eastern', Moldova: 'Eastern', Poland: 'Eastern', Romania: 'Eastern', Russia: 'Eastern', Slovakia: 'Eastern', Ukraine: 'Eastern',
  Denmark: 'Northern', Estonia: 'Northern', Finland: 'Northern', Iceland: 'Northern', Ireland: 'Northern', 'Isle of Man': 'Northern', Latvia: 'Northern', Lithuania: 'Northern', Norway: 'Northern', Sweden: 'Northern', 'United Kingdom': 'Northern',
}));
const REGIONS = ['Northern', 'Southern', 'Eastern', 'Western'];
const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const seasonKey = (year, month) => {
  if (month === 12) return { year: year + 1, season: 'winter' };
  if (month <= 2) return { year, season: 'winter' };
  if (month <= 5) return { year, season: 'spring' };
  if (month <= 8) return { year, season: 'summer' };
  return { year, season: 'autumn' };
};
const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const quantile = (values, probability) => {
  const sorted = [...values].sort((left, right) => left - right);
  assert(sorted.length, 'Cannot calculate a quantile of an empty array');
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};
const sigmoid = value => 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, value))));
const solve2 = (a, b, c, d, e, f) => {
  const determinant = a * d - b * c;
  assert(Math.abs(determinant) > 1e-16, 'Singular two-parameter logistic system');
  return [(e * d - b * f) / determinant, (a * f - e * c) / determinant];
};
const fitLogistic = (predictors, outcomes) => {
  let intercept = 0;
  let coefficient = 0;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    let gradient0 = 0;
    let gradient1 = 0;
    let h00 = 1e-8;
    let h01 = 0;
    let h11 = 1e-8;
    for (let index = 0; index < outcomes.length; index += 1) {
      const predictor = predictors[index];
      const probability = sigmoid(intercept + coefficient * predictor);
      const weight = Math.max(1e-8, probability * (1 - probability));
      const residual = outcomes[index] - probability;
      gradient0 += residual;
      gradient1 += predictor * residual;
      h00 += weight;
      h01 += weight * predictor;
      h11 += weight * predictor * predictor;
    }
    const [step0, step1] = solve2(h00, h01, h01, h11, gradient0, gradient1);
    intercept += step0;
    coefficient += step1;
    if (Math.max(Math.abs(step0), Math.abs(step1)) < 1e-9) break;
  }
  return { intercept, coefficient };
};
const logLikelihood = (predictors, outcomes, model) => outcomes.reduce((sum, outcome, index) => {
  const probability = Math.max(1e-12, Math.min(1 - 1e-12, sigmoid(model.intercept + model.coefficient * predictors[index])));
  return sum + outcome * Math.log(probability) + (1 - outcome) * Math.log(1 - probability);
}, 0);
const erfc = value => {
  const z = Math.abs(value);
  const t = 1 / (1 + z / 2);
  const result = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return value >= 0 ? result : 2 - result;
};
const auc = (outcomes, probabilities) => {
  const positives = outcomes.flatMap((outcome, index) => outcome === 1 ? [index] : []);
  const negatives = outcomes.flatMap((outcome, index) => outcome === 0 ? [index] : []);
  if (!positives.length || !negatives.length) return null;
  let wins = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      if (probabilities[positive] > probabilities[negative]) wins += 1;
      else if (probabilities[positive] === probabilities[negative]) wins += 0.5;
    }
  }
  return wins / (positives.length * negatives.length);
};
const evaluateLogistic = (predictors, outcomes) => {
  const positiveCount = outcomes.reduce((sum, value) => sum + value, 0);
  if (positiveCount < 3 || outcomes.length - positiveCount < 3) return null;
  const model = fitLogistic(predictors, outcomes);
  const alternative = logLikelihood(predictors, outcomes, model);
  const nullProbability = positiveCount / outcomes.length;
  const baseline = outcomes.reduce((sum, outcome) => sum + outcome * Math.log(nullProbability) + (1 - outcome) * Math.log(1 - nullProbability), 0);
  const likelihoodRatio = Math.max(0, 2 * (alternative - baseline));
  const leaveOneOut = outcomes.map((_, heldOut) => {
    const retainedPredictors = predictors.filter((__, index) => index !== heldOut);
    const retainedOutcomes = outcomes.filter((__, index) => index !== heldOut);
    const fitted = fitLogistic(retainedPredictors, retainedOutcomes);
    return sigmoid(fitted.intercept + fitted.coefficient * predictors[heldOut]);
  });
  return {
    coefficient: model.coefficient,
    direction: model.coefficient >= 0 ? 'positive_nao_increases_probability' : 'negative_nao_increases_probability',
    pValue: erfc(Math.sqrt(likelihoodRatio / 2)),
    leaveOneOutAuc: auc(outcomes, leaveOneOut),
    positiveSeasons: positiveCount,
    seasons: outcomes.length,
  };
};
const addBenjaminiHochberg = models => {
  const ordered = models.map((model, index) => ({ model, index })).sort((left, right) => left.model.pValue - right.model.pValue);
  const qValues = Array(models.length).fill(1);
  let previous = 1;
  for (let rank = ordered.length; rank >= 1; rank -= 1) {
    const { model, index } = ordered[rank - 1];
    previous = Math.min(previous, model.pValue * ordered.length / rank);
    qValues[index] = previous;
  }
  return models.map((model, index) => ({ ...model, falseDiscoveryRate: qValues[index] }));
};
const round = (value, digits = 6) => Number(value.toFixed(digits));
const buildOpenLossStressTest = (hanzeRows, dailyNaoRows, endYear) => {
  const startYear = 1980;
  const naoBySeason = new Map();
  for (const row of dailyNaoRows) {
    const year = Number(row.year);
    const month = Number(row.month);
    const value = Number(row.nao_index_cdas);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(value)) continue;
    const key = seasonKey(year, month);
    if (key.year < startYear || key.year > endYear) continue;
    const id = `${key.year}:${key.season}`;
    if (!naoBySeason.has(id)) naoBySeason.set(id, []);
    naoBySeason.get(id).push(value);
  }
  const seasonalNao = new Map([...naoBySeason].map(([key, values]) => [key, mean(values)]));
  const losses = new Map();
  for (const row of hanzeRows) {
    const eventYear = Number(row.Year);
    if (eventYear < startYear || eventYear > endYear) continue;
    const region = EUROPEAN_SUBREGIONS.get(row['Country name']);
    assert(region, `Unmapped HANZE country: ${row['Country name']}`);
    const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(row['Start date']);
    assert(date, `Invalid HANZE event date: ${row['Start date']}`);
    const key = seasonKey(Number(date[1]), Number(date[2]));
    if (key.year < startYear || key.year > endYear) continue;
    const id = `${region}:${key.year}:${key.season}`;
    const loss = finiteNumber(row['Losses (2020 euro)']);
    losses.set(id, (losses.get(id) ?? 0) + (loss ?? 0));
  }
  const cells = [];
  for (const region of REGIONS) {
    for (let year = startYear; year <= endYear; year += 1) {
      for (const season of SEASONS) {
        const nao = seasonalNao.get(`${year}:${season}`);
        assert(Number.isFinite(nao), `Missing NOAA NAO average for ${year} ${season}`);
        cells.push({ region, year, season, nao, loss: losses.get(`${region}:${year}:${season}`) ?? 0 });
      }
    }
  }
  const positiveLosses = cells.filter(cell => cell.loss > 0).map(cell => cell.loss);
  const thresholds = {
    low2020Euro: quantile(positiveLosses, 0.33),
    medium2020Euro: quantile(positiveLosses, 0.5),
    high2020Euro: quantile(positiveLosses, 0.66),
  };
  const classes = [
    ['damaging', 0],
    ['low', thresholds.low2020Euro],
    ['medium', thresholds.medium2020Euro],
    ['high', thresholds.high2020Euro],
  ];
  const models = classes.flatMap(([lossClass, threshold]) => REGIONS.flatMap(region => SEASONS.map(season => {
    const stratum = cells.filter(cell => cell.region === region && cell.season === season).sort((left, right) => left.year - right.year);
    const evaluated = evaluateLogistic(stratum.map(cell => cell.nao), stratum.map(cell => Number(cell.loss > threshold)));
    return evaluated ? { lossClass, threshold2020Euro: threshold, region, season, ...evaluated } : null;
  }).filter(Boolean)));
  const summarized = Object.fromEntries(classes.map(([lossClass]) => {
    const withQ = addBenjaminiHochberg(models.filter(model => model.lossClass === lossClass));
    const raw = withQ.filter(model => model.pValue <= 0.1 && model.leaveOneOutAuc > 0.5);
    const robust = withQ.filter(model => model.falseDiscoveryRate <= 0.1 && model.leaveOneOutAuc > 0.5);
    const clean = model => ({
      region: model.region,
      season: model.season,
      direction: model.direction,
      coefficient: round(model.coefficient),
      pValue: round(model.pValue),
      falseDiscoveryRate: round(model.falseDiscoveryRate),
      leaveOneOutAuc: round(model.leaveOneOutAuc),
      positiveSeasons: model.positiveSeasons,
      seasons: model.seasons,
    });
    return [lossClass, {
      unadjustedSkillfulModelCount: raw.length,
      falseDiscoveryControlledModelCount: robust.length,
      falseDiscoveryControlledModels: robust.map(clean),
    }];
  }));
  return {
    startYear,
    endYear,
    years: endYear - startYear + 1,
    regionSeasonStrata: REGIONS.length * SEASONS.length,
    seasonalCells: cells.length,
    positiveLossCells: positiveLosses.length,
    thresholds2020Euro: Object.fromEntries(Object.entries(thresholds).map(([key, value]) => [key, round(value, 2)])),
    classes: summarized,
  };
};

const [crossref, independentCrossref, project, fileListing, independentPdf, hanzeMetadata, hanzeEventsBytes, dailyNaoBytes] = await Promise.all([
  fetchJson(crossrefUrl),
  fetchJson(independentCrossrefUrl),
  fetchJson(osfProjectUrl),
  fetchJson(osfFilesUrl),
  fetchBuffer(independentPdfUrl),
  fetchJson(hanzeApiUrl),
  fetchBuffer(hanzeEventsUrl),
  fetchBuffer(noaaNaoUrl),
]);
const article = crossref.message;
const articleAbstract = stripMarkup(article.abstract);
const articleDateParts = article.published?.['date-parts']?.[0] ?? [];
const articlePublicationDate = articleDateParts.length
  ? articleDateParts.map((part, index) => index === 0 ? String(part) : String(part).padStart(2, '0')).join('-')
  : '2019';
assert.equal(article.DOI.toLowerCase(), doi.toLowerCase());
assert.equal(article.title[0], 'Modulation of Economic Losses From European Floods by the North Atlantic Oscillation');
assert.match(articleAbstract, /average flood loss during opposite NAO states can differ by up to 50%/i);
assert.equal(project.data.attributes.title, 'NAO and European floods');
const independentArticle = independentCrossref.message;
assert.equal(independentArticle.DOI.toLowerCase(), independentDoi.toLowerCase());
assert.equal(independentArticle.title[0], 'What Will the Weather Do? Forecasting Flood Losses Based on Oscillation Indices');
assert.equal(sha256(independentPdf), '3fa486e3b5abf94f70dc1becb2995bc0d3d24e56495983408f96ad54fe268246');
const hanzeFile = hanzeMetadata.files.find(file => file.key === 'HANZE_events.csv');
assert(hanzeFile, 'HANZE_events.csv is missing from the Zenodo record');
assert.equal(hanzeFile.checksum, 'md5:369bcff3d1f97624db2b444e44d45217');
assert.equal(createHash('md5').update(hanzeEventsBytes).digest('hex'), '369bcff3d1f97624db2b444e44d45217');
const hanzeEvents = parseCsv(hanzeEventsBytes, 'utf8');
const dailyNao = parseCsv(dailyNaoBytes, 'utf8');
assert.equal(hanzeEvents.length, 2_521);
assert(dailyNao.length > 28_000);
const currentHanzeEvents = hanzeEvents.filter(row => Number(row.Year) >= 1980 && Number(row.Year) <= 2020);
assert.equal(currentHanzeEvents.length, 1_412);
const reportedLossEvents = currentHanzeEvents.filter(row => finiteNumber(row['Losses (2020 euro)']) !== null).length;
assert.equal(reportedLossEvents, 727);
const openStressTests = {
  matchedPublicationWindow: buildOpenLossStressTest(hanzeEvents, dailyNao, 2016),
  fullHanzeWindow: buildOpenLossStressTest(hanzeEvents, dailyNao, 2020),
};
assert.equal(openStressTests.fullHanzeWindow.classes.damaging.falseDiscoveryControlledModelCount, 3);
assert.equal(openStressTests.fullHanzeWindow.classes.low.falseDiscoveryControlledModelCount, 0);
assert.equal(openStressTests.fullHanzeWindow.classes.medium.falseDiscoveryControlledModelCount, 0);
assert.equal(openStressTests.fullHanzeWindow.classes.high.falseDiscoveryControlledModelCount, 0);

const expectedFiles = new Map([
  ['NaoDuringHydroPeaks.R', '01f649c406b7a35c094f18433231fb09f98eae52dfd8bc8ac8f092b5062212ef'],
  ['NaoDuringFloodEvents.R', '27a1c1205abef4a2896a3e896dc95815c24f1b702ad7db91be4d11fd72435c9b'],
  ['4-Flood_Dates.csv', 'f66c396f64e6b72a32423909d8d301339a0d14bb76c11d1f6bb770ac730ad8f7'],
  ['MonthlyNAO.csv', '22088549024caaaf8fd100d7680804f839fb72f0213cd6218efaf233cfa7eea0'],
  ['3-Station_List.csv', '26fffd95b07b80aa0dcdc8d333426bc059c75cc7db574d749f0a2b920dd18ce6'],
  ['FloodEvents.csv', 'd39c0aa19566559130c9f42d7d710accea65cb25d547e4301fc9511673e46766'],
]);
const listedFiles = fileListing.data.filter(item => item.attributes.kind === 'file');
assert.equal(listedFiles.length, expectedFiles.size);
const downloadedFiles = await Promise.all(listedFiles.map(async item => {
  const expectedSha256 = expectedFiles.get(item.attributes.name);
  assert(expectedSha256, `Unexpected OSF file: ${item.attributes.name}`);
  assert.equal(item.attributes.extra.hashes.sha256, expectedSha256);
  const bytes = await fetchBuffer(item.links.download);
  assert.equal(sha256(bytes), expectedSha256, `Checksum mismatch for ${item.attributes.name}`);
  return {
    name: item.attributes.name,
    bytes,
    size: bytes.length,
    sha256: expectedSha256,
    downloadUrl: item.links.download,
  };
}));
const byName = new Map(downloadedFiles.map(file => [file.name, file]));
const floodEvents = parseCsv(byName.get('FloodEvents.csv').bytes);
const monthlyNao = parseCsv(byName.get('MonthlyNAO.csv').bytes, 'utf8');
const stations = parseCsv(byName.get('3-Station_List.csv').bytes, 'utf8');
const floodDates = parseCsv(byName.get('4-Flood_Dates.csv').bytes, 'utf8');
assert.equal(floodEvents.length, 1_575);
assert.equal(monthlyNao.length, 819);
assert.equal(stations.length, 4_062);
assert.equal(floodDates.length, 171_325);
assert.equal(Math.min(...floodEvents.map(row => Number(row.yearStart))), 1871);
assert.equal(Math.max(...floodEvents.map(row => Number(row.yearStart))), 2018);
assert.equal(Math.min(...monthlyNao.map(row => Number(row.year))), 1950);
assert.equal(Math.max(...monthlyNao.map(row => Number(row.year))), 2018);

const candidate = {
  previous: { value: 4.4, grade: 'B', lower: 1.8, upper: 6.6, confidence: 'C' },
  revised: { value: 4.8, grade: 'C', lower: 2.1, upper: 6.6, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 1, central: 2, upper: 2 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 0, central: 1, upper: 2 },
    },
    ecosystem: {
      severity: { lower: 0, central: 1, upper: 2 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 0, central: 2, upper: 3 },
    },
  },
  reason: 'A peer-reviewed catastrophe model supplies a direct material-loss pathway: modeled average flood losses differed by as much as 50% between opposite NAO states, with the sign changing by region and season. An independent study and a new open-data reproduction confirm regional and seasonal sign reversals, but do not provide a robust high-loss classifier after false-discovery control. This supports material human severity as the central estimate and removes “no adverse consequence” as its lower bound without increasing the score. Absolute attributable loss, affected-person reach, recovery time and ecosystem denominators remain unresolved, so the A–D range remains visible and confidence stays C.',
};

const payload = {
  version: 'tulip_north_atlantic_oscillation_consequence_2026_09_24_v2',
  retrievedOn: '2026-09-24',
  status: 'direct_modeled_material_loss_pathway_ingested_absolute_loss_reach_duration_and_ecosystem_denominators_missing',
  productionRatingsEnabled: 0,
  nodeId: 'north_atlantic_oscillation',
  sources: {
    floodLossStudy: {
      id: 'zanardo_nao_european_flood_losses_2019',
      publisher: 'American Geophysical Union, Geophysical Research Letters',
      title: article.title[0],
      publicationDate: articlePublicationDate,
      doi,
      url: articleUrl,
      crossrefUrl,
      crossrefResponseSha256: sha256(Buffer.from(JSON.stringify(crossref))),
      abstract: articleAbstract,
      verifiedClaims: [
        'The historical analysis reports a significant relationship between NAO state and catastrophic flood occurrence across Europe.',
        'The catastrophe-model analysis reports a significant relationship between NAO state and flood economic loss.',
        'Average modeled flood loss under opposite NAO states differed by up to 50%, with the harmful direction varying by region and season.',
      ],
    },
    independentForecastStudy: {
      id: 'guimaraes_nobre_european_flood_loss_forecast_2020',
      publisher: 'American Geophysical Union, Earth’s Future',
      title: independentArticle.title[0],
      publicationDate: '2020-04-23',
      doi: independentDoi,
      url: independentArticleUrl,
      crossrefUrl: independentCrossrefUrl,
      crossrefResponseSha256: sha256(Buffer.from(JSON.stringify(independentCrossref))),
      openPdfUrl: independentPdfUrl,
      openPdfSha256: sha256(independentPdf),
      verifiedClaims: [
        'The study used 1980–2016 Munich Re NatCatSERVICE losses for 35 European countries, grouped into four regions and four seasons.',
        'Simple and bivariate logistic models used five circulation indices, leave-one-out validation and AUC; the published p-value admission threshold was 0.1.',
        'Across the five circulation indices, the study could classify damaging, low and medium loss classes in selected region-seasons but could not classify the high-damaging class.',
        'NAO relationships changed direction by region, season and phase; the study did not establish one uniformly harmful NAO phase.',
      ],
      limitation: 'The NatCatSERVICE loss series is proprietary, the reported model summary spans five circulation indices rather than NAO alone, and predictive association is not causal attribution.',
    },
    openFloodImpactDataset: {
      id: 'hanze_v2_1_european_flood_impacts_2024',
      publisher: 'Earth System Science Data and Zenodo',
      title: hanzeMetadata.metadata.title,
      publicationDate: '2024-11-06',
      articleUrl: 'https://doi.org/10.5194/essd-16-5145-2024',
      recordUrl: hanzeRecordUrl,
      apiUrl: hanzeApiUrl,
      eventsUrl: hanzeEventsUrl,
      eventsMd5: '369bcff3d1f97624db2b444e44d45217',
      eventRows: hanzeEvents.length,
      eventRows1980To2020: currentHanzeEvents.length,
      eventsWithReported2020EuroLoss1980To2020: reportedLossEvents,
      reportedLossCoveragePercent1980To2020: round(reportedLossEvents / currentHanzeEvents.length * 100, 2),
      limitation: 'HANZE includes only damaging floods that meet its inclusion threshold, records 2020-euro loss for about half of 1980–2020 event rows, and does not identify the share caused by NAO.',
    },
    officialNaoSeries: {
      id: 'noaa_cpc_daily_nao_index_2026',
      publisher: 'NOAA Climate Prediction Center',
      title: 'Daily North Atlantic Oscillation index',
      url: noaaNaoUrl,
      retrievedOn: '2026-09-24',
      responseSha256: sha256(dailyNaoBytes),
      rows: dailyNao.length,
      firstDate: `${dailyNao[0].year}-${String(dailyNao[0].month).padStart(2, '0')}-${String(dailyNao[0].day).padStart(2, '0')}`,
      lastDate: `${dailyNao.at(-1).year}-${String(dailyNao.at(-1).month).padStart(2, '0')}-${String(dailyNao.at(-1).day).padStart(2, '0')}`,
    },
    reproducibilityArchive: {
      id: 'zanardo_nao_european_floods_osf_2019',
      publisher: 'Open Science Framework; archive supplied by the study authors',
      title: project.data.attributes.title,
      url: `https://osf.io/${osfProjectId}/?view_only=${osfViewToken}`,
      projectApiUrl: osfProjectUrl,
      projectMetadataSha256: sha256(Buffer.from(JSON.stringify(project))),
      projectModifiedOn: project.data.attributes.date_modified,
      files: downloadedFiles.map(({ bytes, ...file }) => file).sort((left, right) => left.name.localeCompare(right.name)),
      verifiedShape: {
        historicalFloodEventRows: floodEvents.length,
        historicalFloodEventStartYear: 1871,
        historicalFloodEventEndYear: 2018,
        monthlyNaoRows: monthlyNao.length,
        monthlyNaoStartYear: 1950,
        monthlyNaoEndYear: 2018,
        hydrologicStations: stations.length,
        annualPeakDateRows: floodDates.length,
      },
      limitation: 'The archive reproduces the observational flood-event analysis. The proprietary catastrophe-model outputs are not included, so the published relative-loss result cannot be converted into an absolute loss total.',
    },
  },
  currentWindow: {
    start: 1950,
    end: 2018,
    coverageStatus: 'historical_event_sample_with_modeled_loss',
    summaryMethod: 'event_distribution_and_catastrophe_model',
    coverageNote: 'The consequence source includes events through 2018 and overlaps the standard 2006–2025 recent-impact period. A separate 2025 observational study remains the newest compatible physical-consequence evidence through 2020.',
  },
  evidence: {
    materialLoss: {
      consequence: 'Modeled flood economic loss',
      maximumReportedDifferenceBetweenOppositeNaoStatesPercent: 50,
      direction: 'phase_region_and_season_dependent',
      observedOccurrenceRelationship: 'statistically significant in selected European regions and seasons',
      modeledLossRelationship: 'statistically significant in selected European regions and seasons',
      modelDomainCountries: 15,
      absoluteAttributableLossPublished: false,
      affectedPersonCountPublished: false,
      consequenceDurationPublished: false,
      interpretation: 'The source supports a material economic-loss pathway and therefore human severity level 2 as the central estimate. It does not establish the global magnitude, population reach or recovery duration of NAO-attributable harm.',
    },
    reproducibility: {
      observationalFilesVerified: expectedFiles.size,
      authorArchiveContainsCatastropheModelOutputs: false,
      interpretation: 'The observational event analysis can be inspected and rerun. The proprietary catastrophe-model output cannot be independently reproduced from the archive, which keeps confidence at C and prevents an exact severity or reach estimate.',
    },
    independentOpenStressTest: {
      method: 'Aggregate open HANZE 2020-euro losses by four European subregions and four meteorological seasons; pair each cell with the official mean daily NAO index; fit one-predictor logistic models; use leave-one-out AUC; and control the false-discovery rate within each loss class across 16 region-season tests.',
      lossClasses: 'Damaging means any reported seasonal loss. Low, medium and high thresholds are the 33rd, 50th and 66th percentiles of positive seasonal-region loss totals in each analysis window.',
      windows: openStressTests,
      stableFinding: 'In both the publication-matched 1980–2016 window and the full 1980–2020 HANZE window, three damaging/not-damaging relationships survive 10% false-discovery control: positive NAO in northern winter, negative NAO in northern summer and negative NAO in eastern spring. No low, medium or high loss-class model survives that control.',
      interpretation: 'The open reproduction independently supports an NAO-to-material-loss association and the region-season sign reversal. It does not supply causal attributable loss, unique people harmed or recovery duration, and it does not justify severe or catastrophic human severity.',
    },
  },
  ratingDecision: {
    change: 'independent_open_stress_test_added_score_unchanged',
    candidate,
    admittedUses: [
      'Use the modeled economic-loss relationship to set the central human severity to material economic loss.',
      'Use the observed event relationship and modeled loss result to exclude zero human severity as the lower bound.',
      'Use the region-, season- and phase-dependent sign to prevent a uniform European or global harmful-direction claim.',
      'Use the OSF archive to reproduce the observational input and analysis boundary.',
      'Use the open HANZE reproduction as an independent check that selected material-loss associations and sign reversals do not depend solely on the proprietary catastrophe model.',
    ],
    excludedUses: [
      'Do not treat all flood losses during positive or negative NAO months as caused by the NAO.',
      'Do not convert the relative 50% maximum difference into an absolute currency amount or affected-person count.',
      'Do not use the 15-country model domain as a harmed-population denominator.',
      'Do not infer consequence or recovery duration from the 1950–2018 event record.',
      'Do not add flood, storm, crop, energy, air-pollution, Sargassum or other downstream node ratings.',
      'Do not treat unavailable proprietary model output as independently reproduced.',
      'Do not treat a seasonal association, an unadjusted p-value or a loss-class prediction as causal NAO-attributable harm.',
      'Do not interpret the absence of a false-discovery-controlled high-loss classifier as proof that severe NAO-linked floods cannot occur.',
    ],
    exactRemainingGaps: [
      'An open or independently reproduced catastrophe-model output with absolute NAO-attributable loss and uncertainty.',
      'A unique affected-person count or population share tied to the attributable consequence rather than weather exposure.',
      'Measured duration or recovery time for the attributed human consequence.',
      'Current ecosystem-condition loss, affected-distribution share and recovery duration attributable to NAO phases.',
      'A compatible update that covers terminal consequences through the complete 2006–2025 recent-impact period.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, candidate: payload.ratingDecision.candidate.revised }, null, 2));
