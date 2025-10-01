# BUILD STAGE
FROM node:24-slim@sha256:9cd5e2bb1f5c5a6636e2946b3ea2d54a4148989537f8cfdfbb43c88c79dd1d5b AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:b8be532fe81829b3803c832989cba7f42de62b2fbc8c7599cae30f378882ea12 AS production
WORKDIR /usr/src/app

# Copy built files
COPY --from=build-stage /usr/src/app/dist /usr/src/app/dist
COPY --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules

# Run
CMD ["dist/server.js"]
