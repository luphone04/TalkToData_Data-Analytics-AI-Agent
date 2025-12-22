# Dockerfile for TalkToData Backend API
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for matplotlib and pandas
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy agent and tools from root (required by backend)
COPY agent.py ./agent.py
COPY tools/ ./tools/

# Create necessary directories
RUN mkdir -p output data user_data user_output

# Set Python path to find modules
ENV PYTHONPATH=/app

# Change to backend directory
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
