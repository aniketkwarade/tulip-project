"""Small read-only NetCDF classic/CDF-2 reader used by TULIP data audits.

The repository intentionally keeps this dependency-free. It supports the
numeric, non-record variables returned by the NASA NCCS NetCDF Subset Service
and rejects features it does not understand instead of guessing.
"""

from __future__ import annotations

from dataclasses import dataclass
import mmap
from pathlib import Path
import struct
from typing import Any

import numpy as np


NC_DIMENSION = 10
NC_VARIABLE = 11
NC_ATTRIBUTE = 12

TYPE_INFO = {
    1: (">i1", 1),
    2: ("S1", 1),
    3: (">i2", 2),
    4: (">i4", 4),
    5: (">f4", 4),
    6: (">f8", 8),
}


class NetCDF3Error(RuntimeError):
    """Raised when a classic NetCDF file violates the supported boundary."""


@dataclass(frozen=True)
class Dimension:
    name: str
    size: int
    unlimited: bool


@dataclass(frozen=True)
class Variable:
    name: str
    dimension_ids: tuple[int, ...]
    attributes: dict[str, Any]
    type_id: int
    value_bytes: int
    offset: int


class _HeaderReader:
    def __init__(self, data: mmap.mmap, offset: int = 0):
        self.data = data
        self.offset = offset

    def take(self, length: int) -> bytes:
        end = self.offset + length
        if end > len(self.data):
            raise NetCDF3Error("NetCDF header ends unexpectedly")
        value = self.data[self.offset:end]
        self.offset = end
        return value

    def u32(self) -> int:
        return struct.unpack(">I", self.take(4))[0]

    def u64(self) -> int:
        return struct.unpack(">Q", self.take(8))[0]

    def padded(self, length: int) -> bytes:
        value = self.take(length)
        padding = (-length) % 4
        if padding:
            self.take(padding)
        return value

    def name(self) -> str:
        length = self.u32()
        try:
            return self.padded(length).decode("utf-8")
        except UnicodeDecodeError as error:
            raise NetCDF3Error("NetCDF name is not valid UTF-8") from error


def _scalar_or_list(values: np.ndarray, type_id: int) -> Any:
    if type_id == 2:
        return values.tobytes().decode("utf-8", errors="strict").rstrip("\x00")
    native = values.astype(values.dtype.newbyteorder("="), copy=False)
    converted = native.tolist()
    return converted[0] if len(converted) == 1 else converted


def _read_attributes(reader: _HeaderReader) -> dict[str, Any]:
    tag = reader.u32()
    if tag == 0:
        if reader.u32() != 0:
            raise NetCDF3Error("Malformed empty NetCDF attribute list")
        return {}
    if tag != NC_ATTRIBUTE:
        raise NetCDF3Error(f"Unexpected NetCDF attribute-list tag {tag}")
    count = reader.u32()
    attributes: dict[str, Any] = {}
    for _ in range(count):
        name = reader.name()
        type_id = reader.u32()
        element_count = reader.u32()
        if type_id not in TYPE_INFO:
            raise NetCDF3Error(f"Unsupported NetCDF attribute type {type_id}")
        dtype, width = TYPE_INFO[type_id]
        raw = reader.padded(element_count * width)
        values = np.frombuffer(raw, dtype=np.dtype(dtype), count=element_count)
        attributes[name] = _scalar_or_list(values, type_id)
    return attributes


class Dataset:
    """Read metadata and non-record numeric variables from a NetCDF3 file."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._handle = self.path.open("rb")
        self._data = mmap.mmap(self._handle.fileno(), 0, access=mmap.ACCESS_READ)
        self.format_version: int
        self.record_count: int
        self.dimensions: tuple[Dimension, ...]
        self.attributes: dict[str, Any]
        self.variables: dict[str, Variable]
        try:
            self._parse_header()
        except Exception:
            self.close()
            raise

    def _parse_header(self) -> None:
        reader = _HeaderReader(self._data)
        if reader.take(3) != b"CDF":
            raise NetCDF3Error("File is not a NetCDF classic family dataset")
        self.format_version = reader.take(1)[0]
        if self.format_version not in (1, 2):
            raise NetCDF3Error(f"Unsupported NetCDF format version {self.format_version}")
        self.record_count = reader.u32()

        dimension_tag = reader.u32()
        dimensions: list[Dimension] = []
        if dimension_tag == 0:
            if reader.u32() != 0:
                raise NetCDF3Error("Malformed empty NetCDF dimension list")
        elif dimension_tag == NC_DIMENSION:
            for _ in range(reader.u32()):
                name = reader.name()
                size = reader.u32()
                dimensions.append(Dimension(name, size, size == 0))
        else:
            raise NetCDF3Error(f"Unexpected NetCDF dimension-list tag {dimension_tag}")
        self.dimensions = tuple(dimensions)
        self.attributes = _read_attributes(reader)

        variable_tag = reader.u32()
        variables: dict[str, Variable] = {}
        if variable_tag == 0:
            if reader.u32() != 0:
                raise NetCDF3Error("Malformed empty NetCDF variable list")
        elif variable_tag == NC_VARIABLE:
            for _ in range(reader.u32()):
                name = reader.name()
                dimension_ids = tuple(reader.u32() for _ in range(reader.u32()))
                if any(index >= len(self.dimensions) for index in dimension_ids):
                    raise NetCDF3Error(f"Variable {name} references an unknown dimension")
                attributes = _read_attributes(reader)
                type_id = reader.u32()
                value_bytes = reader.u32()
                offset = reader.u64() if self.format_version == 2 else reader.u32()
                if type_id not in TYPE_INFO:
                    raise NetCDF3Error(f"Variable {name} uses unsupported type {type_id}")
                if name in variables:
                    raise NetCDF3Error(f"Duplicate NetCDF variable {name}")
                variables[name] = Variable(
                    name=name,
                    dimension_ids=dimension_ids,
                    attributes=attributes,
                    type_id=type_id,
                    value_bytes=value_bytes,
                    offset=offset,
                )
        else:
            raise NetCDF3Error(f"Unexpected NetCDF variable-list tag {variable_tag}")
        self.variables = variables

    def shape(self, name: str) -> tuple[int, ...]:
        variable = self.variables[name]
        shape = []
        for index in variable.dimension_ids:
            dimension = self.dimensions[index]
            shape.append(self.record_count if dimension.unlimited else dimension.size)
        return tuple(shape)

    def read(self, name: str, *, decode: bool = True) -> np.ndarray:
        variable = self.variables[name]
        shape = self.shape(name)
        if any(self.dimensions[index].unlimited for index in variable.dimension_ids):
            raise NetCDF3Error(f"Record variable {name} is outside this reader's supported boundary")
        dtype_name, width = TYPE_INFO[variable.type_id]
        element_count = int(np.prod(shape, dtype=np.int64)) if shape else 1
        required_bytes = element_count * width
        if required_bytes > variable.value_bytes or variable.offset + required_bytes > len(self._data):
            raise NetCDF3Error(f"Variable {name} exceeds its declared storage")
        values = np.frombuffer(
            self._data,
            dtype=np.dtype(dtype_name),
            count=element_count,
            offset=variable.offset,
        ).reshape(shape)
        if not decode or variable.type_id == 2:
            return values.copy()
        result = values.astype(np.float64)
        missing = variable.attributes.get("_FillValue", variable.attributes.get("missing_value"))
        if missing is not None:
            for value in np.atleast_1d(missing):
                result[result == float(value)] = np.nan
        if "scale_factor" in variable.attributes:
            result *= float(variable.attributes["scale_factor"])
        if "add_offset" in variable.attributes:
            result += float(variable.attributes["add_offset"])
        return result

    def close(self) -> None:
        data = getattr(self, "_data", None)
        if data is not None:
            data.close()
            self._data = None
        handle = getattr(self, "_handle", None)
        if handle is not None:
            handle.close()
            self._handle = None

    def __enter__(self) -> "Dataset":
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        self.close()

