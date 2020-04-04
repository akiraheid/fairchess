# Render image
FROM node:10-alpine AS builder

WORKDIR /build
COPY . .

RUN npm i && npx webpack && node src/render.js \
	&& cp -r src/public/js/chessboardjs dist/js \
	&& cp -r src/public/img dist/img \
	&& cp -r src/public/css dist/css

# Service image
FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

EXPOSE 3000
CMD ["node", "src/app.js"]
USER node
ENV NODE_ENV production

COPY --chown=node:node src/app.js ./src/app.js
COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node src/routes ./src/routes/
COPY --from=builder --chown=node:node /build/dist ./dist/
