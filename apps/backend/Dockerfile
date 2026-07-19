FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8080

CMD ["node", "server.js"]
