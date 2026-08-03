#!/usr/bin/env python3
"""Join LostPlanet's OSM data-center points to WRI Aqueduct 4.0 polygons.

Requires pyogrio, shapely, and numpy. The Aqueduct File Geodatabase path and
output path are explicit arguments so the large licensed source archive never
needs to be committed to the repository.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pyogrio
from shapely import STRtree, from_wkb, points


FIELDS = [
    "string_id",
    "pfaf_id",
    "gid_0",
    "gid_1",
    "name_0",
    "name_1",
    "area_km2",
    "bws_raw",
    "bws_score",
    "bws_cat",
    "bws_label",
    "bwd_raw",
    "bwd_score",
    "bwd_cat",
    "bwd_label",
    "iav_raw",
    "iav_score",
    "iav_cat",
    "iav_label",
    "sev_raw",
    "sev_score",
    "sev_cat",
    "sev_label",
    "drr_raw",
    "drr_score",
    "drr_cat",
    "drr_label",
    "w_awr_elp_qan_raw",
    "w_awr_elp_qan_score",
    "w_awr_elp_qan_cat",
    "w_awr_elp_qan_label",
    "w_awr_elp_tot_raw",
    "w_awr_elp_tot_score",
    "w_awr_elp_tot_cat",
    "w_awr_elp_tot_label",
    "w_awr_elp_tot_weight_fraction",
]

SOURCE_DOWNLOAD = "https://files.wri.org/aqueduct/aqueduct-4-0-water-risk-data.zip"
SOURCE_PAGE = "https://www.wri.org/data/aqueduct-global-maps-40-data"
TECHNICAL_NOTE = "https://doi.org/10.46830/writn.23.00061"


def json_value(value):
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
        return None
    if value in (-9999, -9999.0):
        return None
    return value


def row_from_columns(fields, columns, row_index):
    return {field: json_value(columns[column_index][row_index]) for column_index, field in enumerate(fields)}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--facilities", required=True, type=Path)
    parser.add_argument("--aqueduct-gdb", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main():
    args = parse_args()
    facility_snapshot = json.loads(args.facilities.read_text())
    facilities = facility_snapshot["records"]

    metadata, _, geometry_wkb, columns = pyogrio.raw.read(
        args.aqueduct_gdb,
        layer="baseline_annual",
        columns=FIELDS,
    )
    if metadata["crs"] != "EPSG:4326":
        raise RuntimeError(f"Expected Aqueduct EPSG:4326 geometry, got {metadata['crs']}")
    source_fields = metadata["fields"].tolist()
    if set(source_fields) != set(FIELDS):
        raise RuntimeError(f"Unexpected Aqueduct fields: {source_fields}")

    geometries = from_wkb(geometry_wkb)
    tree = STRtree(geometries)
    facility_points = points(
        [record["coordinates"]["longitude"] for record in facilities],
        [record["coordinates"]["latitude"] for record in facilities],
    )
    pairs = tree.query(facility_points, predicate="within")

    polygon_candidates_by_facility: dict[int, list[int]] = {}
    for facility_index, polygon_index in zip(pairs[0], pairs[1]):
        polygon_candidates_by_facility.setdefault(int(facility_index), []).append(int(polygon_index))

    records = []
    multiple_match_count = 0
    for facility_index, facility in enumerate(facilities):
        candidates = polygon_candidates_by_facility.get(facility_index, [])
        if len(candidates) > 1:
            multiple_match_count += 1
        if candidates:
            # Aqueduct polygons are basin/admin intersections. Boundary artifacts
            # can overlap; the smallest polygon is the most spatially specific.
            polygon_index = min(
                candidates,
                key=lambda index: json_value(columns[source_fields.index("area_km2")][index]) or float("inf"),
            )
            aqueduct = row_from_columns(source_fields, columns, polygon_index)
            match = {
                "status": "matched",
                "method": "point_within_aqueduct_baseline_annual_polygon",
                "candidate_polygon_count": len(candidates),
                "aqueduct": aqueduct,
            }
        else:
            match = {
                "status": "unmatched",
                "method": "point_within_aqueduct_baseline_annual_polygon",
                "candidate_polygon_count": 0,
                "aqueduct": None,
            }

        records.append(
            {
                "facility_record_id": facility["record_id"],
                "longitude": facility["coordinates"]["longitude"],
                "latitude": facility["coordinates"]["latitude"],
                "match": match,
            }
        )

    matched_count = sum(record["match"]["status"] == "matched" for record in records)
    output = {
        "version": "aqueduct_4_0_data_center_join_v1",
        "captured_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "facility_source": {
            "id": facility_snapshot["source"]["id"],
            "captured_at": facility_snapshot["captured_at"],
            "record_count": len(facilities),
        },
        "source": {
            "id": "wri_aqueduct_4_baseline_annual",
            "name": "WRI Aqueduct 4.0 Baseline Annual",
            "dataset_page": SOURCE_PAGE,
            "download_url": SOURCE_DOWNLOAD,
            "technical_note": TECHNICAL_NOTE,
            "source_release": "Aqueduct40_waterrisk_download_Y2023M07D05",
            "layer": "baseline_annual",
            "license": "Creative Commons Attribution 4.0",
            "license_url": "https://creativecommons.org/licenses/by/4.0/",
            "attribution": "World Resources Institute, Aqueduct 4.0",
        },
        "summary": {
            "facility_count": len(facilities),
            "matched_facility_count": matched_count,
            "unmatched_facility_count": len(facilities) - matched_count,
            "match_coverage_pct": round(matched_count / len(facilities) * 100, 2),
            "facilities_with_multiple_polygon_candidates": multiple_match_count,
            "aqueduct_polygon_count": len(geometries),
        },
        "methodology": {
            "join": "Facility WGS84 point within Aqueduct 4.0 baseline-annual polygon using an STRtree spatial index.",
            "overlap_resolution": "When more than one source polygon contains a point, retain the polygon with the smallest source-reported area and expose the candidate count.",
            "water_stress_boundary": "Baseline water stress is modeled competition for available water, not facility water withdrawal, consumption, permit status, or causal impact.",
            "overall_risk_boundary": "Electric-power weighting is retained as contextual sensitivity only. It is not a data-center-specific weighting scheme.",
            "missingness": "Offshore points, geometry gaps, and invalid facility coordinates remain unmatched; missing Aqueduct values remain null and are never converted to zero.",
        },
        "records": records,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(
        f"Wrote {matched_count}/{len(facilities)} Aqueduct facility matches "
        f"({output['summary']['match_coverage_pct']}%) to {args.output}"
    )


if __name__ == "__main__":
    main()
