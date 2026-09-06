# Prompt Antigravity — Backend : Configuration des Karts (Numéro & Couleur)
### Extension du backend NestJS/Prisma — nécessaire avant le panneau dashboard et l'intégration Unity

---

## Contexte
Le SUPERADMIN (ou un ADMIN/EMPLOYE avec la permission adéquate, limité à l'espace Karting qui leur est assigné) doit pouvoir définir combien de karts existent sur la piste, et pour chacun personnaliser la couleur de chaque pièce de la carrosserie ainsi que le numéro affiché sur la plaque, à partir d'un modèle de base unique (fourni en orange). Cette configuration doit ensuite être consultable par l'application Unity (chargement runtime via UnityGLTF, voir le prompt de liaison Unity) pour que la visite virtuelle reflète fidèlement ce qui a été configuré.

**Approche retenue** : chaque pièce personnalisable du modèle 3D du kart est nommée individuellement dès l'export Blender (ex: `piece_carrosserie`, `piece_aileron`, `piece_capot`), ce qui permet de cibler et recolorer son matériau indépendamment côté web (technique validée séparément — voir le prompt Dashboard associé). Le Backend stocke simplement, pour chaque kart, la couleur choisie par pièce et le numéro de plaque.

## 1. Nouveau modèle Prisma

```prisma
model Kart {
  id             String   @id @default(uuid())
  espaceId       String
  espace         Espace   @relation(fields: [espaceId], references: [id], onDelete: Cascade)
  numeroPlaque   String                       // ex: "07" — dessiné dynamiquement sur la texture de la plaque
  couleurs       Json                         // map { "piece_carrosserie": "#E53935", "piece_aileron": "#1A1A1A" }
  modeleBaseUrl  String?                      // URL du modèle .glb de base (orange) si différent du modèle par défaut de l'espace
  actif          Boolean  @default(true)      // permet de désactiver un kart sans le supprimer (maintenance)
  ordre          Int      @default(0)         // ordre d'affichage dans le panneau et sur la piste
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([espaceId, numeroPlaque])          // deux karts du même espace ne peuvent pas avoir la même plaque
}
```

Ajoute la relation inverse sur `Espace` :
```prisma
model Espace {
  // ... champs existants
  karts       Kart[]
}
```

**Validation du champ `couleurs`** : dans le DTO, vérifie que chaque valeur est un code hexadécimal valide (`#RRGGBB`), et que les clés utilisées correspondent à des noms de pièces réellement présents sur le modèle de base (liste de référence à définir une fois le modèle Blender finalisé — en attendant, accepter toute clé sans validation stricte des noms).

Génère la migration : `npx prisma migrate dev --name add_karts`.

## 2. Nouvelle permission
Ajoute au catalogue de permissions (voir système de rôles déjà en place) :
```
kart:manage   — créer/modifier/supprimer les karts d'un espace
kart:read     — lire la configuration des karts (utilisé aussi par le futur endpoint public consommé par Unity)
```
Attribue `kart:manage` et `kart:read` par défaut à SUPERADMIN et ADMIN ; `kart:read` seul à EMPLOYE.

## 3. Endpoints

### Gestion (authentifiée, dans `espaces.controller.ts` ou un nouveau `karts.controller.ts`)
- `GET /api/espaces/:id/karts` — liste des karts de l'espace (nécessite `kart:read`, scopé `companyId` comme le reste du système)
- `POST /api/espaces/:id/karts` — création d'un kart (`numeroPlaque`, `couleurs`), nécessite `kart:manage`
- `PUT /api/espaces/:id/karts/:kartId` — modification (numéro et/ou couleurs par pièce et/ou actif), nécessite `kart:manage`
- `DELETE /api/espaces/:id/karts/:kartId` — suppression, nécessite `kart:manage`
- `PUT /api/espaces/:id/karts/reorder` — met à jour le champ `ordre` pour plusieurs karts en une requête (utile si le dashboard permet de réordonner par glisser-déposer)

**Règle de permission déjà en place à respecter** : un ADMIN/EMPLOYE ne peut gérer que les karts de son `assignedSpaceId` ; un SUPERADMIN peut gérer ceux de n'importe quel espace de son entreprise ; isolation multi-tenant stricte comme pour tout le reste (`companyId` de l'espace doit correspondre à celui de l'utilisateur).

### Endpoint public (consommé par Unity ET par l'aperçu web, pas d'authentification — comme le pattern déjà utilisé pour le statut Ouvert/Fermé du Café)
- `GET /api/companies/:slug/espaces/:espaceId/karts` — retourne uniquement les karts `actif: true`, triés par `ordre`, avec `numeroPlaque`, `couleurs`, et `modeleBaseUrl`. Format de réponse minimal :
  ```json
  [
    { "numeroPlaque": "07", "couleurs": { "piece_carrosserie": "#E53935", "piece_aileron": "#1A1A1A" }, "modeleBaseUrl": "https://.../kart_base.glb" },
    { "numeroPlaque": "12", "couleurs": { "piece_carrosserie": "#1E88E5", "piece_aileron": "#FFFFFF" }, "modeleBaseUrl": "https://.../kart_base.glb" }
  ]
  ```

## 4. Documentation Swagger
Documente tous les nouveaux endpoints (`@ApiTags('karts')`), y compris l'endpoint public avec une mention claire "Consommé par l'application Unity — aucune authentification requise".

## 5. Livrables
1. Migration Prisma appliquée, modèle `Kart` fonctionnel.
2. Tous les endpoints listés fonctionnels et testables via Swagger.
3. Permissions `kart:manage`/`kart:read` intégrées au système de rôles existant, respectant la hiérarchie et l'isolation multi-tenant déjà en place.
4. `README.md` du backend mis à jour avec une section "Configuration des karts".

## Consignes finales
- Réutilise les guards et intercepteurs déjà en place (`PermissionsGuard`, `TenantInterceptor`) — n'invente pas un nouveau mécanisme de vérification pour cette fonctionnalité.
- L'endpoint public doit rester volontairement minimal (uniquement ce dont Unity a besoin pour l'affichage) — ne pas exposer d'informations internes (id, timestamps) sur cette route publique.
