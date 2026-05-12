FROM nanobot:latest

USER root

RUN pip install --no-cache-dir playwright && \
    playwright install chromium && \
    playwright install-deps chromium

USER nanobot
