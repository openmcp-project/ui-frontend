# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS build-stage
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
FROM node:22-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS production

WORKDIR /usr/src/app

# copy over package.json from the origin file system again so it can be done in parallel from docker (if configured)
COPY package*.json ./
# install only dependencies which are not marked as dev
RUN npm ci --omit=dev

# copy over necessary files for the server
COPY server.js ./
COPY server server

# copy over precompiled frontend
COPY --from=build-stage /usr/src/app/dist dist

CMD ["npm", "run", "start"]
