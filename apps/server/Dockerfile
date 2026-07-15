FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . ./

EXPOSE 8787
CMD ["npm", "start"]
