FROM nanobot:latest

USER root

# Copy patches
COPY data/patches/ /app/patches/
RUN chmod +x /app/patches/entrypoint-patched.sh

# Override entrypoint to apply patches
ENTRYPOINT ["/app/patches/entrypoint-patched.sh"]
CMD ["gateway"]

USER nanobot
