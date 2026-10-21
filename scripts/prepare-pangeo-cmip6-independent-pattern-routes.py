#!/usr/bin/env python3
"""Freeze raw CMIP6 monthly-temperature routes for all 32 model votes."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import importlib.util
import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
HELPER_PATH = ROOT / "scripts/prepare-pangeo-cmip6-global-predictor-routes.py"
GLOBAL_PREDICTORS = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"
EXISTING_ROUTES = CALIBRATION_DIR / "pangeo-cmip6-global-predictor-routes.json"
OUTPUT = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-routes.json"
REPORT = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-routes-report.md"
VERSION = "tulip_pangeo_cmip6_independent_pattern_routes_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def load_helper():
    spec = importlib.util.spec_from_file_location("pangeo_route_helper", HELPER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def base_route(helper, frame: pd.DataFrame, record: dict) -> dict:
    model = record["canonicalModel"]
    member = record["member"]
    historical = helper.one_row(frame, model, member, "historical")
    scenario = helper.one_row(frame, model, member, "ssp245")
    if historical is None or scenario is None or historical["gridLabel"] != scenario["gridLabel"]:
        return {
            "canonicalModel": model,
            "member": member,
            "status": "unique_compatible_pair_absent",
            "historical": historical,
            "ssp245": scenario,
            "areacella": None,
        }
    return {
        "canonicalModel": model,
        "member": member,
        "historical": historical,
        "ssp245": scenario,
        "areacella": helper.area_row(frame, model, member, historical["gridLabel"]),
    }


def route_core(route: dict) -> dict:
    return {
        "canonicalModel": route["canonicalModel"],
        "member": route["member"],
        "historical": route.get("historical"),
        "ssp245": route.get("ssp245"),
        "areacella": route.get("areacella"),
    }


def build() -> dict:
    helper = load_helper()
    catalog_identity = helper.validate_catalog(helper.CATALOG)
    predictors = json.loads(GLOBAL_PREDICTORS.read_text())
    predictors_without_digest = dict(predictors)
    predictors_digest = predictors_without_digest.pop("digest")
    if canonical_digest(predictors_without_digest) != predictors_digest:
        raise RuntimeError("Global-predictor inventory digest changed")
    existing = json.loads(EXISTING_ROUTES.read_text())
    existing_without_digest = dict(existing)
    existing_digest = existing_without_digest.pop("digest")
    if canonical_digest(existing_without_digest) != existing_digest:
        raise RuntimeError("Existing Pangeo route inventory digest changed")
    existing_by_identity = {
        (route["canonicalModel"], route["member"]): route for route in existing["routes"]
    }
    frame = pd.read_csv(helper.CATALOG)
    routes = []
    pending = []
    for record in predictors["records"]:
        route = base_route(helper, frame, record)
        identity = (record["canonicalModel"], record["member"])
        previous = existing_by_identity.get(identity)
        if previous is not None:
            if route_core(previous) != route_core(route):
                raise RuntimeError(f"Previously frozen route changed for {identity}")
            routes.append(previous)
        elif "status" in route:
            routes.append(route)
        else:
            pending.append(route)
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(helper.inspect_route, route): route for route in pending}
        for future in as_completed(futures):
            routes.append(future.result())
    routes.sort(key=lambda row: (row["canonicalModel"], row["member"]))
    ready = [row for row in routes if row["status"] == "exact_historical_and_ssp245_routes_ready"]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "all_exact_cmip6_monthly_pattern_routes_frozen" if len(ready) == len(routes) else "cmip6_monthly_pattern_routes_incomplete",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze exact-member monthly historical and SSP2-4.5 temperature grids for every preselected independent model vote before any regional-pattern result is calculated.",
        "sources": {
            "pangeoDocumentation": helper.PANGEO_DOCS,
            "catalog": catalog_identity,
            "globalPredictorInventory": str(GLOBAL_PREDICTORS.relative_to(ROOT)),
            "globalPredictorInventoryDigest": predictors["digest"],
            "reusedRouteInventory": str(EXISTING_ROUTES.relative_to(ROOT)),
            "reusedRouteInventoryDigest": existing["digest"],
        },
        "selection": {
            "independentIdentities": len(predictors["records"]),
            "experiments": ["historical", "ssp245"],
            "table": "Amon",
            "variable": "tas",
            "memberRule": "Use the exact canonical model/member frozen before the regional result is visible.",
            "gridRule": "Require one common historical/SSP2-4.5 grid and an exact areacella store or same-store one-dimensional coordinate bounds.",
        },
        "counts": {
            "identitiesExpected": len(predictors["records"]),
            "routesInspected": len(routes),
            "routesReady": len(ready),
            "routesUnresolved": len(routes) - len(ready),
            "routesReusedFromGlobalExecution": len(existing_by_identity),
            "exactAreacellaRoutes": sum(row.get("areaMethod") == "exact_areacella" for row in routes),
            "coordinateBoundsAreaRoutes": sum(row.get("areaMethod") == "spherical_area_from_coordinate_bounds" for row in routes),
        },
        "routes": routes,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Build exact grid-specific intersections for the 971 fixed mortality-panel regions, calculate both JJA and the declared May–September approximation, and execute the predeclared ensemble comparison after the ERA5-Land record is complete.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT.write_text(
        "# Pangeo CMIP6 independent-pattern routes\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"{counts['routesReady']} of {counts['identitiesExpected']} preselected exact model/member identities have a unique monthly historical/SSP2-4.5 grid and an explicit area route. "
        f"{counts['exactAreacellaRoutes']} use published same-grid cell area and {counts['coordinateBoundsAreaRoutes']} use same-store coordinate bounds.\n\n"
        "No regional result has been calculated and no TULIP axis or score changes.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({"output": str(OUTPUT.relative_to(ROOT)), "status": payload["status"], "counts": payload["counts"], "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
