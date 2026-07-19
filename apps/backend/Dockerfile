FROM node:20-alpine AS build

WORKDIR /app

RUN apk upgrade --no-cache

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

COPY --from=build --chown=65532:65532 /app /app

EXPOSE 8080

CMD ["server.js"]
