# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for node-canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for node-canvas
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    fontconfig \
    ttf-freefont

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
