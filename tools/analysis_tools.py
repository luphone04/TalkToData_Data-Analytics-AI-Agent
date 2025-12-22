"""
Analysis tools for the Data Analysis Agent.
Handles statistical analysis, filtering, grouping, and correlations.
"""

import pandas as pd
from agents import function_tool

# Import the shared dataset registry
from . import LOADED_DATASETS


def _get_loaded_df(filename: str) -> tuple[pd.DataFrame | None, str]:
    """
    Get a loaded DataFrame or return an error message.
    Returns (df, error_message). If df is None, error_message explains why.
    """
    df = LOADED_DATASETS.get(filename)
    if df is None:
        return None, f"Error: '{filename}' is not loaded. Use load_dataset('{filename}') first."
    return df, ""


# ============================================================
# Implementation functions (callable for testing)
# ============================================================

def _describe_data(filename: str) -> str:
    """Get statistical summary of the dataset."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    result_lines = [f"Statistical summary for: {filename}", "=" * 60, ""]

    # Numeric columns
    numeric_df = df.select_dtypes(include=['number'])
    if not numeric_df.empty:
        result_lines.append("NUMERIC COLUMNS:")
        result_lines.append(numeric_df.describe().round(2).to_string())
        result_lines.append("")

    # Categorical columns
    categorical_df = df.select_dtypes(include=['object', 'category'])
    if not categorical_df.empty:
        result_lines.append("CATEGORICAL COLUMNS:")
        result_lines.append(categorical_df.describe().to_string())
        result_lines.append("")

    # Basic info
    result_lines.append(f"Total rows: {len(df)}")
    result_lines.append(f"Total columns: {len(df.columns)}")
    result_lines.append(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024:.1f} KB")

    return "\n".join(result_lines)


def _filter_data(filename: str, condition: str) -> str:
    """Filter data using a pandas query condition."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    try:
        filtered_df = df.query(condition)

        # Store filtered result in registry
        filtered_key = f"{filename}_filtered"
        LOADED_DATASETS[filtered_key] = filtered_df

        result_lines = [
            f"Filter applied: {condition}",
            "",
            f"Results: {len(filtered_df)} rows (from {len(df)} total)",
            "",
        ]

        if len(filtered_df) == 0:
            result_lines.append("No rows match the filter condition.")
        else:
            result_lines.append(f"Preview (first {min(5, len(filtered_df))} rows):")
            result_lines.append(filtered_df.head(5).to_string())
            result_lines.append("")
            result_lines.append(f"Filtered data saved as '{filtered_key}' for further analysis.")

        return "\n".join(result_lines)

    except pd.errors.UndefinedVariableError as e:
        return f"Error: Unknown column in condition. {str(e)}"
    except SyntaxError as e:
        return f"Error: Invalid filter syntax. Use pandas query syntax like: revenue > 1000 and region == 'West'"
    except Exception as e:
        return f"Error applying filter: {str(e)}"


def _group_by_analysis(filename: str, group_columns: str, value_column: str, aggregation: str) -> str:
    """Group data and apply aggregation."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    # Parse group columns
    group_cols = [col.strip() for col in group_columns.split(",")]

    # Validate columns exist
    missing_cols = [col for col in group_cols if col not in df.columns]
    if missing_cols:
        return f"Error: Column(s) not found: {', '.join(missing_cols)}. Available: {', '.join(df.columns)}"

    if value_column not in df.columns:
        return f"Error: Value column '{value_column}' not found. Available: {', '.join(df.columns)}"

    # Validate aggregation function
    valid_aggs = {"sum", "mean", "count", "min", "max", "median", "std"}
    agg_lower = aggregation.lower()
    if agg_lower not in valid_aggs:
        return f"Error: Invalid aggregation '{aggregation}'. Valid options: {', '.join(sorted(valid_aggs))}"

    try:
        # Perform groupby
        grouped = df.groupby(group_cols)[value_column].agg(agg_lower).reset_index()
        grouped.columns = list(group_cols) + [f"{value_column}_{agg_lower}"]

        # Sort by aggregated value descending
        grouped = grouped.sort_values(grouped.columns[-1], ascending=False)

        # Store result
        grouped_key = f"{filename}_grouped"
        LOADED_DATASETS[grouped_key] = grouped

        result_lines = [
            f"Group by: {', '.join(group_cols)}",
            f"Aggregation: {agg_lower}({value_column})",
            "",
            f"Results ({len(grouped)} groups):",
            grouped.to_string(index=False),
            "",
            f"Grouped data saved as '{grouped_key}' for further analysis.",
        ]

        return "\n".join(result_lines)

    except Exception as e:
        return f"Error during groupby: {str(e)}"


def _get_value_counts(filename: str, column: str) -> str:
    """Get frequency counts for a column."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    if column not in df.columns:
        return f"Error: Column '{column}' not found. Available: {', '.join(df.columns)}"

    try:
        counts = df[column].value_counts()
        total = len(df)

        result_lines = [
            f"Value counts for: {column}",
            "=" * 40,
            "",
        ]

        # Show top 20
        display_counts = counts.head(20)
        for value, count in display_counts.items():
            pct = 100 * count / total
            result_lines.append(f"  {value}: {count} ({pct:.1f}%)")

        if len(counts) > 20:
            result_lines.append(f"  ... and {len(counts) - 20} more unique values")

        result_lines.append("")
        result_lines.append(f"Total unique values: {len(counts)}")
        result_lines.append(f"Total rows: {total}")

        return "\n".join(result_lines)

    except Exception as e:
        return f"Error getting value counts: {str(e)}"


def _calculate_correlation(filename: str) -> str:
    """Calculate correlation matrix for numeric columns."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    # Select only numeric columns
    numeric_df = df.select_dtypes(include=['number'])

    if numeric_df.empty:
        return f"Error: No numeric columns found in '{filename}'."

    if len(numeric_df.columns) < 2:
        return f"Error: Need at least 2 numeric columns for correlation. Found: {list(numeric_df.columns)}"

    try:
        corr_matrix = numeric_df.corr().round(3)

        result_lines = [
            f"Correlation matrix for: {filename}",
            f"Numeric columns: {', '.join(numeric_df.columns)}",
            "=" * 60,
            "",
            corr_matrix.to_string(),
            "",
            "Interpretation:",
            "  1.0 = perfect positive correlation",
            "  0.0 = no correlation",
            " -1.0 = perfect negative correlation",
        ]

        # Highlight strong correlations (excluding self-correlations)
        strong_corrs = []
        for i, col1 in enumerate(corr_matrix.columns):
            for j, col2 in enumerate(corr_matrix.columns):
                if i < j:  # Only upper triangle
                    val = corr_matrix.loc[col1, col2]
                    if abs(val) >= 0.7:
                        strength = "strong positive" if val > 0 else "strong negative"
                        strong_corrs.append(f"  {col1} vs {col2}: {val:.3f} ({strength})")

        if strong_corrs:
            result_lines.append("")
            result_lines.append("Notable correlations (|r| >= 0.7):")
            result_lines.extend(strong_corrs)

        return "\n".join(result_lines)

    except Exception as e:
        return f"Error calculating correlation: {str(e)}"


# ============================================================
# Function tools for the agent (wrappers with proper docstrings)
# ============================================================

@function_tool
def describe_data(filename: str) -> str:
    """
    Get statistical summary of the dataset including count, mean, std, min, max for numeric columns
    and count, unique, top, freq for categorical columns.

    Args:
        filename: Name of a previously loaded file.

    Returns:
        Formatted statistical summary of all columns.
    """
    return _describe_data(filename)


@function_tool
def filter_data(filename: str, condition: str) -> str:
    """
    Filter data using a pandas query condition and save the result.

    Args:
        filename: Name of a previously loaded file.
        condition: A pandas query string. Examples:
            - "revenue > 1000"
            - "region == 'West'"
            - "revenue > 1000 and region == 'West'"
            - "quantity >= 50 or revenue > 2000"

    Returns:
        Filter results with row count and preview. Filtered data is saved as '{filename}_filtered'.
    """
    return _filter_data(filename, condition)


@function_tool
def group_by_analysis(filename: str, group_columns: str, value_column: str, aggregation: str) -> str:
    """
    Group data by one or more columns and calculate an aggregate statistic.

    Args:
        filename: Name of a previously loaded file.
        group_columns: Column(s) to group by, comma-separated. Example: "region" or "region,product"
        value_column: Column to aggregate. Example: "revenue"
        aggregation: Aggregation function: sum, mean, count, min, max, median, or std

    Returns:
        Grouped results sorted by the aggregated value. Result saved as '{filename}_grouped'.
    """
    return _group_by_analysis(filename, group_columns, value_column, aggregation)


@function_tool
def get_value_counts(filename: str, column: str) -> str:
    """
    Get frequency counts for unique values in a column.

    Args:
        filename: Name of a previously loaded file.
        column: Column to count values for.

    Returns:
        Value counts with percentages, limited to top 20 values.
    """
    return _get_value_counts(filename, column)


@function_tool
def calculate_correlation(filename: str) -> str:
    """
    Calculate the correlation matrix for all numeric columns in the dataset.

    Args:
        filename: Name of a previously loaded file.

    Returns:
        Correlation matrix with interpretation guide and notable correlations.
    """
    return _calculate_correlation(filename)
