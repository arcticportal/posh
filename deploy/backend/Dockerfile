FROM python:3.14-slim-trixie

ARG USER=posh

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --shell /bin/bash ${USER} \
 && mkdir -p /posh/data \
 && chown -R ${USER}:${USER} /posh

WORKDIR /posh

COPY --chown=${USER}:${USER} backend/src/posh/ ./app/

USER ${USER}

CMD ["sleep", "infinity"]
