FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build

# FROM base AS production
# ENV NODE_ENV=production
# COPY --from=deps /app/package.json ./package.json
# COPY --from=deps /app/bun.lock ./bun.lock
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=build /app/dist ./dist
# EXPOSE 4173
# CMD ["bun", "run", "preview", "--host", "0.0.0.0", "--port", "4173"]

FROM deps AS development
ARG UID=1001
ARG GID=0

ENV NODE_ENV=development
COPY . .

RUN chown -R ${UID}:${GID} /app && \
    chmod -R g=u /app

EXPOSE 5173
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]