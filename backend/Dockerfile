# Stage 1: Builder
# Construit l'application TypeScript en JavaScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
# L'image finale, légère et optimisée pour la production
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]

# Stage 3: Development
# Étape dédiée au développement, avec toutes les dépendances
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
# On installe TOUTES les dépendances, y compris "devDependencies"
RUN npm ci
COPY . .
# La commande sera surchargée par docker-compose, mais on met un défaut
CMD ["npm", "run", "dev"]
