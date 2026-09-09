#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace HerglaPark
{
    [CustomEditor(typeof(TrackTirePlacer))]
    public class TrackTirePlacerEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            // Dessiner les champs par défaut de l'Inspector
            DrawDefaultInspector();

            TrackTirePlacer placer = (TrackTirePlacer)target;

            EditorGUILayout.Space(15);
            GUIStyle buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                fixedHeight = 40
            };

            // Bouton principal pour générer les pneus
            GUI.backgroundColor = new Color(0.2f, 0.75f, 0.3f); // Vert vif
            if (GUILayout.Button("🏎️ Placer les Pneus dans les Virages", buttonStyle))
            {
                placer.PlaceTiresInTurns();
            }

            EditorGUILayout.Space(5);

            // Bouton pour effacer/réinitialiser
            GUI.backgroundColor = new Color(0.85f, 0.25f, 0.25f); // Rouge
            if (GUILayout.Button("🗑️ Effacer les Pneus Générés", GUILayout.Height(30)))
            {
                if (EditorUtility.DisplayDialog("Confirmation", "Voulez-vous vraiment effacer tous les pneus générés ?", "Oui", "Annuler"))
                {
                    placer.ClearTires();
                }
            }

            GUI.backgroundColor = Color.white;
        }
    }
}
#endif
