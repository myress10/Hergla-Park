#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace HerglaPark
{
    [CustomEditor(typeof(TrackColliderSetup))]
    [CanEditMultipleObjects]
    public class TrackColliderSetupEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();

            TrackColliderSetup setup = (TrackColliderSetup)target;

            EditorGUILayout.Space(15);
            GUIStyle buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                fixedHeight = 40
            };

            GUI.backgroundColor = new Color(0.18f, 0.55f, 0.85f); // Bleu vif
            if (GUILayout.Button("🛠️ Ajouter MeshCollider Non-Convexe", buttonStyle))
            {
                setup.AddMeshColliderToTrack();
            }

            GUI.backgroundColor = Color.white;
        }
    }
}
#endif
