# Build comum das jornadas, do design system e da API.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci
COPY apps apps
COPY packages packages
RUN npm run build

FROM node:22-alpine AS api
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/domain ./packages/domain
RUN mkdir -p /app/apps/api/data /app/apps/api/uploads && chown -R node:node /app
WORKDIR /app/apps/api
USER node
ENV HOST=0.0.0.0 PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM nginxinc/nginx-unprivileged:1.28-alpine AS web
COPY infrastructure/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
