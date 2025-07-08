# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22@sha256:2fa6c977460b56d4d8278947ab56faeb312bc4cc6c4cf78920c6de27812f51c5 AS build-stage
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
FROM gcr.io/distroless/nodejs22-debian12@sha256:fd90468f47e91d0d3c9bc055c8c09edbf0c225c3c795d0c266e2ca94b3ba17e3 AS production

WORKDIR /usr/src/app

COPY --from=build-stage /usr/src/app /usr/src/app

CMD ["server.js"]
