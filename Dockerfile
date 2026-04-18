# Frontend Vite + React build, served via nginx with reverse proxy to the backend.
# EasyPanel: Build Type = Dockerfile, Build Path = / (raiz)
# Build Args: VITE_API_URL (opcional — default "/api" via proxy nginx)
# Runtime envs (nginx): BACKEND_URL, API_KEY (NUNCA mais no bundle)

FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências usando o lockfile para builds reprodutíveis
COPY package.json package-lock.json* bun.lockb* ./
RUN npm ci || npm install

# Copia o código. VITE_API_URL é opcional; default "/api" usa o proxy nginx.
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage de runtime: nginx servindo dist/ + proxy reverso para o backend
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Defaults — sobrescreva no EasyPanel
ENV BACKEND_URL=http://backend:3001
ENV API_KEY=""

EXPOSE 80
# nginx-alpine processa /etc/nginx/templates/*.template via envsubst no entrypoint
CMD ["nginx", "-g", "daemon off;"]
