FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose the port your app listens on
EXPOSE 8080

CMD ["node", "server.js"]

