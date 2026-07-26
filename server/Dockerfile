FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install

WORKDIR /app/server

EXPOSE 5000

CMD ["npm", "start"]