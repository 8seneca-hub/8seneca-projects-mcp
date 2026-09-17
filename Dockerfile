FROM node:22-alpine

WORKDIR /app

# --ignore-scripts because `prepare` builds, and src isn't copied yet.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# No prune: zod and zod-to-json-schema sit in devDependencies but the tool
# schemas import them at runtime.
ENV NODE_ENV=production
EXPOSE 8080

# stdio is the default mode; this image only ever serves http.
CMD ["node", "build/index.js", "http"]
