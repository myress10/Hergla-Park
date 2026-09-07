using System.Collections.Generic;
using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace HerglaPark
{
    [ExecuteInEditMode]
    public class TrackTirePlacer : MonoBehaviour
    {
        [Header("Références Piste & Prefabs")]
        [Tooltip("L'objet de la piste (ex: track_hergla). Si vide, recherche automatiquement dans la scène.")]
        public GameObject trackObject;

        [Tooltip("Liste des prefabs de pneus (variantes de couleurs dans le dossier wheels).")]
        public GameObject[] tirePrefabs;

        [Tooltip("Conteneur parent pour les pneus générés (créé automatiquement si vide).")]
        public Transform tiresContainer;

        [Header("Configuration des Virages & Placement")]
        [Tooltip("Angle minimal (en degrés) pour considérer une section comme un virage.")]
        public float turnAngleThreshold = 12f;

        [Tooltip("Distance par rapport à l'axe central de la piste (vers l'extérieur).")]
        public float offsetFromCenter = 4.0f;

        [Tooltip("Nombre de pneus à placer par virage (2 ou 3).")]
        [Range(2, 5)]
        public int tiresPerTurn = 3;

        [Tooltip("Espacement entre les pneus d'un même virage.")]
        public float tireSpacing = 1.2f;

        [Tooltip("Variabilité aléatoire de la rotation (en degrés) pour un effet naturel.")]
        public float randomRotationY = 15f;

        [ContextMenu("Placer les Pneus dans les Virages")]
        public void PlaceTiresInTurns()
        {
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
                Debug.LogError("[TrackTirePlacer] Impossible de trouver l'objet de piste 'track_hergla'. Veuillez l'assigner dans l'Inspector.");
                return;
            }

            if (tirePrefabs == null || tirePrefabs.Length == 0)
            {
                Debug.LogWarning("[TrackTirePlacer] Aucun prefab de pneu assigné ! Veuillez glisser vos prefabs de pneus dans la liste 'Tire Prefabs'.");
                return;
            }

            PrepareContainer();

            List<Vector3> waypoints = ExtractTrackPoints(trackObject);

            if (waypoints == null || waypoints.Count < 3)
            {
                Debug.LogError("[TrackTirePlacer] Pas assez de points trouvés sur la piste pour analyser les virages (minimum 3 points requis).");
                return;
            }

            int count = waypoints.Count;
            int tiresSpawned = 0;

            for (int i = 0; i < count; i++)
            {
                Vector3 prev = waypoints[(i - 1 + count) % count];
                Vector3 curr = waypoints[i];
                Vector3 next = waypoints[(i + 1) % count];

                Vector3 dirIn = (curr - prev).normalized;
                Vector3 dirOut = (next - curr).normalized;

                dirIn.y = 0;
                dirOut.y = 0;

                if (dirIn.sqrMagnitude < 0.001f || dirOut.sqrMagnitude < 0.001f)
                    continue;

                dirIn.Normalize();
                dirOut.Normalize();

                float angle = Vector3.Angle(dirIn, dirOut);

                if (angle >= turnAngleThreshold)
                {
                    float crossY = (dirIn.x * dirOut.z) - (dirIn.z * dirOut.x);
                    bool isLeftTurn = crossY > 0;

                    Vector3 tangent = (dirIn + dirOut).normalized;

                    Vector3 outsideNormal = isLeftTurn ?
                        new Vector3(tangent.z, 0, -tangent.x) :
                        new Vector3(-tangent.z, 0, tangent.x);

                    outsideNormal.Normalize();

                    SpawnTireStack(curr, tangent, outsideNormal);

                    if (angle > 35f)
                    {
                        Vector3 insideNormal = -outsideNormal;
                        SpawnTireStack(curr, tangent, insideNormal, countOverride: 2, offsetScale: 0.7f);
                    }

                    tiresSpawned += tiresPerTurn;
                }
            }

            Debug.Log($"[TrackTirePlacer] Succès ! {tiresSpawned} pneus ont été placés aux virages de la piste '{trackObject.name}'.");
        }

        [ContextMenu("Effacer Tous les Pneus Générés")]
        public void ClearTires()
        {
            if (tiresContainer != null)
            {
#if UNITY_EDITOR
                Undo.DestroyObjectImmediate(tiresContainer.gameObject);
#else
                DestroyImmediate(tiresContainer.gameObject);
#endif
                tiresContainer = null;
                Debug.Log("[TrackTirePlacer] Conteneur de pneus effacé.");
            }
        }

        [ContextMenu("Configurer MeshCollider Non-Convexe")]
        public void SetupTrackCollider()
        {
            if (trackObject == null)
            {
                trackObject = GameObject.Find("track_hergla");
                if (trackObject == null) trackObject = gameObject;
            }

            if (trackObject == null)
            {
                Debug.LogError("[TrackTirePlacer] Objet 'track_hergla' introuvable.");
                return;
            }

            MeshFilter[] meshFilters = trackObject.GetComponentsInChildren<MeshFilter>();
            int added = 0;

            foreach (MeshFilter mf in meshFilters)
            {
                GameObject obj = mf.gameObject;
                Collider col = obj.GetComponent<Collider>();
                if (col == null)
                {
#if UNITY_EDITOR
                    MeshCollider mc = Undo.AddComponent<MeshCollider>(obj);
#else
                    MeshCollider mc = obj.AddComponent<MeshCollider>();
#endif
                    mc.sharedMesh = mf.sharedMesh;
                    mc.convex = false;
                    added++;
                }
                else if (col is MeshCollider mc && mc.convex)
                {
#if UNITY_EDITOR
                    Undo.RecordObject(mc, "Uncheck Convex");
#endif
                    mc.convex = false;
                }
            }

            Debug.Log($"[TrackTirePlacer] Configuration MeshCollider terminée ({added} nouveau(x) collider(s) ajouté(s)).");
        }

        private void PrepareContainer()
        {
            if (tiresContainer == null)
            {
                GameObject containerObj = GameObject.Find("TireBarriers");
                if (containerObj != null)
                {
                    tiresContainer = containerObj.transform;
                }
                else
                {
                    containerObj = new GameObject("TireBarriers");
                    tiresContainer = containerObj.transform;

                    tiresContainer.position = Vector3.zero;
                    tiresContainer.rotation = Quaternion.identity;
                    tiresContainer.localScale = Vector3.one;

#if UNITY_EDITOR
                    Undo.RegisterCreatedObjectUndo(containerObj, "Create TireBarriers Container");
#endif
                }
            }

            List<GameObject> children = new List<GameObject>();
            foreach (Transform child in tiresContainer)
            {
                children.Add(child.gameObject);
            }

            foreach (GameObject child in children)
            {
#if UNITY_EDITOR
                Undo.DestroyObjectImmediate(child);
#else
                DestroyImmediate(child);
#endif
            }
        }

        private void SpawnTireStack(Vector3 centerPos, Vector3 tangent, Vector3 sideNormal, int countOverride = -1, float offsetScale = 1.0f)
        {
            int countToSpawn = countOverride > 0 ? countOverride : tiresPerTurn;
            float actualOffset = offsetFromCenter * offsetScale;

            Vector3 basePos = centerPos + (sideNormal * actualOffset);

            float startOffset = -((countToSpawn - 1) * tireSpacing) / 2.0f;

            for (int k = 0; k < countToSpawn; k++)
            {
                float offsetAlongTangent = startOffset + (k * tireSpacing);
                Vector3 spawnPos = basePos + (tangent * offsetAlongTangent);

                GameObject prefab = tirePrefabs[Random.Range(0, tirePrefabs.Length)];
                if (prefab == null) continue;

                float randomY = Random.Range(-randomRotationY, randomRotationY);
                Quaternion rotation = Quaternion.LookRotation(tangent) * Quaternion.Euler(0, randomY, 0);

#if UNITY_EDITOR
                GameObject spawnedTire = PrefabUtility.InstantiatePrefab(prefab, tiresContainer) as GameObject;
                if (spawnedTire != null)
                {
                    spawnedTire.transform.position = spawnPos;
                    spawnedTire.transform.rotation = rotation;
                    Undo.RegisterCreatedObjectUndo(spawnedTire, "Spawn Tire Prefab");
                }
#else
                GameObject spawnedTire = Instantiate(prefab, spawnPos, rotation, tiresContainer);
#endif
            }
        }

        private List<Vector3> ExtractTrackPoints(GameObject target)
        {
            List<Vector3> points = new List<Vector3>();

            GameObject waypointsParent = GameObject.Find("TrackWaypoints");
            if (waypointsParent != null && waypointsParent.transform.childCount >= 3)
            {
                List<Transform> sortedChildren = new List<Transform>();
                foreach (Transform child in waypointsParent.transform)
                {
                    sortedChildren.Add(child);
                }

                sortedChildren.Sort((a, b) => a.name.CompareTo(b.name));

                foreach (Transform wp in sortedChildren)
                {
                    points.Add(wp.position);
                }

                return points;
            }

            MeshFilter mf = target.GetComponentInChildren<MeshFilter>();
            if (mf != null && mf.sharedMesh != null)
            {
                Mesh mesh = mf.sharedMesh;
                Vector3[] vertices = mesh.vertices;
                Transform meshTransform = mf.transform;

                int sampleStep = Mathf.Max(1, vertices.Length / 60);
                List<Vector3> sampledVerts = new List<Vector3>();

                for (int i = 0; i < vertices.Length; i += sampleStep)
                {
                    Vector3 worldPos = meshTransform.TransformPoint(vertices[i]);
                    sampledVerts.Add(worldPos);
                }

                Vector3 center = target.transform.position;
                sampledVerts.Sort((a, b) =>
                {
                    float angleA = Mathf.Atan2(a.z - center.z, a.x - center.x);
                    float angleB = Mathf.Atan2(b.z - center.z, b.x - center.x);
                    return angleA.CompareTo(angleB);
                });

                return sampledVerts;
            }

            Vector3 targetCenter = target.transform.position;
            float radius = 15.0f;
            int segments = 24;
            for (int i = 0; i < segments; i++)
            {
                float rad = (i / (float)segments) * Mathf.PI * 2.0f;
                Vector3 pos = targetCenter + new Vector3(Mathf.Cos(rad) * radius, 0, Mathf.Sin(rad) * radius);
                points.Add(pos);
            }

            return points;
        }
    }
}