"""
Tools package for Data Analysis Agent.
Contains file, analysis, and visualization tools.
"""

from collections.abc import Iterator, MutableMapping
from contextlib import contextmanager
from contextvars import ContextVar

import pandas as pd

# Process-wide datasets, used when no request scope is active (the terminal app).
_PROCESS_DATASETS: dict[str, pd.DataFrame] = {}

# Datasets for the current web request. The Agents SDK runs sync tools through
# asyncio.to_thread, which copies the caller's context, so tools see this value.
_REQUEST_DATASETS: ContextVar[dict[str, pd.DataFrame] | None] = ContextVar(
    "request_datasets", default=None
)


class _DatasetRegistry(MutableMapping):
    """Dict-like view of the active dataset store (request-scoped or process-wide)."""

    @staticmethod
    def _store() -> dict[str, pd.DataFrame]:
        store = _REQUEST_DATASETS.get()
        return _PROCESS_DATASETS if store is None else store

    def __getitem__(self, key: str) -> pd.DataFrame:
        return self._store()[key]

    def __setitem__(self, key: str, value: pd.DataFrame) -> None:
        self._store()[key] = value

    def __delitem__(self, key: str) -> None:
        del self._store()[key]

    def __iter__(self) -> Iterator[str]:
        return iter(list(self._store()))

    def __len__(self) -> int:
        return len(self._store())


# Registry shared by all tools. Inside request_datasets() it only contains that
# request's datasets (including derived ones such as "<file>_filtered").
LOADED_DATASETS = _DatasetRegistry()


@contextmanager
def request_datasets():
    """Give the enclosed code (and tools it runs) a fresh, private dataset store."""
    token = _REQUEST_DATASETS.set({})
    try:
        yield
    finally:
        _REQUEST_DATASETS.reset(token)


def get_dataset(filename: str) -> pd.DataFrame | None:
    """Get a dataset from the registry."""
    return LOADED_DATASETS.get(filename)


def set_dataset(filename: str, df: pd.DataFrame) -> None:
    """Store a dataset in the registry."""
    LOADED_DATASETS[filename] = df


# File tools
from .file_tools import list_data_files, load_dataset, get_column_info

# Analysis tools
from .analysis_tools import (
    describe_data,
    filter_data,
    group_by_analysis,
    get_value_counts,
    calculate_correlation,
)

# Visualization tools
from .viz_tools import (
    create_bar_chart,
    create_line_chart,
    create_histogram,
    create_scatter_plot,
    create_pie_chart,
)

__all__ = [
    # Registry
    "LOADED_DATASETS",
    "request_datasets",
    "get_dataset",
    "set_dataset",
    # File tools
    "list_data_files",
    "load_dataset",
    "get_column_info",
    # Analysis tools
    "describe_data",
    "filter_data",
    "group_by_analysis",
    "get_value_counts",
    "calculate_correlation",
    # Visualization tools
    "create_bar_chart",
    "create_line_chart",
    "create_histogram",
    "create_scatter_plot",
    "create_pie_chart",
]
