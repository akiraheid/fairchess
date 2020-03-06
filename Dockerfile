FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node
ENV NODE_ENV production
RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000
CMD ["node", "index.js"]
