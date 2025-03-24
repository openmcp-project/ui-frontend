# Use the latest LTS version of Node.js
# https://hub.docker.com/_/node
FROM node:22-alpine3.20 AS build-stage
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
FROM nginx:1.27.4-alpine-slim

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html