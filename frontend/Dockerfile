# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2 — Serve
FROM nginx:1.25-alpine
RUN rm -rf /usr/share/nginx/html/*
# The build output for project 'healthmap' is configured in angular.json as 'dist/public'
COPY --from=builder /app/dist/public/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
