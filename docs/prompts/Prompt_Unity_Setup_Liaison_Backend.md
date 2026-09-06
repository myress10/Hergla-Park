# Prompt Antigravity — Unity : Setup du Projet + Liaison Backend
### Anticipe la Semaine 5 du planning (Setup Unity + Liaison API) — à exécuter après les prompts Backend/Dashboard Karts

---

## Contexte
Avant que la modélisation détaillée (Semaine 3-4) ne soit terminée, on prépare la structure du projet Unity et le pipeline de communication avec le Backend, pour que l'intégration future (import des modèles, mise en place de la scène) se fasse sur des fondations déjà prêtes. Deux liaisons Backend sont à couvrir : le statut des espaces (Ouvert/Fermé, déjà prévu dans le planning original) et la **configuration des karts** (numéro + couleur, nouvelle fonctionnalité).

**Important** : une partie de ce travail se fait manuellement dans l'éditeur Unity (création de la scène, import des assets, placement des caméras) — Antigravity peut préparer la structure de dossiers, les scripts C#, et la configuration, mais certaines étapes resteront à réaliser à la main dans l'éditeur. Ce prompt distingue clairement les deux.

---

## 1. Structure du projet Unity (à créer)

```
Assets/
├── _Project/
│   ├── Scenes/
│   │   └── HerglaPark_Main.unity
│   ├── Scripts/
│   │   ├── Api/
│   │   │   ├── ApiClient.cs              # wrapper UnityWebRequest générique (GET/POST, gestion JSON)
│   │   │   ├── ApiConfig.cs              # base URL configurable (dev/preview/prod), slug de l'entreprise
│   │   │   ├── EspaceStatusSync.cs       # interroge /api/companies/:slug/espaces à intervalle régulier
│   │   │   └── KartConfigSync.cs         # interroge /api/companies/:slug/espaces/:id/karts
│   │   ├── Runtime3D/
│   │   │   ├── RuntimeGltfLoader.cs      # wrapper autour d'UnityGLTF pour charger un .glb depuis une URL
│   │   │   └── ScenePlacementSync.cs     # charge les objets de /api/espaces/:id/scene au runtime (voir section 4bis)
│   │   ├── Karts/
│   │   │   ├── KartColorApplier.cs       # recoloration par pièce nommée (équivalent C# de la technique R3F)
│   │   │   ├── KartPlateApplier.cs       # affichage du numéro de plaque (TextMeshPro)
│   │   │   └── KartManager.cs            # charge et positionne les karts selon la config reçue
│   │   ├── Player/
│   │   │   └── (First Person Controller — Semaine 5.2, pas couvert ici)
│   │   └── UI/
│   │       └── EspaceStatusDisplay.cs    # met à jour le texte 3D "OUVERT"/"FERMÉ" (Semaine 5.3 du planning original)
│   ├── Prefabs/
│   │   └── EspaceStatusPanel.prefab
│   └── Models/                           # environnement fixe uniquement (terrain, bâtiments structurels) — les karts et objets de scène sont chargés dynamiquement, pas stockés ici
│       └── Environment/
└── StreamingAssets/ (si besoin de config externe non compilée)
```

## 1bis. Export de la carte/piste : FBX ET GLB depuis le même fichier Blender
La carte (terrain, bâtiments, piste) est un décor **statique** — contrairement aux karts et aux objets de scène, elle n'est jamais modifiée dynamiquement par un admin. Elle est donc exportée **deux fois depuis le même fichier Blender source** :
- **`.fbx`** → importé une fois dans l'Éditeur Unity, dans `Assets/_Project/Models/Environment/`, compilé dans le build (pas de chargement runtime nécessaire pour cette partie).
- **`.glb`** → utilisé comme `baseSceneUrl` de l'`Espace` correspondant (déjà prévu dans le modèle de données de l'éditeur de scène), pour que le Dashboard affiche ce même décor en arrière-plan lors du placement d'objets/karts.

Cette double exportation doit être refaite à chaque révision de la carte (ce n'est pas automatisé) — documente cette étape clairement dans le README pour la personne en charge de la modélisation Blender.

## 2. Configuration API (`ApiConfig.cs`)
```csharp
public static class ApiConfig
{
    public static string BaseUrl = "https://backend-app-nine-mu.vercel.app/api"; // à rendre configurable par environnement (ScriptableObject ou fichier de config)
    public static string CompanySlug = "hergla-park";
    public static float PollingIntervalSeconds = 10f;
}
```
Prévoir une version configurable (ScriptableObject `ApiEnvironmentConfig`) plutôt qu'une valeur en dur, pour basculer facilement entre l'API de développement, de preview et de production sans recompiler.

## 3. Liaison statut des espaces (reprend la Semaine 5.3 du planning original)
- `EspaceStatusSync.cs` : au démarrage puis toutes les `PollingIntervalSeconds`, appelle `GET /api/companies/{slug}/espaces` via `UnityWebRequest`, parse le JSON (utiliser `JsonUtility` ou `Newtonsoft.Json` si des structures imbriquées le nécessitent).
- Pour chaque espace connu dans la scène (association par un identifiant ou un nom configuré sur un composant `EspaceStatusDisplay` placé devant chaque bâtiment), met à jour le texte 3D et sa couleur : "OUVERT" en vert, "FERMÉ" en rouge, "MAINTENANCE" en orange.

## 4. Liaison configuration des karts (mise à jour — cohérent avec la technique web validée)

**Changement important par rapport à la version précédente** : les karts ne sont plus des prefabs Unity pré-importés avec une teinte unique appliquée par script — ils sont chargés **au runtime** depuis le même fichier `.glb` que celui utilisé côté web (`modeleBaseUrl`), avec les mêmes pièces nommées (`piece_carrosserie`, `piece_aileron`, `piece_plaque`, etc.), pour garantir une cohérence totale avec ce que l'admin a configuré dans le dashboard.

### 4.1 Dépendance : UnityGLTF
Installe le package **UnityGLTF** (package open-source de chargement de fichiers `.glb`/`.gltf` au runtime, sans import préalable dans l'Éditeur Unity) via Package Manager (Git URL officielle du dépôt UnityGLTF).

### 4.2 Scripts
- `KartConfigSync.cs` : appelle `GET /api/companies/{slug}/espaces/{espaceId}/karts` (l'`espaceId` de la piste de karting), au chargement de la scène et à chaque fois que le visiteur entre dans la zone karting (déclenché par le même Trigger que celui prévu en Semaine 6.3 du planning, pour avoir la config la plus fraîche possible avant l'essai). Reçoit la liste `[{ numeroPlaque, couleurs, modeleBaseUrl }]`.
- `KartManager.cs` : pour chaque entrée reçue, charge le modèle via UnityGLTF (`GltfImportRuntime` ou l'API équivalente du package selon sa version) depuis `modeleBaseUrl`, positionne l'instance résultante sur l'un des emplacements de départ disponibles, puis appelle `KartColorApplier` et `KartPlateApplier` dessus.
- `KartColorApplier.cs` : parcourt les enfants de l'objet chargé (`GetComponentsInChildren<Renderer>()`), identifie chaque renderer dont le nom correspond à une clé présente dans `couleurs` (même convention `piece_*` que côté web), clone son matériau (`renderer.material` en C# clone déjà automatiquement l'instance à la première modification — comportement équivalent à `material.clone()` en Three.js) et applique la couleur (`renderer.material.color = couleur`).
- `KartPlateApplier.cs` : équivalent Unity de la génération de plaque par canvas. Deux approches possibles, à choisir selon la complexité du modèle de plaque :
  - **Option simple (recommandée)** : positionner un objet `TextMeshPro` 3D à l'emplacement du mesh `piece_plaque` (récupéré via sa position/rotation), affichant directement le `numeroPlaque` en texte — pas besoin de génération de texture, plus simple à maintenir en C#.
  - **Option fidèle au rendu web** : générer une `Texture2D` au runtime en dessinant le texte via une bibliothèque de rendu de texte sur texture (plus complexe en C# qu'en JavaScript/canvas — à réserver si l'option TextMeshPro ne donne pas un résultat visuellement satisfaisant).
- Si aucune configuration n'est reçue (erreur réseau, backend indisponible) : conserver une configuration par défaut codée en dur (ex: 4 karts, couleurs standard, modèle de base local packagé avec le build) pour que la visite reste jouable même hors-ligne ou en cas de problème backend — ne jamais bloquer l'expérience du visiteur pour une erreur de synchronisation.

## 4bis. Liaison de la scène (objets placés via l'éditeur web)
De la même façon, les objets placés par un admin via l'éditeur de scène du dashboard (`ScenePlacement`, voir les prompts Backend/Dashboard CRUD Complet + Éditeur 3D) doivent être chargés **au runtime** par Unity via UnityGLTF, à partir de `GET /api/espaces/{id}/scene` : pour chaque `placement`, charge le `.glb` de l'objet correspondant et applique la position/rotation/échelle sauvegardées. Ainsi, tout objet ajouté, déplacé ou importé depuis le dashboard (y compris un modèle uploadé par un admin) apparaît automatiquement dans la visite Unity, **sans recompilation ni republication du build**.

## 5. Étapes à réaliser manuellement dans l'éditeur Unity (non générées par Antigravity)
- Création du projet Unity (version LTS) et de la scène `HerglaPark_Main`.
- Installation et configuration initiale du package UnityGLTF.
- Configuration de la Skybox (ciel tunisien ensoleillé, prévu en Semaine 5.1 du planning).
- Import des éléments d'environnement fixes non gérés dynamiquement (terrain, bâtiments structurels) exportés depuis Blender (Semaine 4) dans `Assets/_Project/Models/` — seuls les objets décoratifs/mobiliers et les karts sont chargés dynamiquement, pas l'ensemble du décor.
- Placement des `EspaceStatusPanel` devant chaque bâtiment concerné, et association de leur identifiant d'espace dans l'Inspecteur.
- Définition des emplacements de départ des karts sur la piste (points d'ancrage vides, référencés par `KartManager`).


## 6. Architecture à anticiper (décisions prises depuis ce prompt)
- Ce projet Unity produira à terme **deux builds WebGL distincts** : un build "Visite" (celui couvert par ce prompt, pour les visiteurs) et un build "Éditeur" (couvert par un prompt séparé, embarqué dans le Dashboard admin pour l'édition de scène WYSIWYG). Structure le projet en gardant les scènes et assets partagés séparés de la logique spécifique à chaque mode, pour faciliter cette séparation à venir.
- Le support d'un casque VR (WebXR/Unity XR Toolkit) est prévu **plus tard**, en complément de l'expérience clavier/souris — ne bloque pas ce prompt là-dessus, mais évite de coupler trop fortement le contrôleur de déplacement du visiteur (First Person Controller) à des hypothèses qui rendraient un ajout XR difficile ensuite (ex: garde la logique de mouvement séparée de la gestion des inputs, pour pouvoir substituer un rig XR plus tard sans tout réécrire).

## 7. Livrables
1. Structure de dossiers du projet Unity créée.
2. Scripts C# (`ApiClient`, `ApiConfig`, `EspaceStatusSync`, `KartConfigSync`, `KartManager`, `KartColorApplier`, `EspaceStatusDisplay`) fonctionnels et commentés.
3. `Kart_Base.prefab` et son matériau prêts à recevoir une couleur dynamique (même avec un modèle de substitution simple en attendant l'export Blender définitif).
4. Un `README.md` dans `Assets/_Project/` expliquant la configuration de l'environnement API et la liste des étapes manuelles restantes (section 5) pour que ce soit clair pour quiconque reprend le projet Unity.

## Consignes finales
- Ne bloque pas ce travail sur l'absence des modèles 3D définitifs — utilise des primitives Unity (cube/cylindre) comme substituts temporaires pour le kart et les bâtiments, clairement identifiés comme provisoires, afin que toute la logique de synchronisation Backend↔Unity soit testable dès maintenant.
- Garde le polling réseau raisonnable (10 secondes par défaut) pour ne pas surcharger l'API en environnement de test.
