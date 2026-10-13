FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server ./server
COPY lib ./lib
COPY content ./content
COPY scripts/admin-user.mjs scripts/admin-backup.mjs scripts/mail-check.mjs ./scripts/
USER node
EXPOSE 3101
CMD ["node", "server/start.mjs"]
