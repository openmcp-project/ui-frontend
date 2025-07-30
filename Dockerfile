# BUILD STAGE
FROM node:24-slim AS build-stage
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev


# PRODUCTION STAGE
FROM gcr.io/distroless/nodejs24-debian12 AS production
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
