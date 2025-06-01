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

# Copy client build files from previous stage
COPY --from=builder /app/dist ./client/build

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy server code
COPY server/index.mjs ./server/

ENV PORT=10000
ENV NODE_ENV=production

EXPOSE 10000

# Start backend server
CMD ["node", "server/index.mjs"]
