#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace HerglaPark
{
    [CustomEditor(typeof(TerrainMaterialScaler))]
    [CanEditMultipleObjects]
    public class TerrainMaterialScalerEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            serializedObject.Update();

            DrawDefaultInspector();

            TerrainMaterialScaler scaler = (TerrainMaterialScaler)target;

            EditorGUILayout.Space(15);
            GUIStyle headerStyle = new GUIStyle(EditorStyles.boldLabel) { fontSize = 13 };
            EditorGUILayout.LabelField("⚡ Raccourcis de Répétition Texture (Tiling) :", headerStyle);

            GUIStyle btnStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 12,
                fontStyle = FontStyle.Bold,
                fixedHeight = 38
            };

            GUI.backgroundColor = new Color(0.2f, 0.7f, 0.9f); // Bleu clair
            if (GUILayout.Button("🔍 Réduire un peu (Tiling 15x15)", btnStyle))
            {
                foreach (Object t in targets)
                {
                    TerrainMaterialScaler s = (TerrainMaterialScaler)t;
                    s.SetSmallScale();
                }
            }

            GUI.backgroundColor = new Color(0.2f, 0.8f, 0.4f); // Vert
            if (GUILayout.Button("🔍 Texture Fine (Tiling 30x30)", btnStyle))
            {
                foreach (Object t in targets)
                {
                    TerrainMaterialScaler s = (TerrainMaterialScaler)t;
                    s.SetMediumFineScale();
                }
            }

            GUI.backgroundColor = new Color(0.9f, 0.4f, 0.2f); // Orange
            if (GUILayout.Button("🔍 Texture Très Fine (Tiling 60x60)", btnStyle))
            {
                foreach (Object t in targets)
                {
                    TerrainMaterialScaler s = (TerrainMaterialScaler)t;
                    s.SetVeryFineScale();
                }
            }

            EditorGUILayout.Space(10);
            GUI.backgroundColor = new Color(0.6f, 0.3f, 0.9f); // Violet
            if (GUILayout.Button("⚡ Convertir Shader & Forcer Tiling", GUILayout.Height(38)))
            {
                foreach (Object t in targets)
                {
                    TerrainMaterialScaler s = (TerrainMaterialScaler)t;
                    s.ConvertShaderAndApplyTiling();
                }
            }

            serializedObject.ApplyModifiedProperties();
        }
    }
}
#endif
