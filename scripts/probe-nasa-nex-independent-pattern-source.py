#!/usr/bin/env python3
"""Probe the NASA NEX-GDDP-CMIP6 route for an independent pattern check."""

from __future__ import annotations

from datetime import date
import hashlib
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET

import numpy as np
import requests

from lib.netcdf3 import Dataset


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-source-probe.json"
REPORT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-source-probe-report.md"
CATALOG_ROOT = "https://ds.nccs.nasa.gov/thredds/catalog/AMES/NEX/GDDP-CMIP6"
NCSS_ROOT = "https://ds.nccs.nasa.gov/thredds/ncss/grid/AMES/NEX/GDDP-CMIP6"
NAMESPACE = {
    "t": "http://www.unidata.ucar.edu/namespaces/thredds/InvCatalog/v1.0",
    "x": "http://www.w3.org/1999/xlink",
}


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def logical_data_sha256(dataset: Dataset, names: tuple[str, ...]) -> str:
    value = hashlib.sha256()
    for name in names:
        array = dataset.read(name, decode=False)
        value.update(json.dumps({
            "name": name,
            "shape": list(array.shape),
            "dtype": array.dtype.str,
        }, sort_keys=True, separators=(",", ":")).encode())
        value.update(array.tobytes(order="C"))
    return value.hexdigest()


def get(session: requests.Session, url: str) -> requests.Response:
    response = session.get(url, timeout=300)
    response.raise_for_status()
    return response


def catalogue_models(session: requests.Session) -> list[str]:
    response = get(session, f"{CATALOG_ROOT}/catalog.xml")
    root = ET.fromstring(response.content)
    values = [
        item.attrib[f"{{{NAMESPACE['x']}}}title"]
        for item in root.findall(".//t:catalogRef", NAMESPACE)
    ]
    if len(values) != 35 or len(set(values)) != 35:
        raise RuntimeError(f"Expected 35 unique NASA NEX models; received {len(values)}")
    return values


def probe_file_path(session: requests.Session, variable: str = "tas") -> str:
    relative = f"ACCESS-CM2/historical/r1i1p1f1/{variable}/catalog.xml"
    root = ET.fromstring(get(session, f"{CATALOG_ROOT}/{relative}").content)
    matches = [
        item.attrib["urlPath"]
        for item in root.findall(".//t:dataset", NAMESPACE)
        if item.attrib.get("name", "").startswith(
            f"{variable}_day_ACCESS-CM2_historical_r1i1p1f1_gn_1950_"
        )
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one ACCESS-CM2 1950 {variable} file; received {len(matches)}"
        )
    prefix = "AMES/NEX/GDDP-CMIP6/"
    if not matches[0].startswith(prefix):
        raise RuntimeError(f"Unexpected NCCS dataset path {matches[0]}")
    return matches[0][len(prefix):]


def download_identity_variable(
    session: requests.Session,
    source_path: str,
    variable: str,
    output: Path,
) -> dict:
    """Download one small, shared grid window for a tas/min/max identity check."""
    start = date.fromisocalendar(1950, 22, 1)
    end = date.fromisocalendar(1950, 35, 7)
    params = {
        "var": variable,
        "north": "50.5",
        "south": "49.5",
        "west": "9.5",
        "east": "10.5",
        "horizStride": "1",
        "time_start": f"{start.isoformat()}T12:00:00Z",
        "time_end": f"{end.isoformat()}T12:00:00Z",
        "accept": "netcdf3",
        "addLatLon": "true",
    }
    response = get(session, f"{NCSS_ROOT}/{source_path}?{requests.compat.urlencode(params)}")
    output.write_bytes(response.content)
    return {
        "url": response.url,
        "bytes": output.stat().st_size,
        "logicalDataSha256": None,
    }


def download_probe(session: requests.Session, source_path: str, output: Path) -> dict:
    start = date.fromisocalendar(1950, 22, 1)
    end = date.fromisocalendar(1950, 35, 7)
    params = {
        "var": "tas",
        "north": "72",
        "south": "34",
        "west": "-25",
        "east": "45",
        "horizStride": "1",
        "time_start": f"{start.isoformat()}T12:00:00Z",
        "time_end": f"{end.isoformat()}T12:00:00Z",
        "accept": "netcdf3",
        "addLatLon": "true",
    }
    url = f"{NCSS_ROOT}/{source_path}"
    with session.get(url, params=params, timeout=300, stream=True) as response:
        response.raise_for_status()
        with output.open("wb") as handle:
            for chunk in response.iter_content(1024 * 1024):
                handle.write(chunk)
        return {
            "url": response.url,
            "contentType": response.headers.get("Content-Type"),
            "contentLength": int(response.headers.get("Content-Length", output.stat().st_size)),
            "contentDisposition": response.headers.get("Content-Disposition"),
            "requestedStart": start.isoformat(),
            "requestedEnd": end.isoformat(),
        }


def main() -> None:
    with requests.Session() as session:
        session.headers["User-Agent"] = "TULIP-independent-pattern-source-probe/1.0"
        models = catalogue_models(session)
        source_path = probe_file_path(session)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "probe.nc"
            source = download_probe(session, source_path, path)
            with Dataset(path) as dataset:
                longitude = dataset.read("lon")
                latitude = dataset.read("lat")
                time = dataset.read("time")
                temperature = dataset.read("tas")
                variable = dataset.variables["tas"]
                if dataset.shape("tas") != (98, 153, 281):
                    raise RuntimeError(f"Unexpected NASA probe shape {dataset.shape('tas')}")
                if not np.isfinite(temperature).any():
                    raise RuntimeError("NASA probe contains no finite temperature values")
                identity_arrays = {}
                identity_sources = {}
                identity_attributes = {}
                for identity_variable in ("tas", "tasmin", "tasmax"):
                    identity_path = Path(directory) / f"identity-{identity_variable}.nc"
                    identity_source = download_identity_variable(
                        session,
                        probe_file_path(session, identity_variable),
                        identity_variable,
                        identity_path,
                    )
                    with Dataset(identity_path) as identity_dataset:
                        identity_array = identity_dataset.read(identity_variable)
                        identity_source["logicalDataSha256"] = logical_data_sha256(
                            identity_dataset,
                            ("lon", "lat", "time", identity_variable),
                        )
                        identity_arrays[identity_variable] = identity_array
                        identity_attributes[identity_variable] = identity_dataset.variables[
                            identity_variable
                        ].attributes
                    identity_sources[identity_variable] = identity_source

                midpoint = (identity_arrays["tasmin"] + identity_arrays["tasmax"]) / 2
                finite = np.isfinite(identity_arrays["tas"]) & np.isfinite(midpoint)
                if not finite.any():
                    raise RuntimeError("NASA temperature-identity probe has no comparable cells")
                midpoint_difference = identity_arrays["tas"][finite] - midpoint[finite]
                tasmax_difference = identity_arrays["tas"][finite] - identity_arrays["tasmax"][finite]
                maximum_midpoint_error = float(np.max(np.abs(midpoint_difference)))
                if maximum_midpoint_error > 0.00002:
                    raise RuntimeError(
                        "NASA tas is not the tasmin/tasmax midpoint within the predeclared "
                        f"floating-point tolerance: {maximum_midpoint_error} K"
                    )

                payload = {
                    "version": "tulip_nasa_nex_gddp_cmip6_independent_pattern_source_probe_2026_09_26_v2",
                    "preparedOn": "2026-09-26",
                    "status": "daily_exact_week_independent_model_route_reachable_temperature_identity_resolved",
                    "productionRatingsEnabled": 0,
                    "purpose": "Verify that the NASA NCCS subset service can supply an exact ISO-week CMIP6 temperature challenge without installing a new data-reading package.",
                    "sources": {
                        "nasaDataset": "https://www.nccs.nasa.gov/data-collections/nex-gddp-cmip6/",
                        "datasetPaper": "https://doi.org/10.1038/s41597-022-01393-4",
                        "catalogue": f"{CATALOG_ROOT}/catalog.xml",
                        "probeObject": source,
                    },
                    "catalogue": {
                        "modelCount": len(models),
                        "models": models,
                        "selectionRule": "Audit all catalogue models for a matching historical and SSP2-4.5 member before looking at agreement with ERA5-Land.",
                    },
                    "probe": {
                        "model": "ACCESS-CM2",
                        "member": "r1i1p1f1",
                        "experiment": "historical",
                        "year": 1950,
                        "variable": "tas",
                        "isoWeeks": [22, 35],
                        "expectedDays": 98,
                        "boundingBox": [-25, 34, 45, 72],
                        "mainlandOnly": True,
                        "formatVersion": dataset.format_version,
                        "dimensions": {item.name: item.size for item in dataset.dimensions},
                        "temperatureShape": list(temperature.shape),
                        "finiteTemperatureCells": int(np.isfinite(temperature).sum()),
                        "missingTemperatureCells": int(np.isnan(temperature).sum()),
                        "minimumTemperatureK": float(np.nanmin(temperature)),
                        "maximumTemperatureK": float(np.nanmax(temperature)),
                        "longitudeRange": [float(longitude.min()), float(longitude.max())],
                        "latitudeRange": [float(latitude.min()), float(latitude.max())],
                        "timeRange": [float(time.min()), float(time.max())],
                        "fileBytes": path.stat().st_size,
                        "fileSha256": file_sha256(path),
                        "logicalDataSha256": logical_data_sha256(dataset, ("lon", "lat", "time", "tas")),
                        "variableAttributes": variable.attributes,
                    },
                    "metadataReview": {
                        "status": "resolved_as_daily_midpoint_with_metadata_defect_recorded",
                        "flag": "The tas cell_methods value says time: maximum, but the values equal (tasmin + tasmax) / 2 to floating-point precision and differ materially from tasmax. Treat tas as a daily temperature midpoint, not a daily maximum or a true 24-hour mean.",
                        "identityBoundary": "The NCCS subset service writes a request-time translation timestamp into the NetCDF header, so the raw file checksum can change across equivalent requests. Use logicalDataSha256 over the four raw variable arrays for repeatability checks.",
                        "temperatureIdentityProbe": {
                            "model": "ACCESS-CM2",
                            "member": "r1i1p1f1",
                            "experiment": "historical",
                            "year": 1950,
                            "isoWeeks": [22, 35],
                            "boundingBox": [9.5, 49.5, 10.5, 50.5],
                            "shape": list(identity_arrays["tas"].shape),
                            "comparableCells": int(finite.sum()),
                            "formula": "tas = (tasmin + tasmax) / 2",
                            "maximumAbsoluteMidpointDifferenceK": maximum_midpoint_error,
                            "meanAbsoluteMidpointDifferenceK": float(
                                np.mean(np.abs(midpoint_difference))
                            ),
                            "meanAbsoluteTasToTasmaxDifferenceK": float(
                                np.mean(np.abs(tasmax_difference))
                            ),
                            "acceptanceToleranceK": 0.00002,
                            "passed": True,
                            "sources": identity_sources,
                            "variableAttributes": identity_attributes,
                        },
                    },
                    "decision": {
                        "axesAdmitted": 0,
                        "scoresChanged": 0,
                        "nextGate": "Use tas only as the empirically verified daily midpoint, construct grid-specific weights for all 971 regions including overseas regions, obtain compatible model-global predictors, and execute the predeclared comparison only after the ERA5-Land record is complete.",
                    },
                }
                payload["digest"] = canonical_digest(payload)

    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT.write_text(
        "# NASA NEX-GDDP-CMIP6 independent-pattern source probe\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The NCCS catalogue exposes {payload['catalogue']['modelCount']} models. The ACCESS-CM2 1950 "
        f"probe returned {payload['probe']['temperatureShape'][0]} exact-week days on a "
        f"{payload['probe']['temperatureShape'][1]} × {payload['probe']['temperatureShape'][2]} grid "
        f"({payload['probe']['fileBytes']:,} bytes), with "
        f"{payload['probe']['finiteTemperatureCells']:,} finite land values.\n\n"
        "The route is reachable and the dependency-free NetCDF reader decoded the response. A logical checksum covers the coordinate and temperature arrays because the service writes a request-time translation timestamp into the file header. The tas cell-method metadata is defective, but an independent value check confirms that tas is the midpoint of daily tasmin and tasmax to within 0.00002 K and is not tasmax. The NASA challenge therefore uses the more precise term daily midpoint. Overseas-region grids and model-global-temperature predictors remain explicit gates. Zero TULIP axes and zero scores change.\n"
    )
    print(json.dumps({
        "output": str(OUTPUT.relative_to(ROOT)),
        "status": payload["status"],
        "modelCount": payload["catalogue"]["modelCount"],
        "probe": payload["probe"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
