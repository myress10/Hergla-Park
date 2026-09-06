# Prompt Antigravity — Frontend : Dashboard 100% Fonctionnel + Éditeur 3D
### Extension du Dashboard Admin React (Semaine 2) — CRUD complet + onglet Éditeur 3D

---

## Contexte

Le dashboard admin existant doit devenir **entièrement fonctionnel**, sans aucune action manquante (ajouter/modifier/supprimer partout où c'est pertinent). En plus, ajoute un nouvel onglet **"Éditeur 3D"** par espace, permettant de visualiser la scène 3D de l'espace, d'y glisser-déposer des objets depuis un catalogue, de les positionner précisément, de sauvegarder, et de réinitialiser à l'état d'origine en cas d'erreur.

## Stack additionnelle nécessaire
- `@react-three/fiber` (rendu Three.js en React)
- `@react-three/drei` (helpers : `OrbitControls`, `TransformControls`, `useGLTF`, `Environment`)
- Chargement de fichiers `.glb` via `useGLTF`

---

## 1. Compléter le CRUD existant (aucune fonction manquante)

### Page `UsersPage.jsx` (SUPERADMIN)
- Bouton **"+ Ajouter un utilisateur"** → formulaire modal (nom, email, mot de passe, rôle, espace assigné) → `POST /api/users`
- Action **"Modifier"** par ligne → formulaire modal pré-rempli → `PUT /api/users/:id`
- Action **"Supprimer"** par ligne → modal de confirmation ("Cette action est irréversible") → `DELETE /api/users/:id`
- Gestion des erreurs (ex: suppression du dernier SUPERADMIN refusée par le backend) → message clair affiché à l'utilisateur

### Page `EspacesOverviewPage.jsx` (SUPERADMIN) / `MyEspacePage.jsx` (ADMIN/EMPLOYE)
- Bouton **"+ Créer un espace"** (SUPERADMIN uniquement) → formulaire modal (nom, catégorie, statut initial) → `POST /api/espaces`
- Action **"Modifier les informations"** → formulaire modal (nom, catégorie, `donneesSpecifiques`) → `PUT /api/espaces/:id`
- Action **"Supprimer un espace"** (SUPERADMIN uniquement) → modal de confirmation renforcée (taper le nom de l'espace pour confirmer, car ça supprime aussi sa scène 3D) → `DELETE /api/espaces/:id`
- Toggle de statut déjà existant → vérifier qu'il fonctionne bien dans les 3 états (Ouvert/Fermé/Maintenance), pas juste un booléen

**Consigne générale** : passe en revue chaque écran existant et liste (en commentaire dans le code ou dans le README) toute action CRUD qui manquait et que tu as ajoutée, pour que ce soit traçable.

---

## 2. Nouvel onglet "Éditeur 3D" par espace

### Accès et navigation
- Nouvel item de menu dans la sidebar : "Éditeur 3D" (visible pour SUPERADMIN sur chaque espace via un sélecteur, et pour ADMIN/EMPLOYE directement sur leur espace assigné)
- Route : `/espaces/:id/editeur-3d`

### Structure de l'écran

```
src/pages/SceneEditorPage.jsx
src/components/scene-editor/
├── SceneCanvas.jsx          # Canvas React Three Fiber (rendu de la scène)
├── SceneObjectMesh.jsx      # rendu d'un objet placé (glTF + TransformControls si sélectionné)
├── ObjectCatalogPanel.jsx   # panneau latéral : catalogue d'objets (draggable)
├── ObjectUploadModal.jsx    # formulaire d'upload d'un modèle .glb custom
├── PlacedObjectsList.jsx    # liste des objets actuellement placés (sélection précise, suppression)
└── SceneToolbar.jsx         # boutons Enregistrer / Réinitialiser / Annuler
```

### Comportement détaillé

1. **Chargement initial** : `GET /api/espaces/:id/scene` → charge `baseSceneUrl` (scène de base en glTF via `useGLTF`) + les `placements` existants, rendus comme des objets positionnés dans la scène.
2. **Catalogue d'objets** (`ObjectCatalogPanel`) : liste des `Object3D` (`GET /api/objects3d`), affichés en vignettes (thumbnail), groupés par `categorie`. Chaque vignette est **draggable** (attribut HTML `draggable`).
3. **Glisser-déposer dans la scène** :
   - Au `drop` sur le `SceneCanvas`, calcule la position 3D correspondant au point de dépôt via un raycasting depuis la position du curseur (coordonnées écran → coordonnées 3D sur le plan du sol de la scène).
   - Ajoute un nouvel objet dans l'état local (`placements`) à cette position, avec rotation/échelle par défaut.
4. **Sélection et ajustement précis** :
   - Clic sur un objet placé → le sélectionne, affiche un `TransformControls` (drei) permettant de déplacer/tourner/redimensionner à la souris.
   - `PlacedObjectsList` liste aussi tous les objets placés avec un bouton "Sélectionner" (pratique quand un objet est difficile à cliquer directement) et un bouton "Supprimer" (retire l'objet de l'état local).
5. **Upload d'un modèle custom** : bouton "Uploader un objet" → `ObjectUploadModal` → `POST /api/objects3d/upload` (multipart) → l'objet apparaît ensuite dans le catalogue.
6. **Sauvegarde** : bouton "Enregistrer" (`SceneToolbar`) → envoie l'état complet des `placements` à `PUT /api/espaces/:id/scene` → toast de confirmation.
7. **Réinitialisation** : bouton "Réinitialiser à l'original" → modal de confirmation explicite ("Toutes les modifications non enregistrées seront perdues et la disposition d'origine sera restaurée") → `POST /api/espaces/:id/scene/reset` → recharge la scène.
8. **Annuler les changements non sauvegardés** : bouton "Annuler" qui recharge simplement l'état sauvegardé côté serveur (`GET /api/espaces/:id/scene`) sans passer par le reset vers l'original (différence importante : "Annuler" = revenir à la dernière sauvegarde, "Réinitialiser" = revenir à la toute première version).

### UX / sécurité anti-erreur
- Indicateur visuel clair de l'état : "Modifications non enregistrées" affiché tant que l'état local diffère de la dernière sauvegarde.
- Empêcher la navigation hors de la page si des modifications ne sont pas sauvegardées (confirmation navigateur standard).
- Limiter le déplacement des objets à l'intérieur des limites raisonnables de la scène (bounding box) pour éviter qu'un objet parte hors du monde 3D par erreur.

---

## 3. Permissions à respecter côté frontend (en plus du backend)
- SUPERADMIN : accès à l'éditeur 3D de tous les espaces, peut uploader ET ajouter au catalogue de base, peut définir une disposition comme nouvelle version "originale".
- ADMIN/EMPLOYE : accès uniquement à l'éditeur de leur `assignedSpaceId`, peut utiliser le catalogue et uploader des objets custom, mais **ne voit pas** l'option "Définir comme original" (réservée SUPERADMIN).

## 4. Livrables
1. Dashboard sans aucune action CRUD manquante sur `users` et `espaces`.
2. Onglet "Éditeur 3D" pleinement fonctionnel : chargement de scène, catalogue draggable, transform gizmo, upload custom, sauvegarde, annulation, réinitialisation.
3. `README.md` mis à jour avec une section "Éditeur 3D" expliquant le fonctionnement pour un utilisateur non-technique (comment ajouter un objet, comment annuler une erreur).

## Consignes finales
- Utilise `@react-three/drei` autant que possible plutôt que de réimplémenter du raycasting/gizmo à la main.
- Le "Réinitialiser à l'original" doit être une action difficile à déclencher par erreur (double confirmation) car elle est destructive pour les modifications sauvegardées.
- Garde le canevas 3D performant : limite le nombre de polygones affichés en prévisualisation si besoin (les modèles définitifs haute qualité restent dans Unity, ici c'est un outil d'agencement, pas le rendu final).
