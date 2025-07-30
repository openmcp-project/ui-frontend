# BUILD STAGE
FROM node:24-slim@sha256:36ae19f59c91f3303c7a648f07493fe14c4bd91320ac8d898416327bacf1bbfa AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:20a51c926c0bb68a9b1f7059c81516da002655f8a896a2cb7bc56b56974782b3 AS production
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
