export const METRIC_DISPLAY_VERSION = '2026-09-06';

const NUMBER_SOURCE = String.raw`-?\d+(?:,\d{3})*(?:\.\d+)?`;
const IMPERIAL_DISPLAY_PATTERN = /\b(?:miles?|mph|feet|foot|ft|inches?|inch|lbs?|pounds?|ounces?|oz|gallons?|gal|acres?|yards?|fahrenheit|knots?|ton-miles?|tonne-miles?|brake-horsepower-hour|barrels?|bbl|cfs)\b|°F|sq\.?\s*ft|square feet|cubic feet|short tons?/i;

function parseNumber(value) {
  return Number(String(value).replaceAll(',', ''));
}

function formatConvertedNumber(value) {
  const magnitude = Math.abs(value);
  const maximumFractionDigits = magnitude >= 100
    ? 0
    : magnitude >= 10
      ? 1
      : 2;
  return value.toLocaleString('en-US', { maximumFractionDigits });
}

function replaceMeasuredRange(text, unitPattern, factor, metricUnit) {
  const pattern = new RegExp(
    `(${NUMBER_SOURCE})(\\s*(?:-|–|—|to)\\s*)(${NUMBER_SOURCE})\\s*${unitPattern}`,
    'gi'
  );
  return text.replace(pattern, (_, lower, connector, upper) => (
    `${formatConvertedNumber(parseNumber(lower) * factor)}${connector}${formatConvertedNumber(parseNumber(upper) * factor)} ${metricUnit}`
  ));
}

function replaceMeasuredValue(text, unitPattern, factor, metricUnit) {
  const pattern = new RegExp(`(${NUMBER_SOURCE})(\\s+(thousand|million|billion))?\\s*[-‐‑]?\\s*${unitPattern}`, 'gi');
  return text.replace(pattern, (_, value, scale = '') => (
    `${formatConvertedNumber(parseNumber(value) * factor)}${scale || ''} ${metricUnit}`
  ));
}

function replaceLinearUnit(text, unitPattern, factor, metricUnit) {
  return replaceMeasuredValue(
    replaceMeasuredRange(text, unitPattern, factor, metricUnit),
    unitPattern,
    factor,
    metricUnit
  );
}

function replaceFahrenheit(text) {
  const convert = value => (parseNumber(value) - 32) * (5 / 9);
  const rangePattern = new RegExp(
    `(${NUMBER_SOURCE})(\\s*(?:-|–|—|to)\\s*)(${NUMBER_SOURCE})\\s*(?:°\\s*F|degrees?\\s+Fahrenheit)` ,
    'gi'
  );
  const valuePattern = new RegExp(`(${NUMBER_SOURCE})\\s*(?:°\\s*F|degrees?\\s+Fahrenheit)`, 'gi');
  return text
    .replace(rangePattern, (_, lower, connector, upper) => (
      `${formatConvertedNumber(convert(lower))}${connector}${formatConvertedNumber(convert(upper))} °C`
    ))
    .replace(valuePattern, (_, value) => `${formatConvertedNumber(convert(value))} °C`);
}

function protectLexicalMileTerms(text) {
  const protectedValues = [];
  const protectedText = text.replace(/\b(?:(?:last|first)[-\s]mile|(?:on|by)\s+foot|foot\s+traffic|rail\s+yards?|shipyards?|front\s+yards?|backyards?|schoolyards?|berths?,\s*yards?)\b/gi, value => {
    const token = `__TULIP_METRIC_PROTECTED_${protectedValues.length}__`;
    protectedValues.push(value);
    return token;
  });
  return { protectedText, protectedValues };
}

function restoreProtectedTerms(text, protectedValues) {
  return protectedValues.reduce(
    (value, protectedValue, index) => value.replace(`__TULIP_METRIC_PROTECTED_${index}__`, protectedValue),
    text
  );
}

/**
 * Converts reader-facing measurements to metric while leaving source records
 * untouched. Call this only at a presentation or exported-display boundary.
 */
export function formatMetricDisplayText(input) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);
  if (!input || /^https?:\/\//i.test(input)) return input;

  const { protectedText, protectedValues } = protectLexicalMileTerms(input);
  let text = replaceFahrenheit(protectedText);

  const conversions = [
    [String.raw`(?:square\s+miles?|sq\.?\s*mi\.?|mi²)`, 2.589988110336, 'km²'],
    [String.raw`(?:square\s+feet|sq\.?\s*ft\.?|ft²)`, 0.09290304, 'm²'],
    [String.raw`(?:cfs)`, 0.028316846592, 'm³/s'],
    [String.raw`(?:cubic\s+feet|cu\.?\s*ft\.?|ft³)`, 0.028316846592, 'm³'],
    [String.raw`(?:nautical\s+miles?|nmi)`, 1.852, 'km'],
    [String.raw`(?:miles?\s+per\s+hour|mph)`, 1.609344, 'km/h'],
    [String.raw`(?:knots?|kt)`, 1.852, 'km/h'],
    [String.raw`(?:short\s+tons?)`, 0.90718474, 't'],
    [String.raw`(?:tonne-miles?|ton-miles?)`, 1.609344, 'tonne-km'],
    [String.raw`(?:miles?|mi\.)`, 1.609344, 'km'],
    [String.raw`(?:feet|foot|ft\.?)`, 0.3048, 'm'],
    [String.raw`(?:yards?|yd\.?)`, 0.9144, 'm'],
    [String.raw`(?:inches?|inch|in\.?)`, 2.54, 'cm'],
    [String.raw`(?:acres?)`, 0.40468564224, 'ha'],
    [String.raw`(?:US\s+gallons?|gallons?|gal\.?)`, 3.785411784, 'L'],
    [String.raw`(?:barrels?|bbl\.?)`, 158.987294928, 'L'],
    [String.raw`(?:pounds?|lbs?\.?)`, 0.45359237, 'kg'],
    [String.raw`(?:ounces?|oz\.?)`, 28.349523125, 'g'],
  ];

  for (const [unitPattern, factor, metricUnit] of conversions) {
    text = replaceLinearUnit(text, unitPattern, factor, metricUnit);
  }

  text = text
    .replace(/\bfeet\s+or\s+meters?\b/gi, 'metres')
    .replace(/\bmeters?\s+or\s+feet\b/gi, 'metres')
    .replace(/\bdegrees?\s+Celsius\s+or\s+Fahrenheit\b/gi, 'degrees Celsius')
    .replace(/\bFahrenheit\s+or\s+Celsius\b/gi, 'Celsius')
    .replace(/\bknots?\s+per\s+24\s+hours?\b/gi, 'kilometres per hour gained over 24 hours')
    .replace(/\btonne-miles?\b/gi, 'tonne-kilometres')
    .replace(/\bton-miles?\b/gi, 'tonne-kilometres')
    .replace(/\bbrake-horsepower-hours?\b/gi, 'kilowatt-hours')
    .replace(/\bsquare[-\s]miles?\b/gi, 'square kilometres')
    .replace(/\bnautical\s+miles?\b/gi, 'kilometres')
    .replace(/\bvehicle[-\s]miles?\b/gi, 'vehicle-kilometres')
    .replace(/\btrack\s+miles?\b/gi, 'track kilometres')
    .replace(/\briver\s+and\s+stream\s+miles?\b/gi, 'river and stream kilometres')
    .replace(/\bmiles?\b/gi, 'kilometres')
    .replace(/\b(?:feet|foot)\b/gi, 'metres')
    .replace(/\bft\b/gi, 'm')
    .replace(/\b(?:inches|inch)\b/gi, 'centimetres')
    .replace(/\b(?:US\s+gallons|gallons|gallon)\b/gi, 'litres')
    .replace(/\bgal\b/gi, 'L')
    .replace(/\b(?:acres|acre)\b/gi, 'hectares')
    .replace(/\b(?:pounds|pound)\b/gi, 'kilograms')
    .replace(/\blbs?\b/gi, 'kg')
    .replace(/\b(?:ounces|ounce)\b/gi, 'grams')
    .replace(/\boz\b/gi, 'g')
    .replace(/\b(?:barrels|barrel)\b/gi, 'litres')
    .replace(/\bbbl\b/gi, 'L')
    .replace(/\bcubic\s+feet\b/gi, 'cubic metres')
    .replace(/\bcfs\b/gi, 'm³/s')
    .replace(/\b(?:short\s+tons|short\s+ton)\b/gi, 'tonnes')
    .replace(/\b(?:mph)\b/gi, 'km/h')
    .replace(/\b(?:knots|knot)\b/gi, 'km/h')
    .replace(/\bdegrees?\s+Fahrenheit\b/gi, 'degrees Celsius')
    .replace(/°\s*F\b/gi, '°C');

  return restoreProtectedTerms(text, protectedValues);
}

export function metricizeDisplayValue(value) {
  if (Array.isArray(value)) return value.map(metricizeDisplayValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, metricizeDisplayValue(child)]));
  }
  return typeof value === 'string' ? formatMetricDisplayText(value) : value;
}

export function containsImperialDisplayUnit(value) {
  const { protectedText } = protectLexicalMileTerms(String(value || ''));
  return IMPERIAL_DISPLAY_PATTERN.test(protectedText);
}
