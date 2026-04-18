# Frontend Vite + React build, served via nginx.
# EasyPanel: Build Type = Dockerfile, Build Path = / (raiz)
# Build Args necessários: VITE_API_URL, VITE_API_KEY

FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências usando o lockfile para builds reprodutíveis
COPY package.json package-lock.json* bun.lockb* ./
RUN npm ci || npm install

# Copia o código e injeta as variáveis VITE_* em build time
COPY . .
ARG VITE_API_URL
ARG VITE_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY

RUN npm run build

# Stage de runtime: nginx servindo dist/ com fallback SPA
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
