"""Independent arithmetic implementation. This is not independent scientific review."""
import csv
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[1]
read = lambda p: json.loads((root / p).read_text())
policy = read('src/tulip-consequence-policy-v1.json')
inputs = read('src/tulip-reassessments/assessments-v1.json')
registry = read('public/tulip-assessments.json')
legacy = read('src/tulip-legacy-score-archive.json')['assessmentRegistry']

def mapping(amount, domain):
    points = policy[domain]['points']
    offset = policy[domain]['logOffset']
    if amount >= points[-1]['burden']:
        return 10.0
    for lower, upper in zip(points, points[1:]):
        if amount <= upper['burden']:
            share = (math.log1p(amount / offset) - math.log1p(lower['burden'] / offset)) / (math.log1p(upper['burden'] / offset) - math.log1p(lower['burden'] / offset))
            return lower['score'] + share * (upper['score'] - lower['score'])
    raise AssertionError('No mapping')

comparison = []
for node_id, record in registry['records'].items():
    if record['nodeKind'] == 'response':
        assert record['value'] is None
        continue
    source = inputs['records'][node_id]
    amounts = {}
    values = {}
    for domain in ['human', 'ecosystem']:
        component = source['components'][domain]
        d = component['derivation']
        if d['kind'] == 'source_endpoint_proxy':
            quantity = d['amount'] * d['transferFactor']
        elif domain == 'human':
            quantity = d['harmedPeopleEstimate'] * d['lossYearsPerPersonEstimate']
        else:
            quantity = d['affectedAreaKm2Estimate'] * d['conditionDeficitEstimate']
        assert quantity == component['quantityEstimate'], node_id
        amounts[domain] = quantity
        values[domain] = mapping(quantity, domain)
        assert abs(values[domain] - record['components'][domain]['baseValue']) < 1e-12, node_id
    priority = source['irreplaceability']
    fraction = priority.get('irreversibleLossFractionEstimate', 0) if priority['status'] == 'eligible' else 0
    nature = min(10, values['ecosystem'] + fraction)
    raw = (values['human'] + nature) / 2
    value = math.floor((raw + 1e-9) * 10 + .5) / 10
    assert value == record['value'] and abs(raw - record['unrounded']) < 1e-12, node_id
    assert 0 <= (nature - values['ecosystem']) / 2 <= .5, node_id
    old = legacy['records'][node_id]['value']
    comparison.append(dict(node_id=node_id, name=source['name'], tulip_legacy_score=old,
        tulip_score_internal_estimate=value, change=round(value-old, 1), human_loss_years_estimate=amounts['human'],
        nature_condition_equivalent_km2_estimate=amounts['ecosystem'], human_component=round(values['human'], 4),
        nature_component=round(nature, 4), rare_loss_bonus_overall=round((nature-values['ecosystem'])/2, 4),
        human_weight_30_score=next(c['value'] for c in record['sensitivity']['weightCases'] if c['humanWeight'] == .3),
        human_weight_70_score=next(c['value'] for c in record['sensitivity']['weightCases'] if c['humanWeight'] == .7),
        half_amounts_score=record['sensitivity']['quantityCases'][0]['value'],
        double_amounts_score=record['sensitivity']['quantityCases'][2]['value'],
        value_kind='Internal estimate', boundary=source['boundaryReview']))
assert len(comparison) == 354
destination = root / 'artifacts/tulip-reassessment-2026-09-28'
destination.mkdir(exist_ok=True)
with (destination / 'score-comparison.csv').open('w', newline='') as output:
    writer = csv.DictWriter(output, fieldnames=list(comparison[0]))
    writer.writeheader()
    writer.writerows(comparison)
report = dict(total_nodes=381, internal_estimates=354, measured_whole_node_scores=0, response_exclusions=27,
    missing_assessment_records=0, independently_reproduced_arithmetic=354,
    priority_adjustments=sum(r['rare_loss_bonus_overall'] > 0 for r in comparison),
    changed_scores=sum(r['change'] != 0 for r in comparison), minimum=min(r['tulip_score_internal_estimate'] for r in comparison),
    maximum=max(r['tulip_score_internal_estimate'] for r in comparison),
    mean=round(sum(r['tulip_score_internal_estimate'] for r in comparison)/354, 3),
    weight_sensitivity_max_change=round(max(abs(r[k]-r['tulip_score_internal_estimate']) for r in comparison for k in ['human_weight_30_score','human_weight_70_score']), 1),
    amount_stress_test_max_change=round(max(abs(r[k]-r['tulip_score_internal_estimate']) for r in comparison for k in ['half_amounts_score','double_amounts_score']), 1),
    limitations=['All whole-node ratings are internal estimates, not independently calibrated facts.',
        'Amount guesses, attribution, scope transfers, health/function equivalence and ecosystem condition proxies remain uncertain.',
        'No confidence interval or probability distribution is invented.',
        'No rare-loss bonus is assigned without a source-bound asset definition and irreversible-loss fraction.',
        'Current human annual-equivalent losses and ecological condition stocks are compared by TULIP convention.',
        'Arithmetic reproduction and software tests are not independent scientific review.'])
(destination / 'coverage.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
