FROM python:3.14-slim-trixie

ARG USER=posh

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=UTC

# tzdata: for TZ-based scheduling. supercronic: cron for containers
# (https://github.com/aptible/supercronic). ca-certificates/curl: to fetch it.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl tzdata \
 && rm -rf /var/lib/apt/lists/*

# supercronic v0.2.48 (cron for containers). amd64 only; bump version+sha together.
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.48/supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=016b7c9aebfc8d9fd9526e8ba33b191fc524485f \
    SUPERCRONIC=supercronic-linux-amd64
RUN curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

RUN useradd --create-home --shell /bin/bash ${USER} \
 && mkdir -p /posh/data \
 && chown -R ${USER}:${USER} /posh

WORKDIR /posh

COPY --chown=${USER}:${USER} backend/src/posh/ ./app/
COPY --chown=${USER}:${USER} deploy/backend/entrypoint.sh /posh/app/entrypoint.sh
RUN chmod +x /posh/app/entrypoint.sh

USER ${USER}

CMD ["/posh/app/entrypoint.sh"]
