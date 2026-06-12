# smoke-test/Dockerfile
#
# Multi-stage build:
#   Stage 1 (deps)  — install Node deps for the smoke test itself
#   Stage 2 (final) — Cypress base image with Chrome + our test files
#
# The Cypress base image already bundles Chrome, Node, and all required
# shared libraries — no need to install a browser separately.

# ---- Stage 1: install smoke-test Node dependencies ------------------------
FROM node:24-slim AS deps
WORKDIR /smoke-test
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Stage 2: final runnable image ----------------------------------------
# cypress/included bundles Cypress + Chrome + all system dependencies.
# TODO: pin to a digest once first run confirms the version works, e.g.:
#   FROM cypress/included:14.0.0@sha256:<digest>
FROM cypress/included:14.0.0

# kubectl — optional, used to apply CRD results to a cluster
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && curl -LO "https://dl.k8s.io/release/$(curl -sSL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
  && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
  && rm kubectl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /smoke-test

# Copy smoke-test source
COPY --from=deps /smoke-test/node_modules ./node_modules
COPY cypress.config.ts ./
COPY cypress/ ./cypress/
COPY write-results.mjs ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Results are written here — mount a volume to retrieve them
VOLUME ["/results"]

# Environment variable documentation (all overridable at runtime)
ENV CYPRESS_BASE_URL=""   \
    SMOKE_USERNAME=""      \
    SMOKE_PASSWORD=""      \
    SMOKE_PROJECT_NAME="smoke-test-project" \
    SMOKE_WORKSPACE_NAME="smoke-test-ws"    \
    SMOKE_MCP_NAME="smoke-test-mcp"         \
    SMOKE_SKIP_CLEANUP="false"              \
    SMOKE_BROWSER="chrome"

ENTRYPOINT ["./entrypoint.sh"]
