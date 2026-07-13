# Carting Hergla Park Backend API (Semaine 1)

Ce dépôt contient le code source du backend de gestion du parc d'attractions **Hergla Park** (piste de karting, café, restaurant, espaces enfants). 
Le projet est développé avec le framework **NestJS**, l'ORM **Prisma** et une base de données **PostgreSQL**.

---

## 🛠️ Stack Technique
- **Framework** : NestJS (TypeScript natif)
- **Base de Données** : PostgreSQL (exécutée via Docker Compose)
- **ORM** : Prisma
- **Sécurité** : Strategy Passport JWT (`@nestjs/jwt` + `@nestjs/passport`), BcryptJS
- **Documentation** : Swagger OpenAPI (accessible sur `/api-docs`)

---

## 👥 Répartition Modulaire (Rourou / Sassi)

Le backend a été divisé en deux périmètres de développement clés :

- **Rourou** :
  - Initialisation de la base de données : configuration [schema.prisma](prisma/schema.prisma) et migrations.
  - Module `Auth` : Inscription (`POST /api/auth/register`), Connexion (`POST /api/auth/login`), hachage bcrypt, vérification des informations d'identification et génération de token JWT.
  - Module `Users` : Logique de services et contrôleurs pour le CRUD utilisateur (`/api/users`).
- **Sassi** :
  - Module `Common & Security` : Filtre global des exceptions ([http-exception.filter.ts](src/common/filters/http-exception.filter.ts)), décorateur de rôle ([roles.decorator.ts](src/common/decorators/roles.decorator.ts)), middlewares [JwtAuthGuard](src/auth/guards/auth.guard.ts) et [RolesGuard](src/auth/guards/roles.guard.ts).
  - Module `Espaces` : CRUD complet pour les zones d'attractions (`/api/espaces`) avec validation de propriété.
  - Intégration Swagger OpenAPI globale et préparation des scripts de tests.

---

## 🔑 Rôles et Permissions

| Rôle | Portée des permissions |
|---|---|
| **SUPERADMIN** | Accès total. Gère les comptes utilisateurs (CRUD) et peut créer, modifier (nom, catégorie, etc.) et supprimer n'importe quel espace. |
| **ADMIN** | Permissions limitées. Ne peut modifier que le statut et les données spécifiques de l'espace de gestion auquel il est assigné (`assignedSpaceId`). |
| **EMPLOYE** | Identique au rôle d'ADMIN. Limité à la mise à jour opérationnelle (statut, données de scores) de son propre espace assigné. |
| **Public / Guest** | Accès libre en lecture seule (`GET /api/espaces` et `GET /api/espaces/:id`) sans authentification requis (site vitrine, Unity VR). |

---

## 🏃 Démarrage Rapide

### 1. Lancer la Base de Données PostgreSQL (Docker)
Démarrez le conteneur de base de données PostgreSQL en arrière-plan :
```bash
docker-compose up -d
```
*Le port `5432` sera exposé localement.*

### 2. Installer les Dépendances
Installez les dépendances du projet :
```bash
npm install
```

### 3. Exécuter les Migrations Prisma
Créez la base de données PostgreSQL et appliquez le schéma Prisma initial :
```bash
npx prisma migrate dev --name init
```

### 4. Lancer le Serveur en Mode Développement
Démarrez l'application NestJS :
```bash
npm run start:dev
```
Le serveur écoute par défaut sur le port `5000`.

---

## 📝 Tests et Documentation de l'API

Exposez et testez l'ensemble des routes directement depuis l'interface Swagger interactive :
👉 [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### Procédure de Test Manuel
1. **Créer un Compte SUPERADMIN** :
   Faites un `POST /api/auth/register` avec `"role": "SUPERADMIN"`.
2. **Obtenir le Token JWT** :
   Faites un `POST /api/auth/login` avec les identifiants créés pour récupérer le token dans la réponse.
3. **S'authentifier dans l'interface Swagger** :
   Cliquez sur le bouton **Authorize** en haut à droite, collez le token JWT récupéré et validez.
4. **Créer un Espace** :
   Faites un `POST /api/espaces` avec le rôle SUPERADMIN (ex: Café). Notez l'ID de l'espace créé.
5. **Créer un EMPLOYE assigné** :
   Enregistrez un nouvel utilisateur avec le rôle `EMPLOYE` et renseignez son `assignedSpaceId` avec l'ID obtenu à l'étape précédente.
6. **Tester les restrictions** :
   - Connectez-vous avec le token de l'EMPLOYE.
   - Tentez de modifier un autre espace ou d'altérer les métadonnées (nom, catégorie) de son espace : le serveur renverra un code d'erreur `403 Forbidden`.
   - Tentez de modifier uniquement le statut de son espace assigné : l'opération réussira avec un code `200 OK`.

---

## 🎮 Éditeur de Scène 3D (Semaine 2)

### Vue d'ensemble

L'éditeur 3D permet de placer, déplacer, tourner et redimensionner des objets 3D (`.glb`) dans la scène virtuelle de chaque espace du parc. Les modifications sont persistées en base de données (PostgreSQL, via Prisma).

### Architecture

```
Catalogue (sidebar gauche)      SceneCanvas (Three.js / R3F)      Panneau droit
┌──────────────────────┐        ┌──────────────────────────────┐   ┌─────────────────┐
│  Objets 3D (GLB)     │ drag→  │  Ground plane raycasting     │   │  Objets placés  │
│  groupés par categ.  │        │  SceneObjectMesh (clone GLB) │   │  (sélect/suppr) │
│  Recherche intégrée  │        │  TransformControls (drag,    │   │                 │
│  [Importer .glb]     │        │  rotate, scale)              │   │  Propriétés     │
└──────────────────────┘        └──────────────────────────────┘   └─────────────────┘
```

### Endpoints API (Backend NestJS)

| Méthode | Route | Rôle requis | Description |
|---------|-------|------------|-------------|
| `GET`  | `/api/objects3d` | Tous | Lister le catalogue d'objets 3D |
| `POST` | `/api/objects3d` | SUPERADMIN | Créer un objet (lien URL externe) |
| `POST` | `/api/objects3d/upload` | SUPERADMIN | Importer un fichier `.glb` (multipart) |
| `DELETE` | `/api/objects3d/:id` | SUPERADMIN | Supprimer un objet du catalogue |
| `GET`  | `/api/espaces/:id/scene` | Auth | Récupérer la scène d'un espace |
| `PUT`  | `/api/espaces/:id/scene` | Auth + assigné | Sauvegarder les placements |
| `POST` | `/api/espaces/:id/scene/reset` | Auth + assigné | Réinitialiser à la version originale |
| `POST` | `/api/espaces/:id/scene/set-as-original` | SUPERADMIN | Définir la scène actuelle comme référence |

### Migrations de la base de données (Semaine 2)

Appliquer le nouveau schéma incluant les modèles `Object3D` et `ScenePlacement` :

```bash
npx prisma migrate dev --name add_scene_editor
```

Cela génère automatiquement le client Prisma avec les nouveaux types.

### Utilisation de l'éditeur (Dashboard React)

1. **Accéder à l'éditeur** :
   Naviguez vers `/editeur-3d` depuis le menu latéral (ou `/espaces/:id/editeur-3d` pour un espace précis).

2. **Sélectionner un espace** (SUPERADMIN seulement) :
   Utilisez le sélecteur déroulant en haut de page pour choisir l'espace à éditer.

3. **Ajouter un objet** :
   Depuis le panneau gauche (catalogue), **glissez** un objet vers le canvas 3D. Il sera positionné à l'endroit du sol où vous le déposez.

4. **Transformer un objet** :
   Cliquez sur un objet dans la scène pour le sélectionner. Des **poignées de transformation** (TransformControls) apparaissent pour le déplacer, le tourner ou le redimensionner.

5. **Annuler** :
   Le bouton **Annuler** (ou `Ctrl+Z`) retire le dernier placement.

6. **Enregistrer** :
   Cliquez sur **Enregistrer** pour persister la scène en base de données. Un indicateur orange signale les modifications non sauvegardées.

7. **Réinitialiser** :
   Le bouton **Réinitialiser** restaure la scène à la dernière version originale de référence.

8. **Définir comme original** *(SUPERADMIN uniquement)* :
   Une fois la scène enregistrée, cliquez sur **Définir original** pour que la disposition actuelle devienne la nouvelle référence pour les futures réinitialisations.

9. **Importer un objet 3D** :
   Cliquez sur l'icône **Upload** dans le catalogue pour importer un fichier `.glb`. Les fichiers uploadés sont stockés dans `uploads/models/` sur le serveur.

### Variables d'environnement (Frontend)

Créez un fichier `.env.local` dans `hergla-park-dashboard/` :

```env
VITE_API_URL=http://localhost:5000/api
```

Les URL des fichiers `.glb` et des thumbnails stockés sur le backend seront résolus automatiquement depuis `http://localhost:5000`.

### Structure Prisma (Semaine 2)

```prisma
model Object3D {
  id           String           @id @default(uuid())
  nom          String
  categorie    String
  modelUrl     String
  thumbnailUrl String?
  placements   ScenePlacement[]
  createdAt    DateTime         @default(now())
}

model ScenePlacement {
  id        String   @id @default(uuid())
  espaceId  String
  espace    Espace   @relation(fields: [espaceId], references: [id], onDelete: Cascade)
  object3DId String
  object3D  Object3D @relation(fields: [object3DId], references: [id], onDelete: Cascade)
  positionX Float    @default(0)
  positionY Float    @default(0)
  positionZ Float    @default(0)
  rotationX Float    @default(0)
  rotationY Float    @default(0)
  rotationZ Float    @default(0)
  scaleX    Float    @default(1)
  scaleY    Float    @default(1)
  scaleZ    Float    @default(1)
  isOriginal Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

