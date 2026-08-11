# Hergla Park — Système Multi-Tenant, Dashboard & Visite Virtuelle 3D

Ce monorepo regroupe l'ensemble des sous-systèmes du projet **Hergla Park**, une plateforme SaaS multi-tenant complète combinant gestion d'attractions, éditeur de scènes 3D interactives (karting, restaurant, kid zone, café) et site vitrine de visite virtuelle VR.

---

## 📁 Arborescence du Monorepo

```
Hergla-Park/
├── backend/            # API NestJS + Prisma ORM + PostgreSQL / Neon
├── dashboard/          # Dashboard Admin React.js (Vite, Tailwind, R3F, Three.js)
├── vr-landing/         # Site vitrine public avec parcours interactif VR
├── 3d-assets/          # Fichiers Blender (.blend), exports FBX (Unity) et GLB (web)
├── docs/               # Planning, rapports, maquettes Stitch et cahier des charges
├── .gitignore
├── .gitattributes
└── README.md
```

---

## 🛠️ Stack Technique

| Périmètre | Technologies utilisées |
|---|---|
| **Backend** | NestJS, TypeScript, Prisma ORM, PostgreSQL (Neon / Docker local), Passport JWT, Swagger OpenAPI, Multer |
| **Dashboard Admin** | React 19, Vite, Tailwind CSS, Lucide React, Axios, React Three Fiber, Three.js, React-Hot-Toast |
| **Site Vitrine VR** | React 19, Vite, Vanilla CSS, Lucide React |
| **Modélisation 3D** | Blender, exports FBX / GLB, Git LFS |

---

## 🏢 Architecture Multi-Tenant & Rôles System / Custom

### Isolation Multi-Tenant
La plateforme utilise une **isolation logique par `companyId`** (`Company` model).
Chaque requête authentifiée extrait le `companyId` du JWT et filtre automatiquement les opérations en base (`where: { companyId }`).

### Hiérarchie des Rôles (ROOT, RBAC)
- **ROOT** : Super-utilisateur plateforme global (`isRootIntervention`, logs d'audit multi-entreprises).
- **SUPERADMIN** : Administrateur d'une entreprise (gestion des utilisateurs, espaces, karts, catalogue 3D).
- **ADMIN / EMPLOYE** : Responsable d'espace assigné (`assignedSpaceId`). Permissions `kart:manage` / `kart:read` scopées à l'espace assigné.

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend (`backend/`)

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
* API : `http://localhost:5000`
* Swagger Docs : `http://localhost:5000/api-docs`

### 2. Démarrer le Dashboard Admin (`dashboard/`)

```bash
cd ../dashboard
cp .env.example .env
npm install
npm run dev
```
* Interface : `http://localhost:5173`

### 3. Démarrer le Site Vitrine VR (`vr-landing/`)

```bash
cd ../vr-landing
cp .env.example .env
npm install
npm run dev
```
* Site Vitrine : `http://localhost:5174`

---

## 📦 Note sur Git LFS (Large File Storage)

Afin d'éviter d'encombrer le dépôt avec des fichiers 3D lourds, Git LFS est configuré dans `.gitattributes` pour suivre les extensions suivantes :
- `.blend`
- `.fbx`
- `.glb`
- `.gltf`

Avant tout commit de modèles 3D, exécutez `git lfs install` localement.
