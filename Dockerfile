FROM node:22-bullseye-slim AS deps-env

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .

CMD ["npm", "run", "dev"]
