"""
Visualization tools for the Data Analysis Agent.
Generates and saves matplotlib charts to the output directory.
"""

import os
from datetime import datetime
from pathlib import Path

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for saving files
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from agents import function_tool

# Import the shared dataset registry
from . import LOADED_DATASETS

# Output directory for charts
OUTPUT_DIR = Path(__file__).parent.parent / "output"


def _get_loaded_df(filename: str) -> tuple[pd.DataFrame | None, str]:
    """Get a loaded DataFrame or return an error message."""
    df = LOADED_DATASETS.get(filename)
    if df is None:
        return None, f"Error: '{filename}' is not loaded. Use load_dataset('{filename}') first."
    return df, ""


def _save_chart(title: str) -> str:
    """Save the current matplotlib figure and return the file path."""
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Create safe filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c if c.isalnum() or c in "_ -" else "_" for c in title)
    safe_title = safe_title.replace(" ", "_").lower()[:50]
    filename = f"{safe_title}_{timestamp}.png"
    filepath = OUTPUT_DIR / filename

    # Save and close
    plt.savefig(filepath, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()

    return str(filepath)


def _setup_chart_style():
    """Apply consistent chart styling."""
    try:
        plt.style.use('seaborn-v0_8-whitegrid')
    except OSError:
        # Fallback for older matplotlib versions
        try:
            plt.style.use('seaborn-whitegrid')
        except OSError:
            plt.style.use('ggplot')


# ============================================================
# Implementation functions (callable for testing)
# ============================================================

def _create_bar_chart(filename: str, x_column: str, y_column: str, title: str) -> str:
    """Create a bar chart with auto-aggregation."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    # Validate columns
    if x_column not in df.columns:
        return f"Error: Column '{x_column}' not found. Available: {', '.join(df.columns)}"
    if y_column not in df.columns:
        return f"Error: Column '{y_column}' not found. Available: {', '.join(df.columns)}"

    try:
        # Aggregate if there are duplicate x values
        if df[x_column].duplicated().any():
            plot_data = df.groupby(x_column)[y_column].sum().reset_index()
        else:
            plot_data = df[[x_column, y_column]].copy()

        # Sort by y value descending for better visualization
        plot_data = plot_data.sort_values(y_column, ascending=False)

        # Limit to top 15 for readability
        if len(plot_data) > 15:
            plot_data = plot_data.head(15)

        _setup_chart_style()
        fig, ax = plt.subplots(figsize=(10, 6))

        bars = ax.bar(plot_data[x_column].astype(str), plot_data[y_column], color='steelblue', edgecolor='white')

        ax.set_xlabel(x_column, fontsize=12)
        ax.set_ylabel(y_column, fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')

        # Rotate x labels if needed
        if len(plot_data) > 5 or plot_data[x_column].astype(str).str.len().max() > 8:
            plt.xticks(rotation=45, ha='right')

        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:,.0f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3), textcoords="offset points",
                       ha='center', va='bottom', fontsize=9)

        plt.tight_layout()
        filepath = _save_chart(title)

        return f"Bar chart created: {title}\nSaved to: {filepath}\nShows {y_column} by {x_column} ({len(plot_data)} categories)"

    except Exception as e:
        plt.close()
        return f"Error creating bar chart: {str(e)}"


def _create_line_chart(filename: str, x_column: str, y_column: str, title: str) -> str:
    """Create a line chart, sorting by x-axis."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    if x_column not in df.columns:
        return f"Error: Column '{x_column}' not found. Available: {', '.join(df.columns)}"
    if y_column not in df.columns:
        return f"Error: Column '{y_column}' not found. Available: {', '.join(df.columns)}"

    try:
        plot_data = df[[x_column, y_column]].copy()

        # Try to parse as datetime for proper sorting
        try:
            plot_data[x_column] = pd.to_datetime(plot_data[x_column])
            is_datetime = True
        except (ValueError, TypeError):
            is_datetime = False

        # Aggregate if duplicates exist
        if plot_data[x_column].duplicated().any():
            plot_data = plot_data.groupby(x_column)[y_column].sum().reset_index()

        # Sort by x
        plot_data = plot_data.sort_values(x_column)

        _setup_chart_style()
        fig, ax = plt.subplots(figsize=(12, 6))

        ax.plot(plot_data[x_column], plot_data[y_column],
                marker='o', markersize=4, linewidth=2, color='steelblue')

        ax.set_xlabel(x_column, fontsize=12)
        ax.set_ylabel(y_column, fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')

        # Format x-axis for dates
        if is_datetime:
            fig.autofmt_xdate()
        elif len(plot_data) > 10:
            plt.xticks(rotation=45, ha='right')

        # Add grid
        ax.grid(True, alpha=0.3)

        plt.tight_layout()
        filepath = _save_chart(title)

        return f"Line chart created: {title}\nSaved to: {filepath}\nShows {y_column} over {x_column} ({len(plot_data)} data points)"

    except Exception as e:
        plt.close()
        return f"Error creating line chart: {str(e)}"


def _create_histogram(filename: str, column: str, bins: int, title: str) -> str:
    """Create a histogram for distribution analysis."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    if column not in df.columns:
        return f"Error: Column '{column}' not found. Available: {', '.join(df.columns)}"

    # Validate column is numeric
    if not pd.api.types.is_numeric_dtype(df[column]):
        return f"Error: Column '{column}' is not numeric. Histograms require numeric data."

    try:
        data = df[column].dropna()

        if len(data) == 0:
            return f"Error: Column '{column}' has no non-null values."

        _setup_chart_style()
        fig, ax = plt.subplots(figsize=(10, 6))

        n, bin_edges, patches = ax.hist(data, bins=bins, color='steelblue',
                                         edgecolor='white', alpha=0.8)

        ax.set_xlabel(column, fontsize=12)
        ax.set_ylabel('Frequency', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')

        # Add statistics annotation
        stats_text = f'Mean: {data.mean():.2f}\nStd: {data.std():.2f}\nMin: {data.min():.2f}\nMax: {data.max():.2f}'
        ax.text(0.95, 0.95, stats_text, transform=ax.transAxes, fontsize=10,
                verticalalignment='top', horizontalalignment='right',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

        plt.tight_layout()
        filepath = _save_chart(title)

        return f"Histogram created: {title}\nSaved to: {filepath}\nDistribution of {column} ({len(data)} values, {bins} bins)"

    except Exception as e:
        plt.close()
        return f"Error creating histogram: {str(e)}"


def _create_scatter_plot(filename: str, x_column: str, y_column: str, title: str) -> str:
    """Create a scatter plot with optional trend line."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    if x_column not in df.columns:
        return f"Error: Column '{x_column}' not found. Available: {', '.join(df.columns)}"
    if y_column not in df.columns:
        return f"Error: Column '{y_column}' not found. Available: {', '.join(df.columns)}"

    # Validate numeric columns
    if not pd.api.types.is_numeric_dtype(df[x_column]):
        return f"Error: Column '{x_column}' is not numeric. Scatter plots require numeric data."
    if not pd.api.types.is_numeric_dtype(df[y_column]):
        return f"Error: Column '{y_column}' is not numeric. Scatter plots require numeric data."

    try:
        # Remove rows with NaN in either column
        plot_data = df[[x_column, y_column]].dropna()

        if len(plot_data) < 2:
            return f"Error: Not enough data points for scatter plot (need at least 2)."

        _setup_chart_style()
        fig, ax = plt.subplots(figsize=(10, 6))

        ax.scatter(plot_data[x_column], plot_data[y_column],
                   alpha=0.6, color='steelblue', edgecolors='white', s=60)

        ax.set_xlabel(x_column, fontsize=12)
        ax.set_ylabel(y_column, fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')

        # Calculate correlation and add trend line if significant
        correlation = plot_data[x_column].corr(plot_data[y_column])

        if abs(correlation) >= 0.3:  # Add trend line for meaningful correlations
            z = np.polyfit(plot_data[x_column], plot_data[y_column], 1)
            p = np.poly1d(z)
            x_line = np.linspace(plot_data[x_column].min(), plot_data[x_column].max(), 100)
            ax.plot(x_line, p(x_line), "r--", alpha=0.8, linewidth=2, label=f'Trend (r={correlation:.2f})')
            ax.legend()

        # Add correlation annotation
        ax.text(0.05, 0.95, f'Correlation: {correlation:.3f}', transform=ax.transAxes,
                fontsize=11, verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

        plt.tight_layout()
        filepath = _save_chart(title)

        return f"Scatter plot created: {title}\nSaved to: {filepath}\n{x_column} vs {y_column} ({len(plot_data)} points, r={correlation:.3f})"

    except Exception as e:
        plt.close()
        return f"Error creating scatter plot: {str(e)}"


def _create_pie_chart(filename: str, labels_column: str, values_column: str, title: str) -> str:
    """Create a pie chart, limiting to top 8 categories."""
    df, error = _get_loaded_df(filename)
    if df is None:
        return error

    if labels_column not in df.columns:
        return f"Error: Column '{labels_column}' not found. Available: {', '.join(df.columns)}"
    if values_column not in df.columns:
        return f"Error: Column '{values_column}' not found. Available: {', '.join(df.columns)}"

    try:
        # Aggregate by label
        plot_data = df.groupby(labels_column)[values_column].sum().reset_index()
        plot_data = plot_data.sort_values(values_column, ascending=False)

        # Limit to top 8, group rest as "Other"
        if len(plot_data) > 8:
            top_data = plot_data.head(8)
            other_value = plot_data.iloc[8:][values_column].sum()
            other_row = pd.DataFrame({labels_column: ['Other'], values_column: [other_value]})
            plot_data = pd.concat([top_data, other_row], ignore_index=True)

        _setup_chart_style()
        fig, ax = plt.subplots(figsize=(10, 8))

        # Create pie chart
        colors = plt.cm.Set3(np.linspace(0, 1, len(plot_data)))
        wedges, texts, autotexts = ax.pie(
            plot_data[values_column],
            labels=plot_data[labels_column],
            autopct='%1.1f%%',
            colors=colors,
            explode=[0.02] * len(plot_data),
            shadow=True,
            startangle=90
        )

        # Style the text
        for autotext in autotexts:
            autotext.set_fontsize(10)
            autotext.set_fontweight('bold')

        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)

        # Add legend
        ax.legend(wedges, plot_data[labels_column],
                  title=labels_column,
                  loc="center left",
                  bbox_to_anchor=(1, 0, 0.5, 1))

        plt.tight_layout()
        filepath = _save_chart(title)

        total = plot_data[values_column].sum()
        return f"Pie chart created: {title}\nSaved to: {filepath}\nShows {values_column} distribution by {labels_column} ({len(plot_data)} categories, total: {total:,.0f})"

    except Exception as e:
        plt.close()
        return f"Error creating pie chart: {str(e)}"


# ============================================================
# Function tools for the agent (wrappers with proper docstrings)
# ============================================================

@function_tool
def create_bar_chart(filename: str, x_column: str, y_column: str, title: str) -> str:
    """
    Create a bar chart comparing values across categories.

    Args:
        filename: Name of a previously loaded file.
        x_column: Column for x-axis categories (e.g., 'region', 'product').
        y_column: Column for y-axis values (e.g., 'revenue', 'quantity').
        title: Chart title to display and use for filename.

    Returns:
        Success message with file path, or error message.
    """
    return _create_bar_chart(filename, x_column, y_column, title)


@function_tool
def create_line_chart(filename: str, x_column: str, y_column: str, title: str) -> str:
    """
    Create a line chart showing trends over time or sequence.

    Args:
        filename: Name of a previously loaded file.
        x_column: Column for x-axis (often date/time).
        y_column: Column for y-axis values.
        title: Chart title to display and use for filename.

    Returns:
        Success message with file path, or error message.
    """
    return _create_line_chart(filename, x_column, y_column, title)


@function_tool
def create_histogram(filename: str, column: str, bins: int, title: str) -> str:
    """
    Create a histogram showing the distribution of a numeric column.

    Args:
        filename: Name of a previously loaded file.
        column: Numeric column to analyze.
        bins: Number of bins (use 10-20 for most data, more for large datasets).
        title: Chart title to display and use for filename.

    Returns:
        Success message with file path and statistics, or error message.
    """
    return _create_histogram(filename, column, bins, title)


@function_tool
def create_scatter_plot(filename: str, x_column: str, y_column: str, title: str) -> str:
    """
    Create a scatter plot showing relationship between two numeric columns.
    Includes trend line if correlation is significant.

    Args:
        filename: Name of a previously loaded file.
        x_column: Numeric column for x-axis.
        y_column: Numeric column for y-axis.
        title: Chart title to display and use for filename.

    Returns:
        Success message with file path and correlation, or error message.
    """
    return _create_scatter_plot(filename, x_column, y_column, title)


@function_tool
def create_pie_chart(filename: str, labels_column: str, values_column: str, title: str) -> str:
    """
    Create a pie chart showing proportions of a whole.
    Limits to top 8 categories, grouping rest as 'Other'.

    Args:
        filename: Name of a previously loaded file.
        labels_column: Column for slice labels (e.g., 'region', 'product').
        values_column: Column for slice sizes (e.g., 'revenue').
        title: Chart title to display and use for filename.

    Returns:
        Success message with file path, or error message.
    """
    return _create_pie_chart(filename, labels_column, values_column, title)
