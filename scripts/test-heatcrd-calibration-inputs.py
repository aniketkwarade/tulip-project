"""Exercise source-grain protections; no synthetic case validates a rating."""
import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).with_name('audit-heatcrd-calibration-inputs.py')
SPEC = importlib.util.spec_from_file_location('heatcrd_audit', SCRIPT)
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


def row(sample, year, cover):
    return {'sourceRow': sample, 'Sample_ID': sample, 'Site_ID': 1,
            'Latitude_Degrees': -18.0, 'Longitude_Degrees': 146.0,
            'Country_Name': 'synthetic_country', 'Ecoregion_Name': 'synthetic_ecoregion',
            'Citation': 'synthetic_source', 'Date_Year': year, 'Date_Month': 7,
            'Date_Day': 15, 'Depth': 5, 'Estimated_Resolution': '10s of meters',
            'Percent_Hard_Coral_Cover': cover, 'Site_Comments': None, 'Sample_Comments': None}


class PairRouteTests(unittest.TestCase):
    def test_preserves_absolute_and_relative_magnitudes(self):
        pairs, _, _, _ = AUDIT.derive_pairs([row(1, 2015, 80), row(2, 2016, 40)])
        self.assertEqual(pairs[0]['positiveObservedCoverLossPercentagePoints'], 40)
        self.assertEqual(pairs[0]['positiveObservedRelativeCoverLossPercent'], 50)

    def test_missing_or_invalid_fields_cannot_be_defaulted(self):
        variants = [('Depth', None), ('Date_Month', None), ('Date_Day', 32),
                    ('Date_Year', 2021), ('Percent_Hard_Coral_Cover', None),
                    ('Percent_Hard_Coral_Cover', 101), ('Percent_Hard_Coral_Cover', float('nan')),
                    ('Citation', ''), ('Latitude_Degrees', 100), ('Longitude_Degrees', None),
                    ('Estimated_Resolution', '10s of kilometers')]
        for field, value in variants:
            with self.subTest(field=field, value=value):
                first, last = row(1, 2015, 80), row(2, 2016, 40)
                last[field] = value
                pairs, excluded, _, _ = AUDIT.derive_pairs([first, last])
                self.assertFalse(pairs)
                self.assertEqual(len(excluded), 1)

    def test_calendar_date_validation(self):
        first, last = row(1, 2015, 80), row(2, 2016, 40)
        last.update(Date_Month=2, Date_Day=30)
        _, excluded, _, _ = AUDIT.derive_pairs([first, last])
        self.assertIn('invalid_calendar_date', excluded[0]['reasons'])

    def test_conflicting_sample_values_quarantine_every_version(self):
        first, last, conflicting = row(1, 2015, 80), row(2, 2016, 40), row(2, 2016, 60)
        conflicting['sourceRow'] = 3
        pairs, excluded, _, _ = AUDIT.derive_pairs([first, last, conflicting])
        self.assertFalse(pairs)
        self.assertEqual(len(excluded), 2)

    def test_ambiguous_measurement_grain_is_not_averaged(self):
        first, last, conflicting = row(1, 2015, 80), row(2, 2016, 40), row(3, 2016, 60)
        pairs, excluded, _, _ = AUDIT.derive_pairs([first, last, conflicting])
        self.assertFalse(pairs)
        self.assertEqual(len(excluded), 2)

    def test_season_depth_and_study_are_preserved(self):
        for field, value in [('Date_Month', 8), ('Depth', 10), ('Citation', 'different_source')]:
            with self.subTest(field=field):
                first, last = row(1, 2015, 80), row(2, 2016, 40)
                last[field] = value
                self.assertFalse(AUDIT.derive_pairs([first, last])[0])

    def test_unknown_day_remains_unknown(self):
        first, last = row(1, 2015, 80), row(2, 2016, 40)
        first['Date_Day'] = None
        pairs, _, _, _ = AUDIT.derive_pairs([first, last])
        self.assertIsNone(pairs[0]['before']['day'])

    def test_zero_baseline_has_no_relative_change(self):
        pairs, _, _, _ = AUDIT.derive_pairs([row(1, 2015, 0), row(2, 2016, 10)])
        self.assertIsNone(pairs[0]['signedRelativeCoverChangePercent'])
        self.assertIsNone(pairs[0]['positiveObservedRelativeCoverLossPercent'])
        self.assertEqual(pairs[0]['signedCoverChangePercentagePoints'], 10)

    def test_chronology_and_row_order(self):
        rows = [row(1, 2014, 80), row(2, 2015, 40), row(3, 2016, 50)]
        self.assertEqual(AUDIT.derive_pairs(rows)[0], AUDIT.derive_pairs(list(reversed(rows)))[0])

    def test_site_coordinate_change_is_rejected(self):
        first, last = row(1, 2015, 80), row(2, 2016, 40)
        last['Latitude_Degrees'] = -20
        with self.assertRaises(ValueError):
            AUDIT.derive_pairs([first, last])

    def test_unrelated_site_does_not_change_existing_references(self):
        rows = [row(1, 2015, 80), row(2, 2016, 40)]
        original = AUDIT.derive_pairs(rows)[0]
        extra_before, extra_after = row(3, 2015, 20), row(4, 2016, 10)
        extra_before['Site_ID'] = extra_after['Site_ID'] = 9
        expanded = AUDIT.derive_pairs(rows + [extra_before, extra_after])[0]
        self.assertEqual([pair for pair in expanded if pair['siteId'] == 1], original)


if __name__ == '__main__':
    unittest.main()
