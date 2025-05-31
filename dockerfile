# Stage 1: Build React app
FROM node:18 AS client-builder
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# Stage 2: Set up backend server
FROM node:18
WORKDIR /app

# Copy backend files
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server ./server

# Copy built React app into backend's public directory
COPY --from=client-builder /app/client/build ./server/public

# Set env PORT for Render
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["node", "server/index.js"]
