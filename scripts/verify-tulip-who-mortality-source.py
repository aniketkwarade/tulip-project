"""Independent read of WHO's global AIR_35 row; network required."""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json"
saved = json.loads(ARTIFACT.read_text())
payload = json.loads(subprocess.run(
    ["curl", "--fail", "--silent", "--show-error", "--max-time", "30", saved["sourceUrl"]],
    check=True, capture_output=True, text=True,
).stdout)
rows = payload["value"]
assert len(rows) == 1, len(rows)
row = rows[0]
assert (row["IndicatorCode"], row["SpatialDimType"], row["SpatialDim"], row["TimeDim"],
        row["Dim1"], row["Dim2"]) == (
            "AIR_35", "GLOBAL", "GLOBAL", 2021, "SEX_BTSX", "GHECAUSE_GHE000000")
assert row["Low"] == saved["modeledDeaths"]["lower95"]
assert row["NumericValue"] == saved["modeledDeaths"]["central"]
assert row["High"] == saved["modeledDeaths"]["upper95"]
assert row["Value"] == saved["sourceDisplayValue"]
print(json.dumps({"status": "reproduced_source_row", "indicator": row["IndicatorCode"],
                  "sourceUpdatedAt": row["Date"], "interval": saved["modeledDeaths"]}, indent=2))
