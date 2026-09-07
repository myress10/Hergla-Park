#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace HerglaPark
{
    [CustomEditor(typeof(KartSpawner))]
    [CanEditMultipleObjects]
    public class KartSpawnerEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();

            KartSpawner spawner = (KartSpawner)target;

            EditorGUILayout.Space(15);
            GUIStyle btnStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                fixedHeight = 45
            };

            GUI.backgroundColor = new Color(0.9f, 0.2f, 0.2f); // Rouge Racing
            if (GUILayout.Button("🏎️ Générer le Kart Jouable sur la Piste", btnStyle))
            {
                spawner.SpawnPlayableKart();
            }

            GUI.backgroundColor = Color.white;
        }
    }
}
#endif
