# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22@sha256:2040569338f7a279161576ec5ff332d97ef53f46baf94c85fe06fd3ed81a8f5f AS build-stage
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
FROM gcr.io/distroless/nodejs22-debian12@sha256:d028bfd3111bb0e2a75ef5e2232fa91cb826f9121a66a2242962b1c52398a237 AS production

WORKDIR /usr/src/app

COPY --from=build-stage /usr/src/app /usr/src/app

CMD ["server.js"]
