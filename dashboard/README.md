# Hergla Park — Admin Dashboard (Semaine 2)

Frontend React.js du dashboard d'administration de **Hergla Park**, connecté à l'API NestJS/Prisma de la Semaine 1.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routage | react-router-dom v7 |
| Appels API | Axios + intercepteurs JWT |
| i18n | react-i18next (FR / AR) |
| State | Context API (AuthContext, LangContext) |
| Notifications | react-hot-toast |
| Icônes | lucide-react |

---

## Prérequis

- Node.js >= 18
- Le backend NestJS (Semaine 1) doit tourner sur `http://localhost:5000`

---

## Installation

```bash
# 1. Se placer dans le dossier
cd hergla-park-dashboard

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Installer les dépendances
npm install

# 4. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## Variables d'environnement

Fichier `.env` (copier depuis `.env.example`) :

```env
VITE_API_URL=http://localhost:5000/api
```

> Modifier `VITE_API_URL` si le backend tourne sur un autre port ou hôte.

---

## Logique de rôles & routes

| Rôle | Page par défaut | Accès autorisé |
|---|---|---|
| `SUPERADMIN` | `/espaces` | `/espaces`, `/utilisateurs`, `/mon-profil` |
| `ADMIN` | `/mon-espace` | `/mon-espace`, `/mon-profil` |
| `EMPLOYE` | `/mon-espace` | `/mon-espace`, `/mon-profil` |

### Redirections automatiques
- Non authentifié → `/login`
- Rôle insuffisant → page par défaut du rôle
- Après login → page selon rôle (`SUPERADMIN` → `/espaces`, autres → `/mon-espace`)

---

## Internationalisation (FR / AR)

La bascule de langue se trouve dans la topbar (mode `toggle`) et sur la page de login (mode `dropdown`).

Quand la langue `AR` est sélectionnée :
- `document.documentElement.dir = "rtl"` est appliqué automatiquement
- Le layout Tailwind utilise les classes logiques `ms-`, `me-`, `ps-`, `pe-` pour s'inverser correctement
- La langue est persistée dans `localStorage` (clé : `hergla_lang`)

---

## Architecture du code

```
src/
├── api/               # Modules Axios (authApi, usersApi, espacesApi)
│   └── axiosClient.js # Instance + intercepteurs JWT + logout 401
├── context/
│   ├── AuthContext.jsx  # user, token, login(), logout(), rehydration
│   └── LangContext.jsx  # lang, switchLang(), isRTL
├── routes/
│   ├── ProtectedRoute.jsx  # Redirige si non authentifié
│   └── RoleRoute.jsx       # Redirige si rôle insuffisant
├── layouts/
│   └── DashboardLayout.jsx # Sidebar fixe + Topbar + <Outlet/>
├── pages/
│   ├── LoginPage.jsx            # Formulaire de connexion
│   ├── EspacesOverviewPage.jsx  # SUPERADMIN : grille globale
│   ├── MyEspacePage.jsx         # ADMIN/EMPLOYE : espace assigné
│   ├── UsersPage.jsx            # SUPERADMIN : gestion utilisateurs
│   └── NotFoundPage.jsx
├── components/
│   ├── Sidebar.jsx        # Navigation conditionnelle par rôle
│   ├── EspaceCard.jsx     # Card générique d'espace
│   ├── StatusBadge.jsx    # Badge coloré OUVERT/FERME/MAINTENANCE
│   ├── StatusToggle.jsx   # Toggle avec mise à jour optimiste
│   ├── LangSwitcher.jsx   # Sélecteur FR/AR (2 variants)
│   ├── Modal.jsx          # Modal réutilisable
│   └── SkeletonCard.jsx   # Skeleton loader
└── i18n/
    ├── index.js   # Configuration i18next
    ├── fr.json    # Traductions françaises
    └── ar.json    # Traductions arabes
```

---

## Fonctionnalités implémentées

### Authentification
- Login via `POST /api/auth/login`
- Token JWT stocké en mémoire (Context) + `localStorage` (persistance)
- Logout : efface le token, redirige vers `/login`
- Rehydration automatique de la session au rechargement

### Gestion des espaces (SUPERADMIN)
- Vue grille avec statuts colorés en temps réel
- Stats agrégées : Ouverts / Fermés / Maintenance / Staff
- Création d'espace via modal → `POST /api/espaces`
- Toggle de statut avec **mise à jour optimiste** → `PUT /api/espaces/:id`
- Rollback automatique en cas d'erreur API

### Mon Espace (ADMIN/EMPLOYE)
- Hero banner avec image par catégorie
- Boutons de statut opérationnel (Ouvert / Maintenance / Fermeture d'urgence)
- Formulaire dynamique `donneesSpecifiques` (paires clé/valeur)
- Sauvegarde via `PUT /api/espaces/:id`

### Gestion des utilisateurs (SUPERADMIN)
- Table avec recherche, onglets (Tous / Admins / Employés), pagination
- Création via `POST /api/auth/register`
- Édition via `PUT /api/users/:id`
- Suppression via `DELETE /api/users/:id`

---

### Configuration des karts (SUPERADMIN, ADMIN, EMPLOYE)
- Onglet dédié **"Configuration Karts"** (route `/espaces/:id/karts` et `/configuration-karts`) pour les espaces Karting.
- Formulaire d'édition interactive par kart (`numero` de course 1 à 3 caractères, `couleur` carrosserie hexadécimale, toggle `actif` pour maintenance).
- Validation stricte de l'unicité des numéros de karts en temps réel.
- Réordonnancement par flèches haut/bas et mise à jour batch de l'ordre d'affichage (`ordre`).
- **Aperçu 3D en direct (React Three Fiber)** : rendu temps réel des karts 3D sur piste avec carrosserie colorée et badge de numéro de course 3D mis à jour dynamiquement à chaque modification avant sauvegarde.
- Sauvegarde synchronisée avec les endpoints NestJS (`POST`, `PUT`, `DELETE /api/espaces/:id/karts` et `PUT /api/espaces/:id/karts/reorder`).

---

## Build de production

```bash
npm run build
```

Les fichiers de production sont générés dans `dist/`.

---

## Notes de développement

- **Pas de données mockées** : tout est connecté à l'API backend
- **Images d'espaces** : générées dynamiquement depuis Unsplash par catégorie (pas de champ `imageUrl` dans le schéma actuel)
- **CORS** : assurez-vous que le backend autorise `http://localhost:5173` en développement

