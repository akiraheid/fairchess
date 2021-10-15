# Rendering image
FROM docker.io/node:16-alpine AS builder

ENV NODE_ENV=development

WORKDIR /build
COPY package*.json ./

RUN npm i
