# Build stage
FROM node:18 AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app

# Install serve for serving the React build
RUN npm install -g serve

# Copy build files from previous stage
COPY --from=builder /app/build ./build

# Copy backend code and package.json for backend dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source files
COPY . .

ENV PORT=10000
EXPOSE 10000

# Start backend server (change this if your backend start script is different)
CMD ["node", "server.js"]
