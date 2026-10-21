# Production image for the web app and the job worker (same image, different command).
FROM node:22-slim AS deps
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/web apps/web
WORKDIR /repo/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-slim AS runtime
RUN corepack enable && useradd --create-home --uid 10001 app
WORKDIR /repo
COPY --from=build --chown=app /repo /repo
USER app
WORKDIR /repo/apps/web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
# Web: default. Worker: `pnpm worker`. Migrations: `pnpm db:migrate`.
CMD ["pnpm", "start"]
