# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build project
RUN npm run build

# Production stage
FROM nginx:alpine

WORKDIR /app

# Install Node.js to run visitor counter API
RUN apk add --no-cache nodejs

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy visitor counter API source
COPY server ./server

ENV VISITOR_PORT=7000
ENV VISITOR_DATA_DIR=/data

# Expose HTTP port
EXPOSE 555

CMD ["sh", "-c", "node /app/server/visitor-api.js & nginx -g 'daemon off;'"]
