# Utiliser une image Node.js officielle comme image de base
FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
COPY . /app

WORKDIR /app

# Installer les dépendances du projet
RUN npm install

# Copier le reste des fichiers du projet dans le répertoire de travail

# Construire le projet
RUN npm run build
EXPOSE 3000

CMD ["node", "dist/src/main.js"]

# Exposer le port sur lequel l'application va écouter

# Définir la commande pour démarrer l'application