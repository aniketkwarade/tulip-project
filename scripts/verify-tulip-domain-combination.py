"""Separate Decimal arithmetic for the policy comparison, not scientific review."""
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP, localcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    report = json.loads((ROOT / 'artifacts/tulip-consequence-rule-audit-2026-09-27/domain-combination-comparison.json').read_text())
    for source in report['inputs']:
        assert hashlib.sha256((ROOT / source['path']).read_bytes()).hexdigest() == source['sha256']
    assert report['scientificCalibrationApproved'] is False
    decision = json.loads((ROOT / 'src/tulip-domain-combination-decision.json').read_text())
    assert decision['policyId'] == report['scopeDecision']['selectedPolicyId'] == 'fixed_average'
    assert decision['weights'] == {'human': 0.5, 'ecosystem': 0.5}
    assert report['scopeDecision']['status'] == 'user_decided_fixed_average'
    assert report['scopeDecision']['decisionVersion'] == decision['version']
    assert decision['scientificCalibrationApproved'] is False
    assert decision['wholeNodeNumericalRatingsApproved'] is False
    assert report['wholeNodeRatingsAdmitted'] == 0 and report['publicScoresChanged'] is False
    count = 0
    with localcontext() as context:
        context.prec = 60
        for case in report['cases']:
            h, n = Decimal(str(case['human'])), Decimal(str(case['ecosystem']))
            a, b = (h - 1) / 9, (n - 1) / 9
            expected = {'fixed_average': (h + n) / 2,
                'worse_domain': max(h, n),
                'bounded_accumulation': 1 + 9 * (a + b - a * b)}
            for policy, value in expected.items():
                result = case['results'][policy]
                assert abs(Decimal(str(result['unrounded'])) - value) < Decimal('1e-11')
                assert Decimal(str(result['experimentalValue'])) == value.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
                assert result['value'] is None and result['publicReady'] is False
                count += 1
    assert count == 42
    print(json.dumps({'status': 'passed', 'independent_policy_readings': count,
        'scope_counts': report['currentScopeDraftCounts'], 'scientific_validation': False}))


if __name__ == '__main__':
    main()
