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

# Install runtime and build dependencies for node-canvas
# We need build tools even for --omit=dev because canvas might need to recompile or check bindings
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
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

# Clean up build-only dependencies to keep image small
RUN apk del build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

EXPOSE 3000

CMD ["npm", "run", "start"]
