# Stage 1: Build the Angular application
FROM node:24-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY angular/package.json angular/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY angular/. .

# Build the application based on the provided environment
# Valid values for ANGULAR_ENV: production, development
ARG ANGULAR_ENV=production
RUN npm run build -- --configuration ${ANGULAR_ENV}

# Stage 2: Serve the application with Nginx
FROM nginx:1.30

# Remove default Nginx server configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from the builder stage
COPY --from=builder /app/dist/posh/browser /usr/share/nginx/html

EXPOSE 80