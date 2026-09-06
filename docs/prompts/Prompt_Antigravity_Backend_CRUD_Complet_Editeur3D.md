# Prompt Antigravity — Backend : CRUD Complet + Éditeur 3D
### Extension du backend NestJS/Prisma/PostgreSQL (Semaine 1) pour supporter le dashboard complet

---

## Contexte

Le backend NestJS existant (`/api/auth`, `/api/users`, `/api/espaces`) doit être complété :
1. Aucune opération CRUD ne doit manquer (créer/lire/modifier/supprimer sur `User` et `Espace`, avec les bonnes règles de rôles).
2. Ajouter un système complet de **gestion de scène 3D par espace** : un catalogue d'objets 3D, le placement de ces objets dans la scène d'un espace (position/rotation/échelle), la sauvegarde, et un **reset vers l'état d'origine**.

## 1. Vérification/complétion du CRUD existant

Reprends `users.controller.ts`/`users.service.ts` et `espaces.controller.ts`/`espaces.service.ts` et assure-toi qu'il ne manque **aucune** opération :

### `/api/users`
- `POST /api/users` (création — équivalent register mais côté gestion admin, SUPERADMIN uniquement)
- `GET /api/users` (liste, SUPERADMIN)
- `GET /api/users/:id` (détail, authentifié)
- `PUT /api/users/:id` (modification complète : nom, email, rôle, assignedSpaceId — SUPERADMIN, ou l'utilisateur lui-même pour ses propres infos non sensibles)
- `PATCH /api/users/:id/password` (changement de mot de passe séparé, avec re-hash Bcrypt)
- `DELETE /api/users/:id` (suppression, SUPERADMIN uniquement, avec vérification qu'on ne supprime pas le dernier SUPERADMIN du système)

### `/api/espaces`
- `POST /api/espaces` (création, SUPERADMIN)
- `GET /api/espaces` (liste, public)
- `GET /api/espaces/:id` (détail, public)
- `PUT /api/espaces/:id` (modification complète : nom, catégorie, statut, donneesSpecifiques — SUPERADMIN, ou ADMIN/EMPLOYE limité à leur `assignedSpaceId`)
- `DELETE /api/espaces/:id` (suppression, SUPERADMIN uniquement, avec suppression en cascade des `ScenePlacement` associés)

Si une de ces routes manque ou est incomplète dans le code existant, complète-la. N'en laisse aucune de côté.

---

## 2. Nouveaux modèles Prisma — Éditeur de scène 3D

Ajoute dans `prisma/schema.prisma` :

```prisma
model Object3D {
  id            String   @id @default(uuid())
  nom           String
  categorie     String        // ex: "mobilier", "decoration", "signaletique"
  modelUrl      String        // URL/chemin du fichier .glb dans le catalogue de base
  thumbnailUrl  String?       // vignette pour l'affichage dans le panneau catalogue
  isCustom      Boolean  @default(false)   // true si uploadé par un admin, false si catalogue de base
  uploadedById  String?
  uploadedBy    User?    @relation(fields: [uploadedById], references: [id])
  createdAt     DateTime @default(now())
  placements    ScenePlacement[]
}

model ScenePlacement {
  id          String   @id @default(uuid())
  espaceId    String
  espace      Espace   @relation(fields: [espaceId], references: [id], onDelete: Cascade)
  object3DId  String
  object3D    Object3D @relation(fields: [object3DId], references: [id])
  positionX   Float
  positionY   Float
  positionZ   Float
  rotationX   Float    @default(0)
  rotationY   Float    @default(0)
  rotationZ   Float    @default(0)
  scaleX      Float    @default(1)
  scaleY      Float    @default(1)
  scaleZ      Float    @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Modifie le modèle `Espace` existant pour ajouter :
```prisma
model Espace {
  // ... champs existants
  baseSceneUrl       String?           // URL du fichier .glb de la scène de base (export Blender)
  originalSceneData  Json?             // snapshot JSON de la disposition d'origine des objets (pour le reset)
  placements         ScenePlacement[]
}
```

Génère la migration : `npx prisma migrate dev --name add_scene_editor`.

---

## 3. Module `objects3d` (catalogue)

```
src/objects3d/
├── objects3d.module.ts
├── objects3d.controller.ts
├── objects3d.service.ts
└── dto/
    ├── create-object3d.dto.ts
    └── upload-object3d.dto.ts
```

Endpoints :
- `GET /api/objects3d` — liste du catalogue (accessible à tout utilisateur authentifié), filtrable par `categorie`
- `POST /api/objects3d` — ajout au catalogue de base (SUPERADMIN uniquement, `isCustom: false`)
- `POST /api/objects3d/upload` — upload d'un modèle `.glb` custom par un ADMIN/EMPLOYE (`isCustom: true`, `uploadedById` = utilisateur courant)
  - Utilise `@UseInterceptors(FileInterceptor('file'))` (Multer), valide l'extension (`.glb` uniquement) et une taille max raisonnable (ex: 10 Mo)
  - Stocke le fichier (stockage local `/uploads/models/` pour le développement, mais prévois une abstraction `StorageService` facilement remplaçable par un stockage cloud plus tard)
- `DELETE /api/objects3d/:id` — suppression (SUPERADMIN, ou l'utilisateur qui a uploadé le modèle pour ses propres uploads custom)

---

## 4. Module scène — endpoints rattachés à `espaces`

Ajoute dans `espaces.controller.ts` :

- `GET /api/espaces/:id/scene` — retourne `{ baseSceneUrl, placements: ScenePlacement[] }` pour l'espace donné
- `PUT /api/espaces/:id/scene` — remplace l'intégralité des placements de la scène :
  - Body : tableau de `{ object3DId, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ }`
  - Logique : supprime les anciens `ScenePlacement` de cet espace, recrée les nouveaux dans une transaction Prisma (`prisma.$transaction`)
  - **Restriction de rôle** : SUPERADMIN peut modifier n'importe quel espace ; ADMIN/EMPLOYE uniquement si `espaceId === req.user.assignedSpaceId` (403 sinon)
- `POST /api/espaces/:id/scene/reset` — restaure la disposition d'origine :
  - Supprime tous les `ScenePlacement` actuels de l'espace
  - Recrée les placements à partir de `espace.originalSceneData` (le snapshot JSON stocké)
  - Même restriction de rôle que ci-dessus
- `POST /api/espaces/:id/scene/set-as-original` — (SUPERADMIN uniquement) capture l'état actuel des `ScenePlacement` et l'enregistre dans `originalSceneData`, pour définir un nouveau point de référence si le SUPERADMIN valide une disposition comme étant la nouvelle "version officielle"

---

## 5. Documentation Swagger

- Documente tous les nouveaux endpoints (`@ApiTags('objects3d')`, `@ApiTags('scene')`) avec `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth()`.
- Pour l'upload, documente le `@ApiConsumes('multipart/form-data')` et le schéma du fichier attendu.

## 6. Livrables

1. Migration Prisma appliquée, modèles `Object3D` et `ScenePlacement` fonctionnels.
2. Tous les endpoints listés ci-dessus fonctionnels et testables via Swagger UI.
3. Aucune route CRUD manquante sur `users` et `espaces` par rapport à la liste de la section 1.
4. `README.md` mis à jour avec la nouvelle section "Éditeur de scène 3D" expliquant le fonctionnement du catalogue, du placement, et du reset.

## Consignes finales
- Toute modification de scène doit être transactionnelle (pas d'état intermédiaire incohérent en cas d'erreur).
- Vérifie systématiquement les permissions par rôle sur les routes de scène — c'est le point le plus sensible de cette extension (un EMPLOYE ne doit jamais pouvoir modifier la scène d'un autre espace).
- Ne casse aucune route existante de la Semaine 1 en modifiant le schéma Prisma.
