
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="nsk.svg" width="200" alt="Nest Logo" /></a>
</p>

Bienvenue dans le **NestJS Starter Kit (NSK)**, une solution clé en main pour démarrer rapidement vos projets en suivant les meilleures pratiques de développement moderne. Ce starter kit inclut des intégrations essentielles pour construire des applications performantes, sécurisées et évolutives.

## 🚀 Fonctionnalités Principales

1. **Drizzle ORM**  
   Simplifie la gestion de la base de données avec une approche moderne et intuitive.

2. **Authentification JWT**  
   Un système sécurisé d'authentification basé sur JSON Web Tokens, adapté aux applications modernes.

3. **Gestion des Rôles**  
   Implémente un système de rôles et permissions pour un contrôle d'accès granulaire.

4. **Envoi d'emails avec Nodemailer**  
   Configuration prête à l'emploi pour gérer les envois d'emails via SMTP, avec un service local (MailDev) pour le développement.

5. **Stockage d'objets avec MinIO**  
   Une alternative open source à AWS S3 pour gérer vos fichiers de manière performante.

6. **Docker-Compose Préconfiguré**  
   Une infrastructure prête à déployer avec des services essentiels :
    - **PostgreSQL** : Base de données relationnelle robuste.
    - **PgAdmin** : Interface web pour gérer PostgreSQL.
    - **MailDev** : Simulateur SMTP pour tester les emails.
    - **MinIO** : Stockage objet pour fichiers et médias.

## 🛠️ Configuration des Services (Docker)

Les services sont gérés par un fichier `docker-compose.yml`. Voici un aperçu des services inclus :

### MailDev
- Interface pour visualiser les emails envoyés localement.
- Ports configurés :
    - Web : `http://localhost:1080`
    - SMTP : `localhost:1025`

### PostgreSQL
- Base de données principale du projet.
- Port configuré : `localhost:5432`

### PgAdmin
- Interface pour gérer la base de données PostgreSQL.
    - Accès : `http://localhost:8888`
    - Identifiants par défaut :
        - Email : `username@nsk.com`
        - Mot de passe : `strong-password`

### MinIO
- Solution de stockage objet pour gérer vos fichiers.
    - Console : `http://localhost:9001`
    - Accès :
        - Utilisateur : `user_nsk`
        - Mot de passe : `password`

## 🏗️ Installation et Lancement

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/username/nestjs-starter-kit.git
   cd nestjs-starter-kit
   ```

2. Configurez les variables d'environnement dans un fichier `.env` (exemple fourni dans `.env.example`).

3. Démarrez les services Docker :
   ```bash
   docker-compose up -d
   ```

4. Installez les dépendances Node.js :
   ```bash
   npm install
   ```

5. Lancez l'application en mode développement :
   ```bash
   npm run start:dev
   ```

6. Accédez à l'application :
    - Backend API : `http://localhost:3000`

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Nodemailer](https://nodemailer.com/)
- [MinIO Documentation](https://docs.min.io/)

## 🧑‍💻 Contribuer

Les contributions sont les bienvenues ! Merci de soumettre une issue ou une pull request pour toute suggestion ou amélioration.
