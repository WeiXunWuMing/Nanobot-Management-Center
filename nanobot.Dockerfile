FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "nanobot-ai[weixin]" "qrcode[pil]"

RUN useradd -m -u 1000 -s /bin/bash nanobot && \
    mkdir -p /home/nanobot/.nanobot && \
    chown -R nanobot:nanobot /home/nanobot

USER nanobot
ENV HOME=/home/nanobot

EXPOSE 18790

ENTRYPOINT ["nanobot"]
CMD ["gateway"]
