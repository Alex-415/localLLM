# Build stage
FROM node:18 AS builder
WORKDIR /app

# Install client dependencies and build React app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app

# Copy the entire app from builder stage
COPY --from=builder /app ./

ENV PORT=10000
ENV NODE_ENV=production

EXPOSE 10000

# Start backend server
CMD ["node", "server/index.mjs"]
