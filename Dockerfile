# Base contracts build stage
FROM node:22-alpine AS contracts-build
WORKDIR /app/packages/contracts
COPY packages/contracts/package*.json ./
COPY packages/contracts/tsconfig.json ./
RUN npm ci
COPY packages/contracts/src ./src
RUN npm run build

# Frontend build stage
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY --from=contracts-build /app/packages/contracts /app/packages/contracts
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# Frontend production stage with nginx (unprivileged non-root user)
FROM nginxinc/nginx-unprivileged:alpine AS frontend
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=frontend-build /app/frontend/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Backend production stage (default build target)
FROM node:22-alpine AS backend

# SECURITY & PROCESS: Install tini init and create non-root user
RUN apk add --no-cache tini && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
# Copy built contracts into workspace
COPY --chown=appuser:appgroup --from=contracts-build /app/packages/contracts /app/packages/contracts

WORKDIR /app/backend

# Copy package files
COPY --chown=appuser:appgroup backend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy backend source
COPY --chown=appuser:appgroup backend/ ./

USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Process init for signal forwarding and zombie reaping
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
