"""
Tools package for Data Analysis Agent.
Contains file, analysis, and visualization tools.
"""

import pandas as pd

# Global registry for loaded datasets
# All tools share this dict to avoid reloading files
LOADED_DATASETS: dict[str, pd.DataFrame] = {}


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
