# BUILD STAGE
FROM node:24-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS build-stage
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Remove dev dependencies so the node_modules directory that we COPY into the distroless image contains only runtime dependencies
RUN npm prune --omit=dev


# PRODUCTION STAGE
FROM gcr.io/distroless/nodejs24-debian12@sha256:61f4f4341db81820c24ce771b83d202eb6452076f58628cd536cc7d94a10978b AS production
WORKDIR /usr/src/app

# Copy built files and package.json (required by @fastify/vite v9 to resolve application root)
COPY --from=build-stage --chown=65532:65532 /usr/src/app/package.json /usr/src/app/package.json
COPY --from=build-stage --chown=65532:65532 /usr/src/app/dist /usr/src/app/dist
COPY --from=build-stage --chown=65532:65532 /usr/src/app/node_modules /usr/src/app/node_modules

USER 65532:65532

CMD ["dist/server.js"]
