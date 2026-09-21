# TalkToData

AI-powered data analysis SaaS application. Upload your data, ask questions in natural language, and get insights with visualizations.

## Screenshots

![Screenshot 1](Screenshot%202025-12-23%20at%2012.54.39.png)

![Screenshot 2](Screenshot%202025-12-23%20at%2012.54.49.png)

![Screenshot 3](Screenshot%202025-12-23%20at%2012.55.08.png)

---

## Architecture

```
┌───────────────────┐       ┌───────────────────┐
│     FRONTEND      │       │     SUPABASE      │
│  Next.js • React  │       │  Auth • DB • S3   │
└─────────┬─────────┘       └─────────┬─────────┘
          │                           │
          └─────────────┬─────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        AI AGENT SERVICE                             │  │
│  │                                                                     │  │
│  │   ┌───────────────────────────────────────────────────────────┐     │  │
│  │   │                 OpenAI Agents SDK                         │     │  │
│  │   │                                                           │     │  │
│  │   │    ┌─────────────────────────────────────────────────┐    │     │  │
│  │   │    │              AGENTIC LOOP (ReAct)               │    │     │  │
│  │   │    │                                                 │    │     │  │
│  │   │    │   User Query ──▶ THINK ──▶ ACT ──▶ OBSERVE ─┐   │    │     │  │
│  │   │    │                   ▲                         │   │    │     │  │
│  │   │    │                   └─────────────────────────┘   │    │     │  │
│  │   │    │                        (repeat until done)      │    │     │  │
│  │   │    └─────────────────────────────────────────────────┘    │     │  │
│  │   │                             │                             │     │  │
│  │   │                             ▼                             │     │  │
│  │   │    ┌─────────────────────────────────────────────────┐    │     │  │
│  │   │    │                    TOOLS                        │    │     │  │
│  │   │    │  ┌─────────┐  ┌────────────┐  ┌──────────────┐  │    │     │  │
│  │   │    │  │  File   │  │  Analysis  │  │Visualization │  │    │     │  │
│  │   │    │  │  Tools  │  │   Tools    │  │    Tools     │  │    │     │  │
│  │   │    │  └─────────┘  └────────────┘  └──────────────┘  │    │     │  │
│  │   │    └─────────────────────────────────────────────────┘    │     │  │
│  │   └───────────────────────────────────────────────────────────┘     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │      Gemini API       │
                        │       (Gemini 3.6 Flash)        │
                        └───────────────────────┘
```

---

## AI Agent

The core intelligence is an **Agentic AI** built with the **OpenAI Agents SDK**, powered by **Gemini 3.6 Flash**.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **LLM Backbone** | Gemini 3.6 Flash provides reasoning, natural language understanding, and decision-making |
| **Tool Use / Function Calling** | Agent can invoke Python functions to interact with data and generate visualizations |
| **ReAct Pattern** | Agent iteratively **Reasons** about the task, **Acts** by calling tools, and **Observes** results |
| **Agentic Loop** | Autonomous multi-step execution until the task is complete |
| **Prompt Engineering** | System instructions guide agent behavior, capabilities, and response format |

### Tools

The agent has access to **11 tools** across 3 categories:

- **File Tools** - Load datasets, inspect schemas, list available files
- **Analysis Tools** - Statistical summaries, filtering, grouping, correlations
- **Visualization Tools** - Bar charts, line charts, histograms, scatter plots, pie charts

Tools are Python functions with the `@function_tool` decorator. The SDK automatically generates JSON schemas from type hints and docstrings for the LLM.

---

## Future Enhancements

| Feature | Description |
|---------|-------------|
| **More File Formats** | Support for JSON, Parquet, Google Sheets, and direct database connections |
| **Advanced Chart Types** | Heatmaps, box plots, geographic maps, treemaps, and interactive dashboards |
| **Export Reports as PDF** | Generate downloadable PDF reports with charts and analysis summaries |
| **Advanced Analytics** | Time series forecasting, anomaly detection, clustering, and predictive modeling |
| **Natural Language to SQL** | Preview the generated SQL queries before execution for transparency and learning |

## Gemini setup

The agent uses Google's OpenAI-compatible Chat Completions endpoint. The OpenAI
Agents SDK still runs the Python tools, but inference goes to Google; an OpenAI
API key is not required and OpenAI tracing is disabled.

1. Create an API key in https://aistudio.google.com/apikey.
2. Copy `.env.example` to `.env` at the repository root and fill in your keys.
   Hosted backends should set `GEMINI_API_KEY` and `GEMINI_MODEL` in their
   environment settings instead. Existing Supabase configuration is still needed.
3. Install `backend/requirements.txt`, then run `cd backend && uvicorn main:app --reload`.
   For the standalone terminal app, run `python main.py` from the repository root.
4. Redeploy the backend after changing its environment. The frontend's existing
   Supabase and backend URL environment variables remain necessary.

`GEMINI_MODEL` defaults to `gemini-3.6-flash`. Free-tier availability and quotas
are controlled by Google and your project, not this code. Check AI Studio before
enabling billing. Each analysis can make multiple model calls.

Do not commit API keys. Rotate any key shared in chat or public files.
