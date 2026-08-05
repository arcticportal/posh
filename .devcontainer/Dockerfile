FROM mcr.microsoft.com/devcontainers/python:3-3.14-trixie


RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/home/${USER}/.local/bin:${PATH}"

# install node and npm
# ── Node.js 22 LTS  ─────────────────────────────────
ARG NODE_MAJOR=22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g @angular/cli 