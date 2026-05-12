FROM nanobot:latest

USER root

COPY data/patches/ /app/patches/
RUN chmod +x /app/patches/entrypoint-patched.sh

ENTRYPOINT ["/app/patches/entrypoint-patched.sh"]
CMD ["gateway"]

USER nanobot
