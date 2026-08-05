FROM mcr.microsoft.com/devcontainers/python:3-3.14-trixie


RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/home/${USER}/.local/bin:${PATH}"

