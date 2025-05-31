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

# Install serve for serving the React build
RUN npm install -g serve

# Copy client build files from previous stage
COPY --from=builder /app/build ./client/build

# Copy server code and install server dependencies
COPY server/package*.json ./server/
RUN npm install --prefix ./server --production
COPY server/ . /server/

ENV PORT=10000
EXPOSE 10000

# Start backend server (change this if your backend start script is different)
CMD ["node", "server/index.js"]
