# syntax=docker/dockerfile:1
# Obraz SiMotion (Next.js 16, output: "standalone") dla Cloud Run.
# Node 24 LTS — Next.js 16 wymaga Node >= 20.9, a Node 20 ma zakończone wsparcie (04.2026).

ARG NODE_IMAGE=node:24-slim

# ---------- 1. Zależności ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Lokalne paczki (np. SheetJS xlsx z cdn.sheetjs.com) wskazane w package.json jako file:vendor/...
COPY vendor ./vendor
RUN npm ci --no-audit --no-fund

# ---------- 2. Build ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. Obraz uruchomieniowy ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Samodzielny serwer (server.js + minimalne node_modules)
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Zasoby statyczne nie są kopiowane do standalone automatycznie
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Baza haseł czytana z dysku przez /api/sinsay-match (process.cwd()/src/data)
COPY --from=builder --chown=node:node /app/src/data ./src/data

USER node
EXPOSE 8080

CMD ["node", "server.js"]
