FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json .
COPY vite.config.ts .
COPY tsconfig.json .
COPY tailwind.config.js .
COPY postcss.config.js .

RUN npm ci

COPY src/ ./src

RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
