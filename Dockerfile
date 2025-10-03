# BUILD STAGE
FROM node:24-slim@sha256:3e69116c924bfcba6c6979aff60d966c37aef56d488ce091c69d442ebec9f103 AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:10399fcb07704d1bc2fbf9d464db179bb525aa360ed86628ef652ef43609ff96 AS production
WORKDIR /usr/src/app

# Copy built files
COPY --from=build-stage /usr/src/app/dist /usr/src/app/dist
COPY --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules

# Run
CMD ["dist/server.js"]
