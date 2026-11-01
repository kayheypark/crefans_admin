FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG CREFANS_API_ORIGIN=http://api:3001
ENV CREFANS_API_ORIGIN=$CREFANS_API_ORIGIN
COPY package*.json ./
RUN npm ci
COPY next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts ./
COPY public ./public
COPY src ./src
COPY lib ./lib
COPY utils ./utils
COPY .eslintrc.json ./.eslintrc.json
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3002 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3002
CMD ["node", "server.js"]
