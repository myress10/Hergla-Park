# Prompt Antigravity — Prototype Karting Jouable (Three.js / React Three Fiber)
### À exécuter après le prompt Backend LapTimes. Remplace temporairement le `UnityPlaceholder` du site vitrine VR.

---

## Contexte
Avant l'intégration complète de la visite immersive sous Unity (plus tard), on construit un **prototype karting jouable directement dans le navigateur**, avec React Three Fiber et un moteur physique (Rapier), pour valider rapidement la sensation de jeu, tester le concept, et avoir quelque chose de concret à montrer. Ce prototype réutilise la configuration des karts (numéro/couleur) déjà définie côté backend/dashboard, et le classement des temps.

## Stack à ajouter (dans le projet `vr-landing` existant)
```bash
npm install @react-three/fiber @react-three/drei @react-three/rapier three
```
`@react-three/rapier` embarque Rapier (physique WASM) — vérifie la documentation officielle la plus récente pour la syntaxe exacte du contrôleur de véhicule par raycast au moment de l'implémentation (l'API de ce package évolue, ne suppose pas une syntaxe figée sans la vérifier).

## 1. Structure du prototype

```
vr-landing/src/karting-prototype/
├── KartingPrototypePage.jsx      # route /prototype-karting
├── PhysicsWorld.jsx               # wrapper <Physics> Rapier (gravité, config du monde)
├── Track.jsx                      # piste (GLB si disponible, sinon anneau primitif temporaire) + colliders trimesh
├── KartController.jsx             # RigidBody + contrôleur raycast (accélération/direction/frein), lecture clavier
├── FollowCamera.jsx               # caméra qui suit le kart avec un léger lissage (lerp position/rotation)
├── CheckpointSystem.jsx           # colliders invisibles détectant le passage, calcule le temps de tour
├── LapTimerHud.jsx                # overlay HTML : chrono en cours, meilleur tour de la session
├── KartSelector.jsx               # écran avant course : choix parmi les karts configurés (numéro/couleur)
├── LeaderboardPanel.jsx           # affichage + soumission du classement (API LapTime)
├── TouchControls.jsx              # boutons tactiles (accélérer/freiner/gauche/droite) pour tablette/mobile
└── hooks/
    └── useKeyboardControls.js     # Z/Q/S/D + flèches
```

## 2. Comportement détaillé

### 2.1 Écran de sélection du kart
- Au chargement de `/prototype-karting`, appelle `GET /api/companies/{slug}/espaces/{espaceId}/karts` (endpoint public déjà créé) pour lister les karts configurés depuis le dashboard.
- Affiche chaque kart (couleur en aperçu, numéro), le visiteur en choisit un pour démarrer.

### 2.2 Piste et physique
- `PhysicsWorld` : `<Physics gravity={[0, -9.81, 0]}>` de `@react-three/rapier`.
- `Track` : si un export GLB de la piste existe déjà (Semaine 3-4), le charger via `useGLTF` et générer un collider `trimesh` fixe dessus. En attendant, utiliser une piste primitive temporaire (anneau ou circuit simple en géométrie procédurale) clairement identifiée comme provisoire dans le code (commentaire `// TODO: remplacer par l'export Blender définitif`).

### 2.3 Contrôleur du kart
- `RigidBody` dynamique pour le châssis, avec un centre de gravité abaissé (comme prévu dans le planning Unity original, section 6.1, pour éviter les tonneaux).
- Contrôleur de véhicule par raycast (4 points simulant les roues) : accélération/marche arrière, direction, freinage, pilotés par `useKeyboardControls` (Z/Q/S/D ou flèches) et par `TouchControls` sur tablette.
- Applique la couleur du kart choisi sur le matériau de la carrosserie (`material.color.set(...)`) et affiche son numéro (texte 3D simple via `@react-three/drei` `<Text>`, ou décalque si un vrai modèle de kart est disponible).

### 2.4 Caméra
- `FollowCamera` : positionnée derrière et légèrement au-dessus du kart, avec un lissage (lerp) sur la position et la direction du regard, pour un effet dynamique similaire à ce qui était prévu avec Cinemachine côté Unity.

### 2.5 Chrono et checkpoints
- `CheckpointSystem` : quelques colliders invisibles (`sensor`) répartis sur la piste, dont un servant de ligne de départ/arrivée.
- Démarre le chrono au premier passage de la ligne de départ, calcule le temps de tour à chaque passage suivant, affiche le temps en cours et le meilleur tour de la session dans `LapTimerHud`.

### 2.6 Fin de tour et classement
- Après un tour complet, propose de saisir un pseudo et de soumettre le temps (`POST /api/companies/{slug}/espaces/{espaceId}/laptimes`).
- `LeaderboardPanel` affiche ensuite le top 10 (`GET .../laptimes?limit=10`), avec le numéro de kart utilisé si disponible.

### 2.7 Contrôles tactiles
- `TouchControls` : boutons superposés en bas de l'écran (accélérer, freiner, gauche, droite), visibles uniquement sur écran tactile (détection simple de la taille d'écran ou de `navigator.maxTouchPoints`), pour rester cohérent avec l'accessibilité tablette déjà visée sur le site vitrine.

## 3. Intégration avec le parcours existant — écran de choix

**Changement important par rapport à la version précédente de ce prompt** : le prototype Three.js ne remplace plus le build Unity, il devient une **option proposée au visiteur**, à côté de la visite immersive complète.

Sur la `LaunchPage` du site vitrine, avant de charger quoi que ce soit, affiche un écran de choix avec deux options :
- **"Visite immersive complète"** (badge "🥽 Casque VR bientôt disponible" à côté, désactivé pour l'instant) → charge le build Unity WebGL (voir le prompt Unity dédié), expérience au clavier/souris pour l'instant, pensée pour être compatible casque VR plus tard.
- **"Essai rapide Karting"** (badge "⚡ Instantané, dans le navigateur") → charge ce prototype Three.js.

Composant à ajouter : `ExperienceChoice.jsx`, affiché avant `UnityEmbed` ou `KartingPrototypePage` selon le choix du visiteur. Garde `UnityPlaceholder`/`UnityEmbed` intact (ne le supprime pas ni ne le commente) — les deux chemins doivent rester fonctionnels en parallèle, ce n'est plus un remplacement temporaire.

## 4. Limitations assumées pour ce prototype (à documenter clairement)
- Modèles 3D définitifs (piste détaillée, kart réaliste) pas encore disponibles → primitives/placeholders temporaires, facilement remplaçables une fois les exports Blender prêts.
- Un seul kart jouable à la fois, pas de multi-joueur (le classement reste asynchrone, par soumission de temps).
- Ce prototype devient une option permanente ("essai rapide") aux côtés de la visite Unity, pas une solution temporaire à remplacer — le code doit rester isolé dans `karting-prototype/` pour rester facile à maintenir indépendamment du reste du site vitrine.

## 5. Livrables
1. Prototype jouable et accessible sur `/prototype-karting`.
2. Contrôleur de véhicule avec une sensation de conduite correcte (accélération, freinage, virage fluides).
3. Chrono + checkpoints fonctionnels.
4. Sélection de kart connectée à la configuration réelle du backend (couleur/numéro).
5. Classement fonctionnel (soumission + affichage en temps réel).
6. Écran de choix (`ExperienceChoice.jsx`) intégré dans la `LaunchPage`, proposant les deux options sans supprimer le chemin Unity.
7. `README.md` de `vr-landing` mis à jour avec une section expliquant le statut de ce prototype (temporaire, en attendant l'intégration Unity).

## Consignes finales
- Vérifie la documentation à jour de `@react-three/rapier` pour l'API exacte du contrôleur de véhicule par raycast avant de l'implémenter — ne pas supposer une syntaxe qui pourrait avoir changé.
- Garde les performances en tête : limite le nombre de polygones de la piste temporaire, active le `<Physics>` en mode debug uniquement en développement (pas en production).
- Ce prototype doit rester ludique et réactif avant tout — privilégie une sensation de conduite amusante (arcade) plutôt qu'un réalisme physique poussé.
