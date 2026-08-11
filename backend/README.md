# Hergla Park — Backend API (NestJS / Prisma)

Ce dossier contient l'API REST multi-tenant pour la plateforme **Hergla Park**, développée avec NestJS, Prisma ORM, PostgreSQL (Neon / local) et Swagger.

---

## 🏎️ Configuration des Karts (Numéro & Couleur)

L'extension Karts permet de configurer la flotte de karts sur la piste (numéro de course et couleur de carrosserie) par espace de type Karting.
Cette configuration est ensuite exposée sous forme d'endpoint public minimal consommé directement par l'application **Unity VR** pour la visite virtuelle.

### Permissions de Rôle
- `kart:manage` — Créer, modifier, réordonner et supprimer les karts d'un espace (attribué par défaut à `SUPERADMIN` et `ADMIN`, ainsi que `ROOT`).
- `kart:read` — Consulter la configuration des karts d'un espace (attribué par défaut à `SUPERADMIN`, `ADMIN` et `EMPLOYE`, ainsi que `ROOT`).

---

### Endpoints d'Administration (Authentifiés JWT)

Toutes les routes authentifiées respectent l'isolation multi-tenant stricte (`companyId`) et le périmètre d'espace assigné (`assignedSpaceId`) pour les rôles `ADMIN` / `EMPLOYE`.

| Méthode | Route | Permission | Description |
|---|---|---|---|
| `GET` | `/api/espaces/:id/karts` | `kart:read` | Récupère la liste de tous les karts configurés pour l'espace. |
| `POST` | `/api/espaces/:id/karts` | `kart:manage` | Crée un nouveau kart (`numero`, `couleur`, `actif?`, `ordre?`). Contrainte d'unicité sur `(espaceId, numero)`. |
| `PUT` | `/api/espaces/:id/karts/reorder` | `kart:manage` | Met à jour l'ordre d'affichage (`ordre`) de plusieurs karts en une seule requête batch. |
| `PUT` | `/api/espaces/:id/karts/:kartId` | `kart:manage` | Modifie le numéro, la couleur, le statut `actif` ou l'ordre d'un kart. |
| `DELETE` | `/api/espaces/:id/karts/:kartId` | `kart:manage` | Supprime un kart de la piste. |

---

### Endpoint Public (Unity VR — Aucune Authentification)

Ce routeur est consommé directement par l'application Unity VR pour styliser les karts virtuels sur la piste 3D.

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/companies/:slug/espaces/:espaceId/karts` | **Aucune** | Retourne la liste minimale des karts actifs (`actif: true`), triés par `ordre` croissant. |

#### Exemple de réponse JSON minimale (Unity) :
```json
[
  { "numero": "07", "couleur": "#E53935" },
  { "numero": "12", "couleur": "#1E88E5" }
]
```

---

## 🛠️ Démarrage et Scripts

```bash
# Installation des dépendances
npm install

# Génération du client Prisma & migrations
npx prisma generate
npx prisma db push

# Exécution des Seeds (permissions + données initiales)
npm run db:seed

# Lancement du serveur de développement
npm run start:dev

# Build de production
npm run build
```

Documentation Swagger interactive disponible sur : `http://localhost:5000/api-docs`
