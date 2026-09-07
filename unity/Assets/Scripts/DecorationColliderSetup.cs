using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace HerglaPark
{
    [ExecuteInEditMode]
    public class DecorationColliderSetup : MonoBehaviour
    {
        [Header("Référence Parent Décor")]
        [Tooltip("L'objet parent qui contient les décors (ex: 'textures'). Si vide, recherche automatiquement dans la scène.")]
        public GameObject texturesParent;

        [Header("Options de Configuration")]
        [Tooltip("Forcer la récréation du collider si l'objet n'a pas de collider direct sur la racine.")]
        public bool checkOnlyDirectColliderOnRoot = true;

        [ContextMenu("Ajouter Colliders sur Décors (Palm, Light, Rocks, Grass)")]
        public void SetupDecorationColliders()
        {
            // 1. Recherche automatique du parent 'textures' si non assigné
            if (texturesParent == null)
            {
                texturesParent = GameObject.Find("textures");
                if (texturesParent == null)
                {
                    // Essayer de chercher par tag ou nom insensible à la casse
                    GameObject[] allObjects = FindObjectsByType<GameObject>(FindObjectsSortMode.None);
                    foreach (var go in allObjects)
                    {
                        if (go.name.ToLower().Equals("textures"))
                        {
                            texturesParent = go;
                            break;
                        }
                    }
                }
            }

            if (texturesParent == null)
            {
                texturesParent = gameObject;
            }

            if (texturesParent == null)
            {
                Debug.LogError("[DecorationColliderSetup] Impossible de trouver l'objet parent 'textures' dans la scène.");
                return;
            }

            Debug.Log($"[DecorationColliderSetup] Analyse du dossier parent : '{texturesParent.name}'...");

            int palmsAdded = 0, lightsAdded = 0, rocksAdded = 0, grassAdded = 0;
            int palmsSkipped = 0, lightsSkipped = 0, rocksSkipped = 0, grassSkipped = 0;

            Transform parentTransform = texturesParent.transform;

            // Afficher tous les groupes trouvés pour aider le débogage
            foreach (Transform categoryGroup in parentTransform)
            {
                string groupName = categoryGroup.name.Trim().ToLower();
                Debug.Log($"[DecorationColliderSetup] Groupe trouvé sous 'textures' : '{categoryGroup.name}' (Nombre d'objets : {categoryGroup.childCount})");

                // Filtres d'exclusion stricts pour LeightGrass et Side-T-Grass
                bool isExcludedGrass = groupName.Contains("leight") || 
                                       groupName.Contains("side-t") || 
                                       groupName.Contains("side_t") || 
                                       groupName.Contains("sidet");

                if (isExcludedGrass)
                {
                    Debug.Log($"   [IGNORÉ] Catégorie '{categoryGroup.name}' ignorée (LeightGrass / Side-T-Grass).");
                    continue;
                }

                bool isPalmGroup = groupName.Contains("palm");
                bool isLightGroup = groupName.Contains("street") || groupName.Contains("light") || groupName.Contains("lamp");
                bool isRockGroup = groupName.Contains("rock");
                
                // Est considéré comme Grass tout groupe contenant "grass" qui N'EST PAS exlu
                bool isGrassGroup = groupName.Contains("grass");

                if (isPalmGroup || isLightGroup || isRockGroup || isGrassGroup)
                {
                    foreach (Transform item in categoryGroup)
                    {
                        // Vérifier la présence d'un collider existant
                        Collider existingCol = checkOnlyDirectColliderOnRoot ? 
                            item.GetComponent<Collider>() : 
                            item.GetComponentInChildren<Collider>();

                        if (existingCol != null)
                        {
                            if (isPalmGroup) palmsSkipped++;
                            else if (isLightGroup) lightsSkipped++;
                            else if (isRockGroup) rocksSkipped++;
                            else if (isGrassGroup) grassSkipped++;
                            continue;
                        }

                        // Obtenir les dimensions des visuels/mesh
                        Bounds bounds = GetCombinedBounds(item);
                        if (bounds.size == Vector3.zero)
                        {
                            // Si pas de Renderer sur l'objet parent, chercher sur l'objet ou ses enfants
                            bounds = new Bounds(item.position, Vector3.one * 0.5f);
                        }

                        if (isPalmGroup || isLightGroup)
                        {
#if UNITY_EDITOR
                            CapsuleCollider capsule = Undo.AddComponent<CapsuleCollider>(item.gameObject);
#else
                            CapsuleCollider capsule = item.gameObject.AddComponent<CapsuleCollider>();
#endif
                            ConfigureCapsuleCollider(capsule, item, bounds, isPalmGroup);

                            if (isPalmGroup) palmsAdded++;
                            else lightsAdded++;
                        }
                        else if (isRockGroup || isGrassGroup)
                        {
#if UNITY_EDITOR
                            BoxCollider box = Undo.AddComponent<BoxCollider>(item.gameObject);
#else
                            BoxCollider box = item.gameObject.AddComponent<BoxCollider>();
#endif
                            ConfigureBoxCollider(box, item, bounds);

                            if (isRockGroup) rocksAdded++;
                            else grassAdded++;
                        }
                    }
                }
            }

            // Résumé complet
            Debug.Log("==================================================");
            Debug.Log("[DecorationColliderSetup] RÉSUMÉ FINAL :");
            Debug.Log($"🌴 Palmiers (Palm)          : {palmsAdded} ajouté(s) | {palmsSkipped} déjà existant(s)");
            Debug.Log($"💡 Lampadaires (StreetLight)   : {lightsAdded} ajouté(s) | {lightsSkipped} déjà existant(s)");
            Debug.Log($"🪨 Rochers (Rocks)           : {rocksAdded} ajouté(s) | {rocksSkipped} déjà existant(s)");
            Debug.Log($"🌿 Herbe (Grass)              : {grassAdded} ajouté(s) | {grassSkipped} déjà existant(s)");
            Debug.Log("==================================================");
        }

        private Bounds GetCombinedBounds(Transform target)
        {
            Renderer[] renderers = target.GetComponentsInChildren<Renderer>();
            if (renderers == null || renderers.Length == 0)
            {
                return new Bounds(target.position, Vector3.zero);
            }

            Bounds combined = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++)
            {
                combined.Encapsulate(renderers[i].bounds);
            }
            return combined;
        }

        private void ConfigureCapsuleCollider(CapsuleCollider capsule, Transform target, Bounds worldBounds, bool isPalm)
        {
            capsule.direction = 1;
            Vector3 localCenter = target.InverseTransformPoint(worldBounds.center);
            capsule.center = localCenter;

            float lossyScaleY = Mathf.Max(0.001f, target.lossyScale.y);
            capsule.height = worldBounds.size.y / lossyScaleY;

            float maxXZWorld = Mathf.Max(worldBounds.size.x, worldBounds.size.z);
            float lossyScaleXZ = Mathf.Max(0.001f, (target.lossyScale.x + target.lossyScale.z) * 0.5f);
            float radiusFactor = isPalm ? 0.25f : 0.30f;
            capsule.radius = Mathf.Max(0.2f, (maxXZWorld * radiusFactor) / lossyScaleXZ);
        }

        private void ConfigureBoxCollider(BoxCollider box, Transform target, Bounds worldBounds)
        {
            Vector3 localCenter = target.InverseTransformPoint(worldBounds.center);
            box.center = localCenter;

            Vector3 scale = target.lossyScale;
            float sizeX = worldBounds.size.x / Mathf.Max(0.001f, scale.x);
            float sizeY = worldBounds.size.y / Mathf.Max(0.001f, scale.y);
            float sizeZ = worldBounds.size.z / Mathf.Max(0.001f, scale.z);

            box.size = new Vector3(sizeX, sizeY, sizeZ);
        }
    }
}
