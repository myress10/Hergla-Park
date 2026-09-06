# Prompt Antigravity — Backend : Temps au Tour & Classement (Leaderboard)
### Petite extension nécessaire avant le prototype karting Three.js

---

## Contexte
Le prototype karting jouable (Three.js/React Three Fiber) a besoin de sauvegarder les temps au tour des visiteurs et d'afficher un classement, sans nécessiter de compte utilisateur (accès public, comme un visiteur qui essaie la visite virtuelle).

## 1. Nouveau modèle Prisma

```prisma
model LapTime {
  id         String   @id @default(uuid())
  espaceId   String
  espace     Espace   @relation(fields: [espaceId], references: [id], onDelete: Cascade)
  kartId     String?
  kart       Kart?    @relation(fields: [kartId], references: [id])
  pseudo     String                     // pseudo saisi librement par le visiteur, pas de compte requis
  tempsMs    Int                        // temps du tour en millisecondes
  createdAt  DateTime @default(now())
}
```
Ajoute la relation inverse sur `Espace` (`lapTimes LapTime[]`) et sur `Kart` (`lapTimes LapTime[]`).

Génère la migration : `npx prisma migrate dev --name add_laptimes`.

## 2. Endpoints publics (pas d'authentification — un visiteur n'a pas de compte)

- `POST /api/companies/:slug/espaces/:espaceId/laptimes`
  - Body : `{ "pseudo": "string (2-20 caractères)", "tempsMs": number, "kartId": "string (optionnel)" }`
  - Validation : `tempsMs` doit être un entier positif raisonnable (ex: entre 5 000 et 600 000 ms) pour filtrer les valeurs aberrantes envoyées par erreur ou par manipulation basique côté client.
  - `pseudo` : filtrer les caractères spéciaux/injections basiques, limiter la longueur.
- `GET /api/companies/:slug/espaces/:espaceId/laptimes?limit=10`
  - Retourne les meilleurs temps triés par `tempsMs` croissant, limités à `limit` (défaut 10, max 50).
  - Format minimal : `[{ "pseudo": "...", "tempsMs": 47230, "numeroKart": "07" }]` (jointure avec `Kart` pour inclure le numéro si disponible, pas besoin d'exposer l'id interne).

## 3. Documentation Swagger
Documente ces deux routes (`@ApiTags('laptimes')`), en précisant clairement qu'elles sont publiques et destinées à être appelées directement depuis le prototype karting côté navigateur.

## 4. Livrables
1. Migration Prisma appliquée, modèle `LapTime` fonctionnel.
2. Les deux endpoints fonctionnels et testables via Swagger.
3. `README.md` du backend mis à jour avec une section "Classement des temps".

## Consigne finale
Cette fonctionnalité reste volontairement simple (pas de compte, pas d'anti-triche poussé) — c'est un prototype pour valider l'expérience, pas un système de classement compétitif définitif.
