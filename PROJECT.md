# Data Analysis Agent - Comprehensive Project Plan

> **Project Purpose**: Build an AI-powered data analysis agent using Python and the OpenAI Agents SDK that can load CSV/Excel files, perform statistical analysis, create visualizations, and answer natural language questions about data.

> **Target Location**: `/Users/richard/Desktop/llm-app`

---

## Project Overview

### What We're Building
A command-line data analysis assistant that:
1. Accepts natural language questions about data
2. Automatically loads and explores CSV/Excel files
3. Performs pandas-based analysis (filtering, grouping, statistics)
4. Generates matplotlib charts saved to disk
5. Maintains conversation context for follow-up questions

### Tech Stack (Final Decisions)
| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | OpenAI Agents SDK (`openai-agents`) | Official, lightweight, production-ready |
| LLM | GPT-4o via OpenAI API | Best balance of capability and speed |
| Data Processing | pandas + openpyxl | Industry standard for data analysis |
| Visualization | matplotlib | Simple, reliable, saves to file easily |
| CLI | Python asyncio + input loop | Built-in, no extra dependencies |
| Config | python-dotenv | Simple .env file for API key |

### Directory Structure
```
llm-app/
├── main.py                 # Entry point - CLI interface
├── agent.py                # Agent definition with all tools
├── tools/
│   ├── __init__.py         # Exports all tools
│   ├── file_tools.py       # File listing, loading, info
│   ├── analysis_tools.py   # Statistics, filtering, grouping
│   └── viz_tools.py        # Chart generation
├── data/                   # User drops CSV/Excel files here
│   └── sample_sales.csv    # Example data for testing
├── output/                 # Generated charts saved here
├── requirements.txt        # Python dependencies
├── .env.example            # Template for API key
└── README.md               # Usage instructions
```

---

## Phase 1: Project Setup
**Goal**: Create project structure and install dependencies

### Tasks
- [x] **1.1** Create directory structure
  - Create `llm-app/` root folder (already exists at `/Users/richard/Desktop/llm-app`)
  - Create `tools/` subdirectory
  - Create `data/` subdirectory
  - Create `output/` subdirectory

- [x] **1.2** Create `requirements.txt`
  ```
  openai-agents>=0.0.7
  pandas>=2.0.0
  matplotlib>=3.7.0
  openpyxl>=3.1.0
  python-dotenv>=1.0.0
  ```

- [x] **1.3** Create `.env.example`
  ```
  OPENAI_API_KEY=sk-your-api-key-here
  ```

- [x] **1.4** Create `.gitignore`
  ```
  .env
  __pycache__/
  *.pyc
  output/*.png
  .venv/
  ```

- [x] **1.5** Create sample test data `data/sample_sales.csv`
  - Columns: date, region, product, quantity, revenue
  - ~100 rows of realistic sample data

### Verification
- [x] All directories exist
- [x] `pip install -r requirements.txt` succeeds
- [x] Sample CSV is readable with pandas

---

## Phase 2: File Tools Implementation
**Goal**: Enable the agent to discover and load data files

### File: `tools/file_tools.py`

- [x] **2.1** Implement `list_data_files()` function
  - Scans `data/` directory for `*.csv` and `*.xlsx` files
  - Returns list of filenames with sizes
  - Decorated with `@function_tool`

- [x] **2.2** Implement `load_dataset(filename: str)` function
  - Loads CSV or Excel file from `data/` directory
  - Stores DataFrame in a global registry (dict) for reuse
  - Returns: row count, column count, column names, first 3 rows as preview
  - Validates filename to prevent path traversal (`../`)

- [x] **2.3** Implement `get_column_info(filename: str)` function
  - Returns detailed info for each column:
    - Column name
    - Data type (numeric, string, datetime)
    - Null count
    - Unique value count
    - Sample values (first 5)

### File: `tools/__init__.py`
- [x] **2.4** Export all file tools

### Global State Design
```python
# In tools/__init__.py
LOADED_DATASETS: dict[str, pd.DataFrame] = {}
```
All tools share this dict to avoid reloading files.

### Verification
- [x] `list_data_files()` returns sample_sales.csv
- [x] `load_dataset("sample_sales.csv")` returns proper summary
- [x] `get_column_info("sample_sales.csv")` shows all columns
- [x] Invalid filenames are rejected with clear error

---

## Phase 3: Analysis Tools Implementation
**Goal**: Enable statistical analysis and data manipulation

### File: `tools/analysis_tools.py`

- [x] **3.1** Implement `describe_data(filename: str)` function
  - Runs `df.describe()` on loaded dataset
  - Returns formatted statistics (count, mean, std, min, 25%, 50%, 75%, max)
  - Handles both numeric and categorical columns

- [x] **3.2** Implement `filter_data(filename: str, condition: str)` function
  - Uses `df.query(condition)` for filtering
  - Example condition: `"revenue > 1000 and region == 'West'"`
  - Returns filtered row count and preview (first 5 rows)
  - Stores filtered result as `{filename}_filtered` in registry

- [x] **3.3** Implement `group_by_analysis(filename: str, group_columns: str, value_column: str, aggregation: str)` function
  - `group_columns`: comma-separated column names (e.g., "region,product")
  - `aggregation`: one of "sum", "mean", "count", "min", "max"
  - Returns grouped results as formatted table
  - Stores result as `{filename}_grouped` in registry

- [x] **3.4** Implement `get_value_counts(filename: str, column: str)` function
  - Returns frequency count of unique values
  - Useful for categorical columns
  - Limits to top 20 values

- [x] **3.5** Implement `calculate_correlation(filename: str)` function
  - Returns correlation matrix for numeric columns
  - Formatted as readable table

### Verification
- [x] `describe_data` shows stats for sample data
- [x] `filter_data` correctly filters rows
- [x] `group_by_analysis` aggregates correctly
- [x] Error messages are clear when columns don't exist

---

## Phase 4: Visualization Tools Implementation
**Goal**: Generate and save charts

### File: `tools/viz_tools.py`

- [x] **4.1** Implement `create_bar_chart(filename: str, x_column: str, y_column: str, title: str)` function
  - Creates matplotlib bar chart
  - Auto-aggregates if needed (sum of y for each x)
  - Saves to `output/{title}_{timestamp}.png`
  - Returns the saved file path

- [x] **4.2** Implement `create_line_chart(filename: str, x_column: str, y_column: str, title: str)` function
  - Creates line chart (good for time series)
  - Sorts by x-axis if it's a date
  - Saves to output directory

- [x] **4.3** Implement `create_histogram(filename: str, column: str, bins: int, title: str)` function
  - Creates histogram for distribution analysis
  - Default 10 bins if not specified
  - Shows count on y-axis

- [x] **4.4** Implement `create_scatter_plot(filename: str, x_column: str, y_column: str, title: str)` function
  - Creates scatter plot for correlation visualization
  - Adds trend line if correlation is significant

- [x] **4.5** Implement `create_pie_chart(filename: str, labels_column: str, values_column: str, title: str)` function
  - Creates pie chart for proportion visualization
  - Limits to top 8 categories, groups rest as "Other"

### Chart Styling (apply to all)
```python
plt.style.use('seaborn-v0_8-whitegrid')
plt.figure(figsize=(10, 6))
plt.tight_layout()
```

### Verification
- [x] Each chart type generates a valid PNG
- [x] Charts are saved to output/ with correct names
- [x] Agent can reference the file path in response

---

## Phase 5: Agent Definition
**Goal**: Define the main agent with all tools and instructions

### File: `agent.py`

- [x] **5.1** Import all tools from `tools/` module

- [x] **5.2** Define agent with comprehensive instructions:
  ```python
  from agents import Agent
  from tools import (
      list_data_files, load_dataset, get_column_info,
      describe_data, filter_data, group_by_analysis,
      get_value_counts, calculate_correlation,
      create_bar_chart, create_line_chart, create_histogram,
      create_scatter_plot, create_pie_chart
  )

  data_analyst = Agent(
      name="Data Analyst",
      model="gpt-4o",
      instructions="""You are a data analysis assistant. Help users understand and visualize their data.

  ## Your Capabilities
  - List and load CSV/Excel files from the data folder
  - Provide statistical summaries and column information
  - Filter and group data based on conditions
  - Create bar charts, line charts, histograms, scatter plots, and pie charts

  ## Workflow
  1. First, check what files are available with list_data_files
  2. Load the dataset the user wants to analyze
  3. Explore columns and statistics to understand the data
  4. Answer questions or create visualizations as requested

  ## Guidelines
  - Always load a dataset before trying to analyze it
  - When creating charts, describe what the chart shows
  - If a request is unclear, ask for clarification
  - Mention the file path when you save charts
  - For large results, summarize key findings rather than dumping raw data
  """,
      tools=[
          list_data_files,
          load_dataset,
          get_column_info,
          describe_data,
          filter_data,
          group_by_analysis,
          get_value_counts,
          calculate_correlation,
          create_bar_chart,
          create_line_chart,
          create_histogram,
          create_scatter_plot,
          create_pie_chart,
      ]
  )
  ```

- [x] **5.3** Export the agent for use in main.py

### Verification
- [x] Agent initializes without errors
- [x] All tools are properly registered (13 tools)

---

## Phase 6: CLI Interface
**Goal**: Create interactive command-line interface

### File: `main.py`

- [x] **6.1** Implement main entry point
  - Async main loop with welcome message
  - Commands: quit, clear, help
  - "Thinking..." indicator while processing

- [x] **6.2** Add conversation history support
  - ConversationHistory class tracks messages
  - Keeps last 5 exchanges for context
  - Truncates long messages to avoid token limits

- [x] **6.3** Add error handling
  - API key validation on startup
  - Catches AuthenticationError, RateLimitError, APIConnectionError
  - Keyboard interrupt handling (Ctrl+C)
  - Clear error messages with suggestions

### Verification
- [x] `python main.py` imports without errors
- [x] ConversationHistory builds context correctly
- [x] Error handling displays helpful messages

---

## Phase 7: Documentation & Testing
**Goal**: Complete the project with docs and final testing

- [x] **7.1** Create `README.md`
  - Project description
  - Setup instructions (venv, pip install, .env)
  - Usage examples with example conversation
  - Tool reference tables
  - Troubleshooting section

- [x] **7.2** End-to-end testing
  - Test: List files → Load data → Get stats → Create chart
  - Test: All 13 tools verified working (16/16 tests passed)
  - Test: Error handling (missing file, bad column name)

- [x] **7.3** Initialize git repository
  - `git init`
  - `git add .`
  - `git commit -m "Initial commit: Data Analysis Agent"`

---

## Implementation Order & Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (File Tools) ─────┐
    ↓                     │
Phase 3 (Analysis Tools) ─┼──→ Phase 5 (Agent Definition)
    ↓                     │         ↓
Phase 4 (Viz Tools) ──────┘    Phase 6 (CLI)
                                   ↓
                              Phase 7 (Docs & Test)
```

**Critical Path**: Phases must be done in order 1→2→3→4→5→6→7

---

## Key Integration Points

### 1. Shared Dataset Registry
All tools access `LOADED_DATASETS` dict from `tools/__init__.py`:
```python
# tools/__init__.py
LOADED_DATASETS: dict[str, pd.DataFrame] = {}

# tools/file_tools.py
from . import LOADED_DATASETS
def load_dataset(filename):
    df = pd.read_csv(f"data/{filename}")
    LOADED_DATASETS[filename] = df
```

### 2. Tool Return Format
All tools return strings (agent-friendly):
```python
@function_tool
def describe_data(filename: str) -> str:
    """Get statistical summary of the dataset."""
    df = LOADED_DATASETS.get(filename)
    if df is None:
        return f"Error: {filename} not loaded. Use load_dataset first."
    return df.describe().to_string()
```

### 3. Chart Saving Convention
```python
from datetime import datetime

def save_chart(title: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = title.replace(" ", "_").lower()
    path = f"output/{safe_title}_{timestamp}.png"
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    return path
```

---

## Current Status

**Last Updated**: Project Complete

**Current Phase**: All phases complete (1-7)

**Blockers**: None

**Summary**:
- All 7 phases implemented successfully
- 13 tools working (3 file, 5 analysis, 5 visualization)
- End-to-end tests: 16/16 passed
- README.md with full documentation
- Git repository initialized with initial commit
