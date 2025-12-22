# Data Analysis Agent

An AI-powered data analysis assistant built with Python and the OpenAI Agents SDK. Ask questions about your data in natural language and get insights, statistics, and visualizations.

## Features

- **Natural Language Interface**: Ask questions like "What's the average revenue by region?"
- **Data Loading**: Supports CSV and Excel files
- **Statistical Analysis**: Summaries, filtering, grouping, correlations
- **Visualizations**: Bar charts, line charts, histograms, scatter plots, pie charts
- **Conversation Memory**: Maintains context across multiple questions

## Quick Start

### 1. Clone and Setup

```bash
cd llm-app
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure API Key

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Add Your Data

Drop CSV or Excel files into the `data/` folder. A sample file is included for testing.

### 4. Run the Agent

```bash
python main.py
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `quit` | Exit the program |
| `clear` | Clear conversation history |
| `help` | Show help message |

### Example Conversation

```
You: What files are available?

Agent: Available data files:
  - sample_sales.csv (3.6 KB)
Total: 1 file(s)

You: Load the sales data and show me a summary

Agent: Successfully loaded: sample_sales.csv
Shape: 100 rows x 5 columns
Columns: date, region, product, quantity, revenue
...

You: What's the total revenue by region?

Agent: Group by: region
Aggregation: sum(revenue)

Results (4 groups):
region  revenue_sum
  West      42430.0
  East      29810.0
 South      25470.0
 North      22490.0

You: Create a bar chart of that

Agent: Bar chart created: Revenue by Region
Saved to: output/revenue_by_region_20241222_143052.png
```

## Available Tools

### File Operations
| Tool | Description |
|------|-------------|
| `list_data_files` | List available CSV/Excel files |
| `load_dataset` | Load a file into memory |
| `get_column_info` | Get detailed column information |

### Analysis
| Tool | Description |
|------|-------------|
| `describe_data` | Statistical summary (mean, std, min, max, etc.) |
| `filter_data` | Filter rows by condition |
| `group_by_analysis` | Group and aggregate data |
| `get_value_counts` | Count unique values in a column |
| `calculate_correlation` | Correlation matrix for numeric columns |

### Visualization
| Tool | Description |
|------|-------------|
| `create_bar_chart` | Compare values across categories |
| `create_line_chart` | Show trends over time |
| `create_histogram` | Distribution of numeric data |
| `create_scatter_plot` | Relationship between two variables |
| `create_pie_chart` | Proportions of a whole |

## Project Structure

```
llm-app/
├── main.py              # CLI entry point
├── agent.py             # Agent definition with tools
├── tools/
│   ├── __init__.py      # Tool exports and shared state
│   ├── file_tools.py    # File operations
│   ├── analysis_tools.py # Data analysis
│   └── viz_tools.py     # Visualization
├── data/                # Drop your data files here
│   └── sample_sales.csv # Example dataset
├── output/              # Generated charts saved here
├── requirements.txt     # Python dependencies
├── .env.example         # API key template
└── README.md            # This file
```

## Requirements

- Python 3.9+
- OpenAI API key (GPT-4o)

## Dependencies

- `openai-agents` - OpenAI Agents SDK
- `pandas` - Data manipulation
- `matplotlib` - Visualizations
- `openpyxl` - Excel file support
- `python-dotenv` - Environment variables

## Troubleshooting

### "OPENAI_API_KEY not found"
Create a `.env` file with your API key:
```
OPENAI_API_KEY=sk-your-key-here
```

### "Rate limit exceeded"
Wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.

### Charts not displaying
Charts are saved to the `output/` folder as PNG files. Check that folder after creating a chart.

## License

MIT
