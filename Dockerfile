# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22-alpine3.20@sha256:686b8892b69879ef5bfd6047589666933508f9a5451c67320df3070ba0e9807b AS build-stage
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build 
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Use the latest LTS version of Nginx as the serving image
# https://hub.docker.com/_/nginx
FROM nginx:1.28.0-alpine-slim@sha256:39a9a15e0a81914a96fa9ffa980cdfe08e2e5e73ae3424f341ad1f470147c413

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html