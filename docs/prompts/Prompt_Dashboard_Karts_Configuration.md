# Prompt Antigravity — Dashboard : Panneau de Personnalisation des Karts
### Remplace la version précédente — implémente la technique validée (Blender pièces nommées → R3F → canvas pour la plaque)
### À exécuter après le prompt Backend Karts (mis à jour)

---

## Contexte
Ce panneau reprend exactement la technique décrite dans le rapport technique fourni : un modèle de base de kart (fourni en orange, pièces nommées individuellement dans Blender), affiché et personnalisé en React Three Fiber, avec recoloration par pièce et génération dynamique du numéro de plaque via un `<canvas>` HTML converti en texture.

## 1. Où placer ce panneau
Onglet **"Personnalisation Karts"**, visible pour les espaces de catégorie karting (route : `/espaces/:id/karts`), accessible selon la permission `kart:manage` (SUPERADMIN sur tout espace de son entreprise, ADMIN/EMPLOYE sur leur `assignedSpaceId`).

## 2. Structure

```
src/pages/KartsCustomizationPage.jsx
src/components/karts/
├── KartList.jsx              # liste des karts configurés (miniature, plaque, actions)
├── KartCustomizer.jsx        # écran d'édition d'un kart : aperçu 3D + contrôles
├── KartPreviewCanvas.jsx     # scène R3F affichant le modèle .glb de base avec les couleurs/plaque appliquées
├── PieceColorPicker.jsx      # un color picker par pièce personnalisable
├── PlateNumberInput.jsx      # saisie du numéro de plaque
└── plateTexture.js           # fonction utilitaire : dessine le numéro sur un canvas et retourne une CanvasTexture
```

## 3. Implémentation technique (reprend le rapport pas à pas)

### 3.1 Chargement et identification des pièces
Dans `KartPreviewCanvas.jsx`, charge le modèle de base avec `useGLTF` (`@react-three/drei`). Parcours la hiérarchie de meshes chargée (`scene.traverse(...)`) et identifie chaque mesh dont le nom correspond à une pièce personnalisable (convention : préfixe `piece_`, ex: `piece_carrosserie`, `piece_aileron`). Construis dynamiquement la liste des pièces personnalisables disponibles à partir de ce qui est réellement présent dans le modèle chargé (pas une liste codée en dur), pour que l'interface s'adapte automatiquement si le modèle Blender évolue.

### 3.2 Recoloration par pièce
Pour chaque pièce identifiée, affiche un `PieceColorPicker`. Au changement de couleur :
```javascript
mesh.material = mesh.material.clone(); // cloner avant modification pour ne pas affecter d'autres instances partageant le même matériau de base
mesh.material.color.set(nouvelleCouleur);
```
Stocke les couleurs choisies dans l'état local sous la forme `{ [nomPiece]: couleurHex }`, correspondant exactement au format `couleurs` (Json) attendu par le Backend.

### 3.3 Génération de la plaque (canvas → texture)
Dans `plateTexture.js` :
```javascript
export function generatePlateTexture(numero) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numero, canvas.width / 2, canvas.height / 2);
  return new THREE.CanvasTexture(canvas);
}
```
Trouve le mesh de la plaque (convention : `piece_plaque`), applique cette texture sur son matériau (`mesh.material.map = texture; mesh.material.needsUpdate = true;`). Régénère la texture à chaque changement du numéro saisi dans `PlateNumberInput`.

### 3.4 Instanciation de plusieurs karts (aperçu liste)
Dans `KartList.jsx`, pour afficher une miniature de chaque kart configuré sans dupliquer la géométrie : partage la géométrie de base entre toutes les instances, clone uniquement les matériaux par kart (`material.clone()`), comme décrit dans le rapport — important pour la performance si plusieurs karts sont affichés simultanément (ex: une vue d'ensemble de la flotte).

## 4. Comportement général

1. **Liste des karts** (`KartList`) : vignettes 3D ou statiques de chaque kart configuré, avec sa plaque, bouton "Modifier", "+ Ajouter un kart".
2. **Édition** (`KartCustomizer`) : aperçu 3D en grand (rotation/zoom via les contrôles de caméra fournis par `@react-three/drei`, ex: `OrbitControls`), un color picker par pièce, un champ pour le numéro de plaque, mise à jour en temps réel de l'aperçu.
3. **Sauvegarde** : `POST`/`PUT /api/espaces/:id/karts` avec `{ numeroPlaque, couleurs }`.
4. **Validation** : numéro de plaque unique dans l'espace (le Backend le refuse sinon, à afficher clairement côté interface avant même l'envoi si possible).

## 5. Exigences UI
- Palette de couleurs suggérées + option couleur libre (color picker complet) par pièce.
- Interface simple : l'objectif reste "configurer un kart en moins d'une minute", pas un outil de design avancé.

## 6. Livrables
1. Onglet "Personnalisation Karts" fonctionnel, technique conforme au rapport (pièces nommées, canvas pour la plaque, clonage de matériau).
2. Aperçu 3D fidèle à ce qui sera sauvegardé.
3. `README.md` du dashboard mis à jour avec une section "Personnalisation des karts", incluant la convention de nommage des pièces (`piece_*`) à respecter côté Blender.

## Consignes finales
- Respecte strictement la convention de nommage des pièces définie ici (`piece_carrosserie`, `piece_aileron`, `piece_plaque`, etc.) — communique cette convention à la personne qui exportera le modèle final depuis Blender, sinon la détection automatique des pièces personnalisables échouera silencieusement.
- Cette même configuration (`couleurs` + `numeroPlaque`) sera relue par Unity au runtime (voir le prompt de liaison Unity) — assure-toi que les noms de pièces utilisés côté web correspondent exactement aux noms des objets dans le modèle importé côté Unity (les noms Blender sont conservés à l'export, dans les deux formats .glb et .fbx, tant que le modèle source est le même).
