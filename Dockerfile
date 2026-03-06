# -- Build stage --
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ARG EXPO_PUBLIC_API_URL
RUN echo "EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}" > .env

RUN npx expo export --platform web

# -- Production stage --
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
