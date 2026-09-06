# README — Dossier Unity

Ce dossier contient le projet Unity **Hergla Park — Karting**.

## Structure attendue

```
unity/
├── Assets/                  ← Scènes, modèles, textures, matériaux, scripts
│   ├── Scenes/
│   │   └── KartingScene.unity
│   ├── Scripts/             ← Scripts C# (voir sous-dossier Scripts/ à la racine)
│   ├── Models/              ← Modèles .fbx / .glb
│   └── Materials/
├── ProjectSettings/         ← Paramètres Unity (obligatoire)
├── Packages/                ← manifest.json (obligatoire)
├── Scripts/                 ← Scripts C# partagés (liaison API, physique kart)
│   ├── Backend/             ← ApiClient.cs, KartConfigSync.cs, LapTimeSubmit.cs
│   ├── Karting/             ← KartPhysicsController.cs, AIWaypointFollower.cs
│   └── UI/                  ← KartSelectionUI.cs, LeaderboardUI.cs
└── .gitignore               ← Exclut Library/, Temp/, Builds/, etc.
```

## ⚠️ Règles pour pousser sur GitHub

1. **TOUJOURS travailler depuis la branche `unity/karting`** (pas `main`)
2. **Ne jamais pousser `Library/` ou `Temp/`** (déjà dans `.gitignore`)
3. **Ne jamais modifier** les dossiers `backend/`, `dashboard/`, `vr-landing/` de la racine
4. Ouvrir une **Pull Request** depuis `unity/karting` vers `main`

## Connexion à l'API

L'URL de base de l'API est : `https://hergla-park-backend.onrender.com/api`

Voir `Scripts/Backend/ApiConfig.cs` pour la configuration.
