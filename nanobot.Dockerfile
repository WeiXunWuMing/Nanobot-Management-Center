FROM node:20-slim AS webbuilder

WORKDIR /app
RUN npm install -g pnpm

# Clone nanobot source
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/HKUDS/nanobot.git /src

# Build WebUI
WORKDIR /src/webui
RUN pnpm install && pnpm run build

FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# Install nanobot from PyPI
RUN pip install --no-cache-dir nanobot-ai[weixin]

# Copy WebUI build output
COPY --from=webbuilder /src/nanobot/web/dist /usr/local/lib/python3.12/site-packages/nanobot/web/dist

RUN useradd -m -u 1000 -s /bin/bash nanobot && \
    mkdir -p /home/nanobot/.nanobot && \
    chown -R nanobot:nanobot /home/nanobot

USER nanobot
ENV HOME=/home/nanobot

EXPOSE 18790 8765

ENTRYPOINT ["nanobot"]
CMD ["gateway"]
