#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace HerglaPark
{
    [CustomEditor(typeof(DecorationColliderSetup))]
    [CanEditMultipleObjects]
    public class DecorationColliderSetupEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();

            DecorationColliderSetup setup = (DecorationColliderSetup)target;

            EditorGUILayout.Space(15);
            GUIStyle buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                fixedHeight = 42
            };

            GUI.backgroundColor = new Color(0.95f, 0.5f, 0.15f); // Orange vif
            if (GUILayout.Button("🌴 Ajouter Colliders (Palm, Light, Rocks, Grass)", buttonStyle))
            {
                setup.SetupDecorationColliders();
            }

            GUI.backgroundColor = Color.white;
        }
    }
}
#endif
