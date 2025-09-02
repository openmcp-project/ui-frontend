# BUILD STAGE
FROM node:24-slim@sha256:9b741b28148b0195d62fa456ed84dd6c953c1f17a3761f3e6e6797a754d9edff AS build-stage
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
FROM gcr.io/distroless/nodejs24-debian12@sha256:98fd27d54e32d0d281a4c41db1bbe87a61259b2cad12c61bb1b8c0e32166162d AS production
WORKDIR /usr/src/app

# Copy built files
COPY --from=build-stage /usr/src/app/dist /usr/src/app/dist
COPY --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules

# Run
CMD ["dist/server.js"]
