FROM node:14

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --also=dev

COPY src src
COPY tsconfig.json tsconfig.json
COPY package-lock.json package-lock.json

RUN npm run build

CMD [ "npm", "run", "start"]