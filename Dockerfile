# Rendering image
FROM node:10-alpine AS builder

ENV NODE_ENV=development

WORKDIR /build
COPY package*.json ./

RUN npm i
