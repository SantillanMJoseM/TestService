# ============================================================
# TestService - Dockerfile definitivo
# Debian Slim + Node.js 20 + OpenSSL 3 + Prisma 5.22
# ============================================================

FROM node:20-slim AS base

# -----------------------------------------------------------
# Etapa 1: Dependencias
# -----------------------------------------------------------
FROM base AS deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN rm -rf node_modules/.prisma
RUN npm ci --legacy-peer-deps

# -----------------------------------------------------------
# Etapa 2: Construccion
# -----------------------------------------------------------
FROM base AS builder
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Eliminar cualquier motor Prisma preexistente y regenerar desde cero
RUN rm -rf node_modules/.prisma
RUN npx prisma generate
# Eliminar cualquier motor musl que se haya generado accidentalmente
RUN rm -f /app/node_modules/.prisma/client/libquery_engine-linux-musl*.so.node
# Verificar que solo existe el motor Debian
RUN echo "=== Prisma engine check ===" && \
    ls /app/node_modules/.prisma/client/libquery_engine* && \
    if ls /app/node_modules/.prisma/client/libquery_engine-linux-musl* 1>/dev/null 2>&1; then \
      echo "ERROR: musl engine detected" && exit 1; \
    else \
      echo "OK: no musl engine"; \
    fi
RUN npm run build

# -----------------------------------------------------------
# Etapa 3: Produccion
# -----------------------------------------------------------
FROM base AS runner
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copiar archivos de la aplicacion
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copiar Prisma Client generado (motor Debian) y CLI
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Validacion final
RUN echo "=== FINAL VALIDATION ===" && \
    echo "--- OS ---" && cat /etc/os-release | grep -E "^(NAME|VERSION)=" && \
    echo "--- OpenSSL ---" && openssl version && \
    echo "--- Prisma CLI ---" && node /app/node_modules/prisma/build/index.js --version && \
    echo "--- Prisma engine ---" && ls /app/node_modules/.prisma/client/libquery_engine* && \
    if ls /app/node_modules/.prisma/client/libquery_engine-linux-musl* 1>/dev/null 2>&1; then \
      echo "ERROR: musl engine in final image" && exit 1; \
    else \
      echo "OK: no musl engine in final image"; \
    fi && \
    echo "=== VALIDATION COMPLETE ==="

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]