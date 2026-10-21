FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir uv==0.11.28 && useradd --create-home --uid 10001 app
WORKDIR /srv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
USER app
EXPOSE 8100
CMD ["/srv/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "2"]
