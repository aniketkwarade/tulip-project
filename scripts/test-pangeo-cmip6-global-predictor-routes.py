#!/usr/bin/env python3
"""Validate frozen Pangeo CMIP6 exact-member predictor routes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-global-predictor-routes.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["sources"]["catalog"]["bytes"] == 83_974_211
    assert payload["sources"]["catalog"]["sha256"] == "81521cd1ff7572d3d8caada5062bde2e223f735b202002d9ed62777a327547c7"
    assert payload["counts"]["unresolvedUpstreamIdentities"] == 15
    assert payload["counts"]["routesInspected"] == len(payload["routes"]) == 15
    assert payload["counts"]["routesReady"] + payload["counts"]["routesUnresolved"] == 15
    identities = set()
    for route in payload["routes"]:
        key = (route["canonicalModel"], route["member"])
        assert key not in identities
        identities.add(key)
        if route["status"] != "exact_historical_and_ssp245_routes_ready":
            continue
        historical = route["historical"]
        scenario = route["ssp245"]
        assert historical["sourceId"] == scenario["sourceId"] == route["canonicalModel"]
        assert historical["memberId"] == scenario["memberId"] == route["member"]
        assert historical["gridLabel"] == scenario["gridLabel"]
        assert historical["experimentId"] == "historical" and scenario["experimentId"] == "ssp245"
        assert historical["tableId"] == scenario["tableId"] == "Amon"
        assert historical["variableId"] == scenario["variableId"] == "tas"
        assert route["tasDimensions"][0] == "time"
        assert route["areaMethod"] in {"exact_areacella", "spherical_area_from_coordinate_bounds"}
        assert len(route["historicalMetadata"]["sha256"]) == 64
        assert len(route["ssp245Metadata"]["sha256"]) == 64
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(f"Pangeo CMIP6 global-predictor routes passed: {payload['counts']['routesReady']} of 15 exact-member historical/SSP2-4.5 pairs have explicit area routes and zero score effects.")


if __name__ == "__main__":
    main()
