FROM node:22-alpine AS build

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY client/package*.json ./client/

# Install seluruh workspace
RUN npm install

# Copy source
COPY . .

# Build client saja
RUN npm run build -w client

FROM nginx:alpine

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80