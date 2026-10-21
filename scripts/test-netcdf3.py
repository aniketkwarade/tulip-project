#!/usr/bin/env python3
"""Regression tests for the dependency-free NetCDF3 reader."""

from __future__ import annotations

import struct
import tempfile
from pathlib import Path

import numpy as np

from lib.netcdf3 import Dataset


NC_DIMENSION = 10
NC_VARIABLE = 11
NC_ATTRIBUTE = 12


def u32(value: int) -> bytes:
    return struct.pack(">I", value)


def padded(value: bytes) -> bytes:
    return value + b"\0" * ((-len(value)) % 4)


def name(value: str) -> bytes:
    encoded = value.encode()
    return u32(len(encoded)) + padded(encoded)


def attributes(values: list[tuple[str, int, bytes, int]]) -> bytes:
    if not values:
        return u32(0) + u32(0)
    result = u32(NC_ATTRIBUTE) + u32(len(values))
    for attribute_name, type_id, raw, count in values:
        result += name(attribute_name) + u32(type_id) + u32(count) + padded(raw)
    return result


def variable(
    variable_name: str,
    dimension_ids: tuple[int, ...],
    type_id: int,
    raw: bytes,
    offset: int,
    attrs: list[tuple[str, int, bytes, int]] | None = None,
) -> bytes:
    result = name(variable_name) + u32(len(dimension_ids))
    result += b"".join(u32(value) for value in dimension_ids)
    result += attributes(attrs or []) + u32(type_id) + u32(len(raw)) + u32(offset)
    return result


def build_fixture() -> bytes:
    x_values = struct.pack(">2d", 1.5, 2.5)
    y_values = struct.pack(">2i", 10, 20)
    temperature_values = struct.pack(">4h", 1, 2, -9999, 4)
    temperature_attrs = [
        ("_FillValue", 3, struct.pack(">h", -9999), 1),
        ("scale_factor", 6, struct.pack(">d", 0.5), 1),
        ("add_offset", 6, struct.pack(">d", 10.0), 1),
        ("units", 2, b"C", 1),
    ]

    def header(offsets: tuple[int, int, int]) -> bytes:
        result = b"CDF\x01" + u32(0)
        result += u32(NC_DIMENSION) + u32(2) + name("y") + u32(2) + name("x") + u32(2)
        result += attributes([("title", 2, b"fixture", 7)])
        result += u32(NC_VARIABLE) + u32(3)
        result += variable("x", (1,), 6, x_values, offsets[0], [("units", 2, b"degrees_east", 12)])
        result += variable("y", (0,), 4, y_values, offsets[1])
        result += variable("temperature", (0, 1), 3, temperature_values, offsets[2], temperature_attrs)
        return result

    provisional = header((0, 0, 0))
    offsets = [len(provisional)]
    offsets.append(offsets[-1] + len(padded(x_values)))
    offsets.append(offsets[-1] + len(padded(y_values)))
    final_header = header(tuple(offsets))
    assert len(final_header) == len(provisional)
    return final_header + padded(x_values) + padded(y_values) + padded(temperature_values)


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "fixture.nc"
        path.write_bytes(build_fixture())
        with Dataset(path) as dataset:
            assert dataset.format_version == 1
            assert dataset.record_count == 0
            assert [(item.name, item.size) for item in dataset.dimensions] == [("y", 2), ("x", 2)]
            assert dataset.attributes["title"] == "fixture"
            assert dataset.shape("temperature") == (2, 2)
            np.testing.assert_allclose(dataset.read("x"), [1.5, 2.5])
            np.testing.assert_allclose(dataset.read("y"), [10, 20])
            decoded = dataset.read("temperature")
            np.testing.assert_allclose(decoded[[0, 0, 1], [0, 1, 1]], [10.5, 11.0, 12.0])
            assert np.isnan(decoded[1, 0])
            raw = dataset.read("temperature", decode=False)
            np.testing.assert_array_equal(raw, [[1, 2], [-9999, 4]])
    print("NetCDF3 reader passed: classic dimensions, attributes, numeric values, missing data and scale/offset decoding validated.")


if __name__ == "__main__":
    main()

