# Utiliser une image Node.js officielle comme image de base
FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
COPY . /app
COPY ./.env /app

WORKDIR /app

# Installer les dépendances du projet
RUN npm install

# Copier le reste des fichiers du projet dans le répertoire de travail

# Construire le projet
RUN npm run build

# Exposer le port sur lequel l'application va écouter
EXPOSE 3000

# Définir la commande pour démarrer l'application
# CMD ["node", "dist/src/main.js"]
RUN npm run start