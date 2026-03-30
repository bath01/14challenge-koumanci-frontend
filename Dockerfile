# Etape 1 : Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# En production Docker, l'API passe par le proxy nginx sur /api/v1
ENV VITE_API_URL=/api/v1
ENV VITE_WS_URL=wss://api.koumanci.chalenge14.com

RUN npm run build

# Etape 2 : Servir avec Nginx
FROM nginx:alpine

# Copier la config Nginx personnalisee
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
