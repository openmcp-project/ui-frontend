# BUILD STAGE
FROM node:24-slim@sha256:3e94dd65fe94945f1777bcab2a2c6f23998590440369cd345af48a44fb381691 AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:ea1b7da0dc772436dd12d54e7cacbb74959be4ce0e0e7521a26360a4aee78d31 AS production
WORKDIR /usr/src/app

# Copy built files
COPY --from=build-stage /usr/src/app/dist/client /usr/src/app/dist/client
COPY --from=build-stage /usr/src/app/dist/vite.config.json /usr/src/app/dist/vite.config.json
COPY --from=build-stage /usr/src/app/dist/server /usr/src/app/server
COPY --from=build-stage /usr/src/app/dist/server.js /usr/src/app/server.js
COPY --from=build-stage /usr/src/app/public /usr/src/app/public
COPY --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules

# Run
CMD ["server.js"]
