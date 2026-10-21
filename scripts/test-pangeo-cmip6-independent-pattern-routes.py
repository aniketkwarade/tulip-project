#!/usr/bin/env python3
"""Validate frozen exact-member monthly CMIP6 regional-pattern routes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-routes.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    counts = payload["counts"]
    assert counts["identitiesExpected"] == 32
    assert counts["routesInspected"] == len(payload["routes"]) == 32
    assert counts["routesReady"] + counts["routesUnresolved"] == 32
    assert counts["exactAreacellaRoutes"] + counts["coordinateBoundsAreaRoutes"] == counts["routesReady"]
    identities = set()
    for route in payload["routes"]:
        identity = (route["canonicalModel"], route["member"])
        assert identity not in identities
        identities.add(identity)
        if route["status"] != "exact_historical_and_ssp245_routes_ready":
            continue
        historical = route["historical"]
        scenario = route["ssp245"]
        assert historical["sourceId"] == scenario["sourceId"] == route["canonicalModel"]
        assert historical["memberId"] == scenario["memberId"] == route["member"]
        assert historical["gridLabel"] == scenario["gridLabel"]
        assert route["tasDimensions"][0] == "time"
        assert route["areaMethod"] in {"exact_areacella", "spherical_area_from_coordinate_bounds"}
        assert len(route["historicalMetadata"]["sha256"]) == 64
        assert len(route["ssp245Metadata"]["sha256"]) == 64
    assert payload["decision"] == {
        "axesAdmitted": 0,
        "scoresChanged": 0,
        "nextGate": payload["decision"]["nextGate"],
    }
    print(f"Pangeo CMIP6 independent-pattern routes passed: {counts['routesReady']} of 32 exact-member monthly grids have explicit area routes, unique identities and zero score effects.")


if __name__ == "__main__":
    main()
