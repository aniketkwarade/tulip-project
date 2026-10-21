import csv
import importlib.util
import io
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('soga_scope', Path(__file__).with_name('audit-soga-outcome-scope.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
TEXT = (module.SOURCE / 'no2-global-dalys.csv').read_text(encoding='utf-8-sig')


def altered(field, value):
    rows = list(csv.reader(io.StringIO(TEXT)))
    keys = [module.parent.literal_cell(key) for key in rows[0]]
    row = next(row for row in rows[1:] if row[0] == '678572')
    row[keys.index(field)] = '="' + value + '"'
    output = io.StringIO()
    csv.writer(output).writerows(rows)
    return output.getvalue()


class ScopeAudit(unittest.TestCase):
    def test_negative_source_limit_is_preserved_not_clipped(self):
        rows, _ = module.extract_no2_rows(TEXT)
        self.assertEqual(rows[-1]['lower'], -250000)
        self.assertEqual(rows[-1]['central'], 232600)
        self.assertEqual(rows[-1]['upper'], 956000)

    def test_scope_changes_do_not_silently_pass(self):
        for field, value in [('Age Group Name', '5-14 years'), ('Sex', 'Female'),
                ('Country', 'United States of America'), ('Metric', 'rate'),
                ('Measure', 'death'), ('REI Name', 'Air pollution')]:
            with self.subTest(field=field), self.assertRaises(AssertionError):
                module.extract_no2_rows(altered(field, value))

    def test_ordered_bounds_still_required(self):
        with self.assertRaises(AssertionError):
            module.extract_no2_rows(altered('Burden Lower', '300000'))

    def test_new_year_is_not_a_transfer(self):
        with self.assertRaises(AssertionError):
            module.extract_no2_rows(altered('Year', '2026'))

    def test_unsafe_formula_is_not_a_number(self):
        with self.assertRaises(AssertionError):
            module.extract_no2_rows(altered('Burden Lower', '=1+1'))


if __name__ == '__main__':
    unittest.main()
