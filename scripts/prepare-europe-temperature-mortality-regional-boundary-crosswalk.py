#!/usr/bin/env python3
"""Resolve the 971 mortality-panel region IDs to official GISCO polygons.

The working-paper panel mixes current European identifiers with UK identifiers
retained in NUTS 2021. This step selects an exact identifier match from the
newest compatible official release and writes one deterministic geometry set
for the 1950–2022 ERA5-Land reconstruction. It does not change a TULIP axis or
rating.
"""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

import geopandas as gpd
from shapely import make_valid
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, mapping
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
COVERAGE_PATH = CALIBRATION_DIR / "europe-temperature-mortality-coverage-enumeration.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk-report.md"
GEOMETRY_PATH = ROOT / "tmp/tulip-regional-pattern/europe-temperature-mortality-971-regions.geojson"

SOURCES = (
    {
        "release": 2024,
        "path": ROOT / "tmp/tulip-regional-pattern/nuts-2024-1m.geojson",
        "url": "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326.geojson",
        "sha256": "b013441a23f5a29cd394c88f9f2621dea4e0fd5b18f0458dc708e48defd6aabb",
    },
    {
        "release": 2021,
        "path": ROOT / "tmp/tulip-regional-pattern/nuts-2021-1m.geojson",
        "url": "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2021_4326.geojson",
        "sha256": "3ae24a9aa32b95e06488c0c4dd080979e5b927d554b1fe35d8be83bb63cd6e97",
    },
)


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def canonical_digest(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def valid_polygonal_geometry(geometry):
    if geometry.is_valid:
        return geometry, False
    repaired = make_valid(geometry)
    if isinstance(repaired, GeometryCollection):
        polygonal = [part for part in repaired.geoms if isinstance(part, (Polygon, MultiPolygon))]
        repaired = unary_union(polygonal)
    if repaired.is_empty or not repaired.is_valid or not isinstance(repaired, (Polygon, MultiPolygon)):
        raise RuntimeError("Official boundary geometry could not be repaired to a valid polygon")
    return repaired, True


def source_records() -> tuple[list[dict], list[gpd.GeoDataFrame]]:
    records = []
    frames = []
    for source in SOURCES:
        path = source["path"]
        if not path.exists():
            raise RuntimeError(f"Missing official GISCO boundary file: {path.relative_to(ROOT)}")
        actual = file_sha256(path)
        if actual != source["sha256"]:
            raise RuntimeError(f"GISCO NUTS {source['release']} checksum changed: {actual}")
        frame = gpd.read_file(path)
        required = {"NUTS_ID", "LEVL_CODE", "CNTR_CODE", "geometry"}
        if not required.issubset(frame.columns):
            raise RuntimeError(f"NUTS {source['release']} is missing {sorted(required - set(frame.columns))}")
        if frame.crs is None:
            raise RuntimeError(f"NUTS {source['release']} has no coordinate reference system")
        frame = frame.to_crs("EPSG:4326")
        records.append({
            "release": source["release"],
            "url": source["url"],
            "localPath": str(path.relative_to(ROOT)),
            "bytes": path.stat().st_size,
            "sha256": actual,
            "features": len(frame),
        })
        frames.append(frame)
    return records, frames


def main() -> None:
    coverage = json.loads(COVERAGE_PATH.read_text())
    region_ids = coverage["files"]["fullPanel"]["regionIds"]
    if len(region_ids) != 971 or len(set(region_ids)) != 971:
        raise RuntimeError("Expected 971 unique response-panel region IDs")

    sources, frames = source_records()
    selected: dict[str, dict] = {}
    for source, frame in zip(sources, frames, strict=True):
        candidates = frame[frame["NUTS_ID"].astype(str).isin(region_ids)]
        for row in candidates.itertuples():
            region_id = str(row.NUTS_ID)
            if region_id in selected:
                continue
            selected[region_id] = {
                "regionId": region_id,
                "countryCode": str(row.CNTR_CODE),
                "nutsLevel": int(row.LEVL_CODE),
                "name": str(getattr(row, "NAME_LATN", None) or getattr(row, "NUTS_NAME", None) or region_id),
                "sourceRelease": source["release"],
                "geometry": row.geometry,
            }

    missing = sorted(set(region_ids) - set(selected))
    if missing:
        raise RuntimeError(f"Unresolved mortality-panel region IDs: {missing}")
    ordered = [selected[region_id] for region_id in sorted(region_ids)]
    if any(item["geometry"].is_empty for item in ordered):
        raise RuntimeError("At least one selected region has an empty geometry")
    for item in ordered:
        item["geometry"], item["geometryRepaired"] = valid_polygonal_geometry(item["geometry"])

    features = [{
        "type": "Feature",
        "id": item["regionId"],
        "properties": {
            "regionId": item["regionId"],
            "countryCode": item["countryCode"],
            "nutsLevel": item["nutsLevel"],
            "name": item["name"],
            "sourceRelease": item["sourceRelease"],
            "geometryRepaired": item["geometryRepaired"],
        },
        "geometry": mapping(item["geometry"]),
    } for item in ordered]
    collection = {"type": "FeatureCollection", "features": features}
    GEOMETRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    GEOMETRY_PATH.write_text(json.dumps(collection, separators=(",", ":")) + "\n")
    geometry_sha256 = file_sha256(GEOMETRY_PATH)

    release_counts = Counter(item["sourceRelease"] for item in ordered)
    level_counts = Counter(item["nutsLevel"] for item in ordered)
    country_counts = Counter(item["countryCode"] for item in ordered)
    rows = [{key: value for key, value in item.items() if key != "geometry"} for item in ordered]
    payload = {
        "version": "tulip_europe_temperature_mortality_regional_boundary_crosswalk_2026_09_26_v1",
        "preparedOn": "2026-09-26",
        "status": "complete_all_response_regions_resolved_to_official_gisco_boundaries",
        "productionRatingsEnabled": 0,
        "purpose": "Provide one exact, fixed regional geometry set for the 1950–2022 ERA5-Land forced-temperature-pattern reconstruction.",
        "inputs": {
            "coverageVersion": coverage["version"],
            "coverageDigest": coverage["digest"],
            "sources": sources,
        },
        "method": {
            "selection": "Resolve each exact response-panel identifier from the newest compatible official GISCO NUTS release, using NUTS 2021 only where the identifier is absent from NUTS 2024.",
            "fixedGeometry": "Hold the selected polygon fixed across 1950–2022 so boundary revisions cannot create a false temperature trend.",
            "mixedLevels": "The model panel contains country-level aggregate identifiers as well as NUTS 3 identifiers; the crosswalk preserves the model's declared region ID rather than forcing every row to NUTS 3.",
        },
        "coverage": {
            "responseRegions": len(region_ids),
            "resolvedRegions": len(ordered),
            "missingRegions": missing,
            "duplicateRegionIds": len(ordered) - len({item["regionId"] for item in ordered}),
            "invalidGeometries": sum(not item["geometry"].is_valid for item in ordered),
            "emptyGeometries": sum(item["geometry"].is_empty for item in ordered),
            "topologyRepairs": sum(item["geometryRepaired"] for item in ordered),
            "sourceReleaseCounts": {str(key): release_counts[key] for key in sorted(release_counts, reverse=True)},
            "nutsLevelCounts": {str(key): level_counts[key] for key in sorted(level_counts)},
            "countries": len(country_counts),
            "countryCounts": dict(sorted(country_counts.items())),
        },
        "geometryOutput": {
            "path": str(GEOMETRY_PATH.relative_to(ROOT)),
            "bytes": GEOMETRY_PATH.stat().st_size,
            "sha256": geometry_sha256,
            "crs": "EPSG:4326",
            "features": len(features),
        },
        "rows": rows,
        "decision": {
            "status": "admitted_as_regional_geometry_input_only",
            "admittedUse": "Aggregate ERA5-Land temperature to the exact response-panel region identities for the predeclared long-record pattern calculation.",
            "prohibitedUses": [
                "Do not treat administrative boundary coverage as human or ecosystem reach.",
                "Do not infer source-attributable mortality from the boundary crosswalk.",
                "Do not change a TULIP axis, rating or confidence from geometry resolution alone.",
            ],
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Read the 1950–2022 ERA5-Land summer temperatures for these 971 fixed geometries, fit the predeclared regional forced-temperature pattern, and challenge it against an independent pattern before endpoint use.",
        },
    }
    payload["digest"] = canonical_digest({
        "inputs": payload["inputs"],
        "method": payload["method"],
        "coverage": payload["coverage"],
        "geometryOutput": payload["geometryOutput"],
        "rows": payload["rows"],
        "decision": payload["decision"],
    })
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT_PATH.write_text(
        "# European temperature–mortality regional-boundary crosswalk\n\n"
        "Status: **all 971 response-panel region identifiers resolve to official GISCO polygons**.\n\n"
        f"NUTS 2024 supplies {release_counts[2024]} exact identifiers. NUTS 2021 supplies the remaining {release_counts[2021]}, primarily the UK identifiers retained by the model panel. "
        f"The panel contains {level_counts[1]} level-1 aggregates and {level_counts[3]} level-3 regions across {len(country_counts)} country codes. "
        f"All selected polygons are non-empty and valid after {payload['coverage']['topologyRepairs']} documented topology repair, and each is held fixed across the long climate record.\n\n"
        "This closes the geometry-identity gate only. Administrative coverage is not harm reach, and the crosswalk changes zero TULIP axes and zero scores. "
        "The next gate is the 1950–2022 ERA5-Land regional temperature reconstruction and an independent pattern comparison.\n"
    )
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "geometry": str(GEOMETRY_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "coverage": payload["coverage"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
