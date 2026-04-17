# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS frontend-dev
WORKDIR /app

# Install frontend dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source.
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM node:20-alpine AS backend-dev
WORKDIR /app/backend

# Install backend dependencies first for better layer caching.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy backend source.
COPY backend ./

EXPOSE 3001
CMD ["node", "server.js"]