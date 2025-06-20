# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716 AS build-stage
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# The same image but now only install the production dependencies as the frontend is already built using vite in the build-stage
FROM gcr.io/distroless/nodejs22-debian12@sha256:3bbb76acb752a4ed1275fd337d005e37cd35706a4f97f916ee1d65a30b486915 AS production

WORKDIR /usr/src/app

COPY --from=build-stage /usr/src/app /usr/src/app

CMD ["server.js"]
