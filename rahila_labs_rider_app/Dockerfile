# Flutter Rider App - Web Build
# Note: This builds Flutter for web. For mobile (APK/IPA), use local build tools

FROM ghcr.io/cirruslabs/flutter:latest as builder

WORKDIR /app

# Copy pubspec files
COPY pubspec.yaml pubspec.lock* ./

# Get dependencies
RUN flutter pub get

# Copy application code
COPY . .

# Build Flutter web
RUN flutter build web --release

# Production stage - Serve Flutter web app with Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built Flutter web app
COPY --from=builder /app/build/web .

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
