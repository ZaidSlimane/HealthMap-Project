FROM python:3.9-slim

WORKDIR /app

# Install dependencies with extended timeout for large packages
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=300 -r requirements.txt

# Copy application code and artifacts
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
