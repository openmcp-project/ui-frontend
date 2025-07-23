# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22@sha256:e515259afd26f60db74957c62203c93d45760f2ba864d94accfa2edfc1ac17cf AS build-stage
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
FROM gcr.io/distroless/nodejs22-debian12@sha256:b765815eafacee5222bfa50179028f41dd8c642b68ad68ec4e6922d3b1ff2710 AS production

WORKDIR /usr/src/app

COPY --from=build-stage /usr/src/app /usr/src/app

CMD ["server.js"]
