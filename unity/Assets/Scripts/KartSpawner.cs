using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace HerglaPark
{
    [ExecuteInEditMode]
    public class KartSpawner : MonoBehaviour
    {
        [Header("Références")]
        [Tooltip("La piste track_hergla pour positionner le kart. Si vide, détection automatique.")]
        public GameObject trackObject;

        [Header("Taille & Modèle Importé")]
        [Tooltip("Modèle 3D du kart/voiture importé (ex: wheels.glb). Si renseigné, utilise vos vrais matériaux et couleurs !")]
        public GameObject carModelPrefab;

        [Tooltip("Échelle globale du kart sur la piste.")]
        [Range(1.0f, 15.0f)]
        public float carScale = 4.0f;

        [ContextMenu("Générer le Kart Jouable sur la Piste")]
        public void SpawnPlayableKart()
        {
            // 1. Détecter l'objet 'driver' et la piste dans la scène
            if (trackObject == null)
            {
                trackObject = GameObject.Find("track_hergla");
                if (trackObject == null) trackObject = gameObject;
            }

            // Chercher spécifiquement Car.fbx dans Assets/Prefabs/
            if (carModelPrefab == null)
            {
#if UNITY_EDITOR
                carModelPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Prefabs/Car.fbx");
                if (carModelPrefab == null)
                {
                    string[] guids = AssetDatabase.FindAssets("Car t:Model");
                    if (guids.Length > 0)
                    {
                        carModelPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(AssetDatabase.GUIDToAssetPath(guids[0]));
                    }
                }
#endif
            }

            // Chercher l'objet 'driver' dans la scène ou l'instancier
            GameObject driverObj = GameObject.Find("driver") ?? GameObject.Find("Driver");
            Vector3 spawnPos;
            Quaternion spawnRot = Quaternion.identity;

            if (driverObj == null)
            {
#if UNITY_EDITOR
                // Charger le driver depuis Assets/Prefabs/driver s'il n'est pas encore dans la scène
                string[] driverGuids = AssetDatabase.FindAssets("scene t:Model", new[] { "Assets/Prefabs/driver" });
                if (driverGuids.Length > 0)
                {
                    string driverPath = AssetDatabase.GUIDToAssetPath(driverGuids[0]);
                    GameObject driverPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(driverPath);
                    if (driverPrefab != null)
                    {
                        driverObj = PrefabUtility.InstantiatePrefab(driverPrefab) as GameObject;
                        if (driverObj != null)
                        {
                            driverObj.name = "Driver";
                            driverObj.transform.position = trackObject != null ? trackObject.transform.position + Vector3.up * 0.5f : Vector3.zero;
                        }
                    }
                }
#endif
            }

            if (driverObj != null)
            {
                // Placer la voiture à 2.5 mètres à côté du conducteur (Driver)
                spawnPos = driverObj.transform.position + (driverObj.transform.right * 2.5f) + (Vector3.up * 0.3f);
                spawnRot = driverObj.transform.rotation;
                Debug.Log($"[KartSpawner] Voiture placée à côté du Driver '{driverObj.name}' !");
            }
            else if (trackObject != null)
            {
                Renderer r = trackObject.GetComponentInChildren<Renderer>();
                spawnPos = r != null ? r.bounds.center + new Vector3(0, 2.0f, 0) : trackObject.transform.position + new Vector3(0, 2.0f, 0);
                spawnRot = trackObject.transform.rotation;
            }
            else
            {
                spawnPos = new Vector3(0, 1.0f, 0);
            }

            // 2. Supprimer l'ancien kart s'il existe déjà
            GameObject existingKart = GameObject.Find("Kart_HerglaPark");
            if (existingKart != null)
            {
#if UNITY_EDITOR
                Undo.DestroyObjectImmediate(existingKart);
#else
                DestroyImmediate(existingKart);
#endif
            }

            // 3. Créer le GameObject principal du Kart
            GameObject kartRoot = new GameObject("Kart_HerglaPark");
            kartRoot.transform.position = spawnPos;
            kartRoot.transform.rotation = spawnRot;
            kartRoot.transform.localScale = Vector3.one * carScale;

            // Rigidbody
            Rigidbody rb = kartRoot.AddComponent<Rigidbody>();
            rb.mass = 800f;
            rb.linearDamping = 0.15f;
            rb.angularDamping = 2.5f;
            rb.interpolation = RigidbodyInterpolation.Interpolate;

            // BoxCollider
            BoxCollider col = kartRoot.AddComponent<BoxCollider>();
            col.center = new Vector3(0, 0.4f, 0);
            col.size = new Vector3(1.6f, 0.9f, 2.4f);

            // Script de conduite
            KartController controller = kartRoot.AddComponent<KartController>();
            controller.acceleration = 35f * (carScale * 0.5f);
            controller.maxSpeed = 40f;

            // 4. Utiliser le Modèle 3D/Prefab 'Car' importé et NORMALISER SON ÉCHELLE AUTOMATIQUEMENT
            if (carModelPrefab != null)
            {
#if UNITY_EDITOR
                GameObject modelInstance = PrefabUtility.InstantiatePrefab(carModelPrefab, kartRoot.transform) as GameObject;
#else
                GameObject modelInstance = Instantiate(carModelPrefab, kartRoot.transform);
#endif
                if (modelInstance != null)
                {
                    modelInstance.name = "Visual_Model";
                    modelInstance.transform.localPosition = Vector3.zero;
                    modelInstance.transform.localRotation = Quaternion.identity;

                    // Calculer les dimensions réelles du mesh de Car.fbx
                    Renderer[] renderers = modelInstance.GetComponentsInChildren<Renderer>();
                    if (renderers != null && renderers.Length > 0)
                    {
                        Bounds combinedBounds = renderers[0].bounds;
                        for (int i = 1; i < renderers.Length; i++)
                        {
                            combinedBounds.Encapsulate(renderers[i].bounds);
                        }

                        float maxDimension = Mathf.Max(combinedBounds.size.x, combinedBounds.size.z, combinedBounds.size.y);
                        
                        // Si le mesh est microscopique (ex: export Blender en cm) ou géant, normaliser sa taille à 2.8m de long
                        if (maxDimension > 0.001f)
                        {
                            float targetSize = 2.8f; 
                            float autoScaleFactor = targetSize / maxDimension;
                            modelInstance.transform.localScale = Vector3.one * autoScaleFactor;
                            Debug.Log($"[KartSpawner] Échelle du FBX '{carModelPrefab.name}' ajustée automatiquement ({autoScaleFactor:F2}x) -> Taille réelle : {targetSize}m.");
                        }

                        // Corriger les shaders magenta s'il y en a, tout en conservant les vraies textures d'origine
                        foreach (Renderer r in renderers)
                        {
                            foreach (Material m in r.sharedMaterials)
                            {
                                if (m != null && (m.shader == null || m.shader.name == "Hidden/InternalErrorShader" || m.shader.name.Contains("Error")))
                                {
                                    Shader valid = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
                                    if (valid != null) m.shader = valid;
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                // Trouver un Shader valide pour éviter le violet (Magenta)
                Shader validShader = Shader.Find("Universal Render Pipeline/Lit") ??
                                    Shader.Find("Standard") ??
                                    Shader.Find("Unlit/Color") ??
                                    Shader.Find("Sprites/Default");

                // Carrosserie Rouge Racing
                GameObject chassis = GameObject.CreatePrimitive(PrimitiveType.Cube);
                chassis.name = "Chassis";
                chassis.transform.SetParent(kartRoot.transform);
                chassis.transform.localPosition = new Vector3(0, 0.4f, 0);
                chassis.transform.localScale = new Vector3(1.4f, 0.4f, 2.2f);

                Material kartMat = new Material(validShader);
                kartMat.color = new Color(0.9f, 0.1f, 0.15f); // Rouge vif
                chassis.GetComponent<Renderer>().sharedMaterial = kartMat;

                // Spoiler
                GameObject spoiler = GameObject.CreatePrimitive(PrimitiveType.Cube);
                spoiler.name = "Spoiler";
                spoiler.transform.SetParent(kartRoot.transform);
                spoiler.transform.localPosition = new Vector3(0, 0.85f, -0.95f);
                spoiler.transform.localScale = new Vector3(1.5f, 0.1f, 0.4f);
                spoiler.GetComponent<Renderer>().sharedMaterial = kartMat;

                // Siège Noir
                GameObject seat = GameObject.CreatePrimitive(PrimitiveType.Cube);
                seat.name = "Seat";
                seat.transform.SetParent(kartRoot.transform);
                seat.transform.localPosition = new Vector3(0, 0.55f, -0.2f);
                seat.transform.localScale = new Vector3(0.8f, 0.5f, 0.7f);

                Material blackMat = new Material(validShader);
                blackMat.color = Color.black;
                seat.GetComponent<Renderer>().sharedMaterial = blackMat;

                // 4 Roues
                Vector3[] wheelOffsets = new Vector3[]
                {
                    new Vector3(-0.85f, 0.25f, 0.75f),
                    new Vector3(0.85f, 0.25f, 0.75f),
                    new Vector3(-0.85f, 0.25f, -0.75f),
                    new Vector3(0.85f, 0.25f, -0.75f)
                };

                for (int i = 0; i < 4; i++)
                {
                    GameObject wheel = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    wheel.name = $"Wheel_{i}";
                    wheel.transform.SetParent(kartRoot.transform);
                    wheel.transform.localPosition = wheelOffsets[i];
                    wheel.transform.localRotation = Quaternion.Euler(0, 0, 90);
                    wheel.transform.localScale = new Vector3(0.5f, 0.15f, 0.5f);
                    wheel.GetComponent<Renderer>().sharedMaterial = blackMat;
                    DestroyImmediate(wheel.GetComponent<Collider>());
                }
            }

            // 5. Connecter la Caméra Principale au niveau des YEUX DU CONDUCTEUR (First Person View)
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                mainCam.nearClipPlane = 0.05f; // Pour voir le volant sans couper la vue
                mainCam.farClipPlane = 1500f;
                if (mainCam.backgroundColor == Color.white)
                {
                    mainCam.backgroundColor = new Color(0.18f, 0.55f, 0.85f);
                }

                CameraFollow camFollow = mainCam.GetComponent<CameraFollow>();
                if (camFollow == null)
                {
                    camFollow = mainCam.gameObject.AddComponent<CameraFollow>();
                }
                camFollow.target = kartRoot.transform;
                camFollow.viewMode = CameraFollow.ViewMode.FirstPersonDriverEyes;
                camFollow.driverEyeOffset = new Vector3(0, 1.15f, 0.25f);

                // Placer immédiatement la caméra au niveau des yeux dans l'Éditeur
                mainCam.transform.position = kartRoot.transform.TransformPoint(camFollow.driverEyeOffset);
                mainCam.transform.rotation = kartRoot.transform.rotation;
            }

            // 6. Corriger l'éclairage trop puissant (Directional Light / Global Volume) s'il est blanc aveuglant
            Light dirLight = FindFirstObjectByType<Light>();
            if (dirLight != null && dirLight.type == LightType.Directional)
            {
                if (dirLight.intensity > 5.0f)
                {
                    dirLight.intensity = 1.2f; // Éclairage doux et naturel
                    Debug.Log("[KartSpawner] Intensité de la lumière directionnelle ajustée à 1.2f pour éviter l'éblouissement.");
                }
            }

#if UNITY_EDITOR
            Undo.RegisterCreatedObjectUndo(kartRoot, "Générer le Kart Jouable");
            Selection.activeGameObject = kartRoot;
            SceneView.FrameLastActiveSceneView();
#endif

            Debug.Log($"[KartSpawner] Kart 'Kart_HerglaPark' généré avec succès ! Problème d'écran blanc résolu.");
        }
    }
}
