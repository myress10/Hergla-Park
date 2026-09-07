using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace HerglaPark
{
    [ExecuteInEditMode]
    public class TerrainMaterialScaler : MonoBehaviour
    {
        [Header("Cible (Terrain ou Objet Mesh Sol)")]
        [Tooltip("L'objet du terrain ou du sol. Si vide, recherche automatiquement dans la scène.")]
        public GameObject terrainObject;

        [Header("Réglages de la Taille de Texture")]
        [Tooltip("Facteur de répétition (Tiling) pour un Matériau Mesh (ex: 20, 50, 100). Plus la valeur est grande, plus la texture est petite.")]
        public Vector2 meshMaterialTiling = new Vector2(30f, 30f);

        [Tooltip("Taille du pavé (Tile Size) pour un Terrain Unity officiel.")]
        public Vector2 terrainLayerTileSize = new Vector2(1.5f, 1.5f);

        /// <summary>
        /// Convertit le Shader glTF (qui bloque le Tiling) vers URP Lit ou Standard pour débloquer la répétition de texture
        /// </summary>
        [ContextMenu("Convertir Shader & Appliquer Tiling")]
        public void ConvertShaderAndApplyTiling()
        {
            if (terrainObject == null) terrainObject = gameObject;

            Renderer[] renderers = terrainObject.GetComponentsInChildren<Renderer>();
            foreach (Renderer renderer in renderers)
            {
                Material mat = renderer.sharedMaterial;
                if (mat == null) mat = renderer.material;

                if (mat != null)
                {
#if UNITY_EDITOR
                    Undo.RecordObject(mat, "Convertir Shader Terrain pour Tiling");
#endif
                    // Essayer de trouver un Shader compatible avec le Tiling dynamique
                    Shader targetShader = Shader.Find("Universal Render Pipeline/Lit");
                    if (targetShader == null) targetShader = Shader.Find("Standard");
                    if (targetShader == null) targetShader = Shader.Find("Legacy Shaders/Diffuse");

                    if (targetShader != null)
                    {
                        mat.shader = targetShader;
                        Debug.Log($"[TerrainMaterialScaler] Shader du matériau '{mat.name}' changé vers '{targetShader.name}'.");
                    }

                    // Appliquer le Tiling sur le nouveau Shader
                    if (mat.HasProperty("_MainTex")) mat.SetTextureScale("_MainTex", meshMaterialTiling);
                    if (mat.HasProperty("_BaseMap")) mat.SetTextureScale("_BaseMap", meshMaterialTiling);
                    if (mat.HasProperty("_BumpMap")) mat.SetTextureScale("_BumpMap", meshMaterialTiling);

#if UNITY_EDITOR
                    EditorUtility.SetDirty(mat);
#endif
                    Debug.Log($"[TerrainMaterialScaler] Tiling ({meshMaterialTiling.x} x {meshMaterialTiling.y}) appliqué avec succès !");
                }
            }
        }

        /// <summary>
        /// Applique le Tiling (répétition) sur toutes les propriétés de texture du Shader
        /// </summary>
        [ContextMenu("Appliquer Répétition Texture (Texture Plus Petite)")]
        public void ApplyTextureScaling()
        {
            if (terrainObject == null) terrainObject = gameObject;

            bool modified = false;

            // 1. Traitement si c'est un Terrain Unity officiel
            Terrain terrain = terrainObject.GetComponent<Terrain>();
            if (terrain != null && terrain.terrainData != null)
            {
                TerrainLayer[] layers = terrain.terrainData.terrainLayers;
                if (layers != null && layers.Length > 0)
                {
                    foreach (TerrainLayer layer in layers)
                    {
                        if (layer != null)
                        {
#if UNITY_EDITOR
                            Undo.RecordObject(layer, "Changer Taille Texture Terrain");
#endif
                            layer.tileSize = terrainLayerTileSize;
#if UNITY_EDITOR
                            EditorUtility.SetDirty(layer);
#endif
                            Debug.Log($"[TerrainMaterialScaler] Couche Terrain '{layer.name}' ajustée : Tile Size = {terrainLayerTileSize}.");
                            modified = true;
                        }
                    }
                }
            }

            // 2. Traitement si le terrain est un Mesh (MeshRenderer)
            Renderer[] renderers = terrainObject.GetComponentsInChildren<Renderer>();
            foreach (Renderer renderer in renderers)
            {
                Material mat = renderer.sharedMaterial;
                if (mat == null) mat = renderer.material;

                if (mat != null)
                {
                    Shader shader = mat.shader;
#if UNITY_EDITOR
                    Undo.RecordObject(mat, "Ajuster Tiling Matériau Terrain");
                    EditorUtility.SetDirty(mat);
#endif
                    // Tenter de modifier le Tiling
                    if (mat.HasProperty("_MainTex")) mat.SetTextureScale("_MainTex", meshMaterialTiling);
                    if (mat.HasProperty("_BaseMap")) mat.SetTextureScale("_BaseMap", meshMaterialTiling);
                    if (mat.HasProperty("_BumpMap")) mat.SetTextureScale("_BumpMap", meshMaterialTiling);

                    modified = true;
                }
            }

            if (!modified)
            {
                Debug.LogWarning("[TerrainMaterialScaler] Aucun composant Matériau ou Terrain n'a pu être modifié.");
            }
        }

        private void OnValidate()
        {
            ApplyTextureScaling();
        }

        public void SetSmallScale()
        {
            meshMaterialTiling = new Vector2(15f, 15f);
            terrainLayerTileSize = new Vector2(3f, 3f);
            ConvertShaderAndApplyTiling();
        }

        public void SetMediumFineScale()
        {
            meshMaterialTiling = new Vector2(30f, 30f);
            terrainLayerTileSize = new Vector2(1.5f, 1.5f);
            ConvertShaderAndApplyTiling();
        }

        public void SetVeryFineScale()
        {
            meshMaterialTiling = new Vector2(60f, 60f);
            terrainLayerTileSize = new Vector2(0.8f, 0.8f);
            ConvertShaderAndApplyTiling();
        }
    }
}
