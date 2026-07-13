# Hergla Park — Système de Gestion et Visite Virtuelle 3D

Ce monorepo regroupe l'ensemble des modules du projet **Hergla Park**, un système complet de gestion d'attractions et de visite virtuelle interactive (karting, restaurant, kid zone, café).

---

## 📁 Arborescence du Monorepo

```
Hergla-Park/
├── backend/             # API REST NestJS, ORM Prisma & PostgreSQL
├── dashboard/           # Interface d'administration React (Vite, Tailwind, R3F)
├── vr-landing/          # Site vitrine avec intégration de visite virtuelle VR
├── 3d-assets/           # Assets Blender (.blend), exports FBX et modèles GLB
├── docs/                # Documents de cadrage, planning PDF et rapports
└── README.md            # Ce fichier (vue d'ensemble)
```

---

## 🛠️ Stack Technique

| Périmètre | Technologies utilisées |
|---|---|
| **Backend** | NestJS, TypeScript, Prisma ORM, PostgreSQL, Docker, Passport JWT, Multer |
| **Dashboard Admin** | React, Vite, Vanilla CSS, Lucide React, Axios, React Three Fiber, Three.js, React-Hot-Toast |
| **Site Vitrine VR** | React, Vite, Vanilla CSS, Lucide React |
| **Modélisation 3D** | Blender, exports FBX / GLB, Git LFS |

---

## 📈 État d'Avancement (Semaines 1 à 8)

*   **Semaine 1 (Backend CRUD & Auth)** : ✅ Complété (Inscription, Connexion JWT, Hachage bcrypt, CRUD de base utilisateurs et espaces)
*   **Semaine 2 (Éditeur 3D Relational & Panel)** : ✅ Complété (Placement d'objets persistant, reset transactionnel, définition de version originale par SUPERADMIN, drag-and-drop, uploads GLB/Vignettes)
*   **Semaine 3 (Intégration Unity / WebGL)** : ⬜ Non démarré
*   **Semaine 4 (Statistiques & Graphiques)** : ⬜ Non démarré
*   **Semaine 5 (Gestion des réservations & tickets)** : ⬜ Non démarré
*   **Semaine 6 (Site Vitrine final & Visite Virtuelle)** : ⬜ Non démarré
*   **Semaine 7 (Tests de charge & Optimisations)** : ⬜ Non démarré
*   **Semaine 8 (Déploiement final & CI/CD)** : ⬜ Non démarré

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js (v18+)
- Docker et Docker Compose (pour PostgreSQL)
- Git LFS installé (`git lfs install`)

---

### 2. Démarrer le Backend

1. Accédez au dossier `backend/` :
   ```bash
   cd backend
   ```
2. Créez un fichier `.env` à partir de `.env.example` et configurez vos accès :
   ```bash
   cp .env.example .env
   ```
3. Démarrez la base de données PostgreSQL via Docker :
   ```bash
   docker-compose up -d
   ```
4. Installez les dépendances et appliquez les schémas de base de données :
   ```bash
   npm install
   npx prisma db push
   ```
5. Lancez le serveur en mode développement :
   ```bash
   npm run start:dev
   ```
   *L'API est accessible sur `http://localhost:5000` et la doc Swagger sur `http://localhost:5000/api-docs`.*

---

### 3. Démarrer le Dashboard Admin

1. Accédez au dossier `dashboard/` :
   ```bash
   cd ../dashboard
   ```
2. Créez un fichier `.env` (ou `.env.local`) :
   ```bash
   cp .env.example .env
   ```
3. Installez les dépendances et démarrez l'application :
   ```bash
   npm install
   npm run dev
   ```
   *Le dashboard est accessible sur `http://localhost:5173`.*

---

### 4. Démarrer le Site Vitrine VR

1. Accédez au dossier `vr-landing/` :
   ```bash
   cd ../vr-landing
   ```
2. Installez les dépendances et démarrez :
   ```bash
   npm install
   npm run dev
   ```

---

## 📦 Note sur Git LFS (Large File Storage)

Afin d'éviter d'encombrer le dépôt avec des fichiers 3D lourds, Git LFS est configuré pour suivre les extensions suivantes :
- `.blend`
- `.fbx`
- `.glb`
- `.gltf`

Avant tout commit contenant des modèles 3D, assurez-vous d'avoir exécuté `git lfs install` localement.
