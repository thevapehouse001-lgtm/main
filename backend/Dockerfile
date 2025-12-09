FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json prisma ./
COPY prisma ./prisma
RUN npm install
COPY src ./src
RUN npm run build && npm prune --production
CMD ["node", "dist/index.js"]
