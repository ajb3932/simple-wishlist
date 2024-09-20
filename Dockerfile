FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8092

USER nonroot

CMD [ "node", "server.js" ]