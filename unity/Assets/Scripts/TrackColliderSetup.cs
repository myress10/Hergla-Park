using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace HerglaPark
{
    [ExecuteInEditMode]
    public class TrackColliderSetup : MonoBehaviour
    {
        [Header("Référence Piste")]
        [Tooltip("L'objet de la piste (ex: track_hergla). Si vide, recherche automatiquement dans la scène.")]
        public GameObject trackObject;

        /// <summary>
        /// Ajoute ou configure un MeshCollider non-convexe sur track_hergla et ses enfants sans doublons
        /// </summary>
        [ContextMenu("Ajouter MeshCollider Non-Convexe")]
        public void AddMeshColliderToTrack()
        {
            // 1. Détection automatique de track_hergla si non assigné
            if (trackObject == null)
            {
                trackObject = GameObject.Find("track_hergla");
                if (trackObject == null)
                {
                    trackObject = gameObject;
                }
            }

            if (trackObject == null)
            {
                Debug.LogError("[TrackColliderSetup] Impossible de trouver l'objet de piste 'track_hergla'. Veuillez l'assigner dans l'Inspector.");
                return;
            }

            // 2. Récupérer tous les MeshFilter (sur l'objet et ses enfants)
            MeshFilter[] meshFilters = trackObject.GetComponentsInChildren<MeshFilter>();

            if (meshFilters.Length == 0)
            {
                Debug.LogWarning($"[TrackColliderSetup] Aucun MeshFilter trouvé sur '{trackObject.name}' ou ses enfants.");
                return;
            }

            int addedCount = 0;
            int updatedCount = 0;
            int existingCount = 0;

            foreach (MeshFilter mf in meshFilters)
            {
                GameObject obj = mf.gameObject;

                // Vérifier s'il existe déjà un Collider sur cet objet
                Collider existingCollider = obj.GetComponent<Collider>();

                if (existingCollider != null)
                {
                    existingCount++;
                    if (existingCollider is MeshCollider mc)
                    {
                        // Vérifier si la propriété Convex doit être décochée (false)
                        if (mc.convex)
                        {
#if UNITY_EDITOR
                            Undo.RecordObject(mc, "Décocher Convex MeshCollider");
#endif
                            mc.convex = false;
                            updatedCount++;
                            Debug.Log($"[TrackColliderSetup] MeshCollider sur '{obj.name}' mis à jour : option 'Convex' décochée (false).");
                        }
                    }
                    continue;
                }

                // Aucun collider existant -> Ajouter un nouveau MeshCollider
#if UNITY_EDITOR
                MeshCollider newMc = Undo.AddComponent<MeshCollider>(obj);
#else
                MeshCollider newMc = obj.AddComponent<MeshCollider>();
#endif
                newMc.sharedMesh = mf.sharedMesh;
                newMc.convex = false; // Désactiver Convex pour correspondre exactement aux virages complexes

                addedCount++;
                Debug.Log($"[TrackColliderSetup] MeshCollider non-convexe ajouté avec succès sur '{obj.name}'.");
            }

            Debug.Log($"[TrackColliderSetup] Opération terminée : {addedCount} MeshCollider(s) créé(s), {updatedCount} mis à jour, {existingCount} déjà présent(s).");
        }
    }
}
