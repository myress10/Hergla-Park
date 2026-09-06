# Prompt Antigravity — Unity : Conduite des Karts (Joueur + IA)
### Anticipe la Semaine 6 du planning original. À exécuter après le prompt Unity Setup + Liaison Backend (mis à jour).

---

## Contexte
Quand l'admin configure plusieurs karts (ex: 4), le visiteur en choisit un à piloter lui-même ; les autres doivent rouler automatiquement (IA simple, pilotage par points de passage), pour donner vie à la piste même quand un seul visiteur est présent. Ce prompt couvre les deux systèmes de conduite, qui partagent la même base physique.

## 1. Architecture générale

```
Assets/_Project/Scripts/Karts/
├── KartPhysicsController.cs   # base physique partagée (WheelColliders), pilotée par un input abstrait
├── PlayerKartInput.cs         # traduit le clavier en commandes pour KartPhysicsController
├── AIWaypointFollower.cs      # traduit la position des waypoints en commandes pour KartPhysicsController
├── KartSelectionUI.cs         # écran de choix du kart avant le départ
├── KartSpawnManager.cs        # orchestre : charge les karts, assigne joueur/IA, démarre la course
└── Waypoints/
    └── WaypointPath.cs        # lit les enfants d'un GameObject parent comme liste ordonnée de points de passage
```

## 2. Physique partagée (`KartPhysicsController.cs`)
- Reprend les bases prévues dans le planning original (Semaine 6.1) : `Rigidbody` avec centre de gravité abaissé, 4 `WheelCollider` (accélération sur l'essieu arrière, direction sur l'essieu avant, freinage).
- Expose une interface simple utilisée aussi bien par l'input joueur que par l'IA : `SetInputs(float acceleration, float steering, float brake)` — chaque frame, celui qui contrôle le kart (joueur ou IA) appelle cette méthode avec les valeurs voulues (entre -1 et 1). Le script physique lui-même ne sait pas qui le pilote, ce qui permet de réutiliser exactement le même comportement pour les deux cas.

## 3. Contrôle joueur (`PlayerKartInput.cs`)
- Lit les entrées clavier (Z/Q/S/D ou flèches), les convertit en `acceleration`/`steering`/`brake`, les transmet à `KartPhysicsController.SetInputs(...)` chaque frame.
- Attache une caméra suiveuse (Cinemachine Virtual Camera, comme prévu Semaine 6.2 du planning original) uniquement sur le kart contrôlé par le joueur.
- Ce composant n'est activé que sur le kart choisi par le visiteur — désactivé (ou absent) sur les autres.

## 4. IA simple par points de passage (`AIWaypointFollower.cs`)
**Comportement volontairement simple pour cette première version, prévu pour être amélioré plus tard (évitement, dépassement, vitesse variable) :**
- `WaypointPath.cs` : un GameObject vide parent (`Waypoints_Piste`) placé manuellement dans la scène Unity, avec un enfant vide par point de passage, ordonnés le long de la piste. Le script lit ces enfants dans l'ordre pour former le chemin (pas besoin de configuration supplémentaire — l'ordre dans la hiérarchie Unity suffit).
- `AIWaypointFollower.cs`, chaque frame :
  1. Calcule la direction vers le waypoint suivant (`nextWaypoint.position - transform.position`).
  2. Convertit cette direction en une valeur de `steering` (angle relatif à l'avant du kart).
  3. Applique une `acceleration` constante (vitesse de croisière fixe, pas de variation).
  4. Quand le kart est suffisamment proche du waypoint courant (distance seuil), passe au suivant ; après le dernier, reboucle au premier (boucle infinie).
  5. **Aucun évitement d'obstacle, aucune interaction avec les autres karts ou le joueur** — les IA suivent leur chemin sans réagir à une collision (peuvent se percuter légèrement, acceptable pour cette version). Documente ceci clairement en commentaire dans le code comme limitation connue, à améliorer dans une itération future.

## 5. Sélection du kart par le visiteur (`KartSelectionUI.cs`)
- Au chargement de la scène de karting, `KartConfigSync` (déjà prévu) récupère la liste des karts configurés (`numeroPlaque`, `couleurs`).
- Affiche une interface simple (Canvas UI Unity) : une carte par kart configuré, avec un aperçu de couleur (pas besoin d'un rendu 3D complet pour cette liste — un simple carré de couleur + le numéro de plaque suffit, cohérent avec l'esprit "simple d'abord").
- Le visiteur clique sur un kart → `KartSpawnManager` assigne `PlayerKartInput` (+ la caméra suiveuse) à cette instance, et `AIWaypointFollower` à toutes les autres instances chargées.
- Une fois le choix fait, masque cette interface et démarre la conduite normalement.

## 6. Orchestration (`KartSpawnManager.cs`)
1. Récupère la configuration des karts (via `KartManager` déjà prévu, qui charge chaque modèle via UnityGLTF et applique couleurs/plaque).
2. Positionne chaque kart chargé sur un emplacement de départ disponible (grille de départ).
3. Affiche `KartSelectionUI` et attend le choix du visiteur.
4. Assigne les rôles (joueur / IA) selon la section 5.
5. Démarre la simulation (active les scripts de contrôle sur chaque kart).

## 7. Étapes manuelles à réaliser dans l'éditeur Unity (non générées par Antigravity)
- Placer les points de passage (`Waypoints_Piste` + enfants vides ordonnés) le long de la piste, une fois celle-ci importée (Semaine 3-4). Cette étape doit être refaite si le tracé de la piste change significativement.
- Définir la grille de positions de départ des karts (déjà mentionné dans le prompt Setup, section 5).
- Vérifier en conditions réelles que la vitesse de croisière des IA est cohérente avec la largeur de la piste (pour éviter que les IA sortent de piste dans les virages serrés) — ajustement empirique à faire une fois le tracé définitif disponible.

## 8. Livrables
1. `KartPhysicsController.cs` fonctionnel, piloté indifféremment par un joueur ou une IA.
2. Conduite joueur fonctionnelle (accélération, direction, freinage, caméra suiveuse).
3. IA simple fonctionnelle (suivi de points de passage en boucle, sans évitement).
4. Écran de sélection du kart fonctionnel, cohérent avec la configuration réelle du backend.
5. `README.md` mis à jour avec une section "Conduite des karts", précisant explicitement que l'IA actuelle est une version simple, avec la liste des améliorations prévues plus tard (évitement, dépassement, vitesse variable selon les virages).

## Consignes finales
- Garde `KartPhysicsController` totalement agnostique de qui le pilote (joueur ou IA) — c'est ce qui permettra d'améliorer l'IA plus tard sans toucher à la physique ni au contrôle joueur.
- Ne complexifie pas l'IA au-delà de ce qui est demandé ici — la simplicité est un choix assumé pour cette itération, pas un oubli.
