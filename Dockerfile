# BUILD STAGE
FROM node:24-slim@sha256:9e08f846e8f0a55d7e15726dc2f58b479ec9523b3a54a0d34d3b16def4f78b97 AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:767b6dcea4bbc0ad1f1893c7444e44e7d8a3bc64d53fcd0cddc35b4264c4834a AS production
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
