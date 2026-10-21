"""Challenge source identity, mean-cover semantics and loss substitution."""
import copy
import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).with_name('audit-coral-community-consequence-references.py')
SPEC = importlib.util.spec_from_file_location('coral_reference', PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def fixture():
    cover = [
        {'site_code': 'site_a', 'pre_post': 'Pre', 'branching': '5', 'massive': '4'},
        {'site_code': 'site_a', 'pre_post': 'Post', 'branching': '0', 'massive': '9'},
    ]
    cov = [{
        'site_code': 'site_a', 'pre_post': state, 'latitude': '-18', 'longitude': '145',
        'cluster': '1', 'Year_Pre': '2013', 'Year_Post': '2017', 'interval': '4', 'depth': '8.5',
    } for state in ('Pre', 'Post')]
    return cover, cov


class ReferenceTests(unittest.TestCase):
    def derive(self, cover, cov):
        return MODULE.derive_references(cover, cov, ['branching', 'massive'])

    def test_net_zero_retains_changed_community_without_inventing_harm(self):
        case = self.derive(*fixture())[0]
        self.assertEqual(case['netTotalCoverDifferencePp'], 0)
        self.assertEqual(case['decliningCategoryCoverDifferenceSumPp'], 5)
        self.assertEqual(case['increasingCategoryCoverDifferenceSumPp'], 5)
        self.assertEqual(case['postTotalCoralCoverPct'], 9)
        for key in ('score', 'ecologicalHarmSeverity', 'mappedDamagedAreaKm2', 'nodeAttributableFraction'):
            self.assertIsNone(case[key])

    def test_row_order_does_not_create_a_different_pair(self):
        cover, cov = fixture()
        self.assertEqual(self.derive(cover, cov), self.derive(cover[::-1], cov[::-1]))

    def test_unrelated_site_does_not_change_existing_reference(self):
        cover, cov = fixture()
        before = self.derive(cover, cov)[0]
        extra_cover, extra_cov = copy.deepcopy(cover), copy.deepcopy(cov)
        for row in extra_cover + extra_cov:
            row['site_code'] = 'unrelated_site'
        after = self.derive(cover + extra_cover, cov + extra_cov)
        self.assertEqual(before, next(row for row in after if row['siteCode'] == 'site_a'))

    def test_duplicate_or_orphan_identity_is_rejected(self):
        for target in ('cover', 'covariate', 'orphan'):
            with self.subTest(target=target):
                cover, cov = fixture()
                if target == 'cover':
                    cover.append(copy.deepcopy(cover[0]))
                elif target == 'covariate':
                    cov.append(copy.deepcopy(cov[0]))
                else:
                    cov[0]['site_code'] = 'other_site'
                with self.assertRaises(ValueError):
                    self.derive(cover, cov)

    def test_coordinate_cluster_or_year_mismatch_is_rejected(self):
        for field, value in [('latitude', '-19'), ('cluster', '2'), ('Year_Pre', '2014')]:
            with self.subTest(field=field):
                cover, cov = fixture()
                cov[1][field] = value
                with self.assertRaises(ValueError):
                    self.derive(cover, cov)

    def test_depth_change_is_preserved_as_a_confounder(self):
        cover, cov = fixture()
        cov[1]['depth'] = '5'
        self.assertEqual(self.derive(cover, cov)[0]['depthReview'], 'different_reported_means')

    def test_missing_or_impossible_measurements_are_rejected(self):
        for value in ('', 'ND', 'nan', 'inf', '-1', '101'):
            with self.subTest(value=value):
                cover, cov = fixture()
                cover[0]['branching'] = value
                with self.assertRaises(ValueError):
                    self.derive(cover, cov)
        cover, cov = fixture()
        cover[0]['branching'], cover[0]['massive'] = '60', '60'
        with self.assertRaises(ValueError):
            self.derive(cover, cov)

    def test_unknown_or_unpaired_state_is_rejected(self):
        cover, cov = fixture()
        with self.assertRaises(ValueError):
            self.derive(cover[:1], cov[:1])
        cover[1]['pre_post'] = cov[1]['pre_post'] = 'Current'
        with self.assertRaises(ValueError):
            self.derive(cover, cov)

    def test_category_loss_sum_is_not_a_partition_invariant_harm_unit(self):
        cover, cov = fixture()
        separate = self.derive(cover, cov)[0]
        merged_cover = [{'site_code': r['site_code'], 'pre_post': r['pre_post'],
                         'all_coral': str(float(r['branching']) + float(r['massive']))} for r in cover]
        merged = MODULE.derive_references(merged_cover, cov, ['all_coral'])[0]
        self.assertEqual(separate['netTotalCoverDifferencePp'], merged['netTotalCoverDifferencePp'])
        self.assertNotEqual(separate['decliningCategoryCoverDifferenceSumPp'],
                            merged['decliningCategoryCoverDifferenceSumPp'])
        self.assertIsNone(merged['ecologicalHarmSeverity'])


if __name__ == '__main__':
    unittest.main()
