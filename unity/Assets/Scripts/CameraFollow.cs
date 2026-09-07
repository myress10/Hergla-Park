using UnityEngine;

namespace HerglaPark
{
    public class CameraFollow : MonoBehaviour
    {
        public enum ViewMode
        {
            FirstPersonDriverEyes, // Vue Première Personne (Yeux du Conducteur)
            ThirdPersonBehind      // Vue 3ème Personne (Derrière le Kart)
        }

        [Header("Mode de Vue")]
        [Tooltip("Type de caméra : Vue Yeux du Conducteur (Première Personne) ou 3ème personne.")]
        public ViewMode viewMode = ViewMode.FirstPersonDriverEyes;

        [Header("Cible à Suivre")]
        [Tooltip("Le kart ou le conducteur à suivre.")]
        public Transform target;

        [Header("Décalage Yeux du Conducteur (1ère Personne)")]
        [Tooltip("Position exacte des yeux du conducteur par rapport au kart.")]
        public Vector3 driverEyeOffset = new Vector3(0, 1.15f, 0.25f);

        [Header("Décalage 3ème Personne")]
        public Vector3 thirdPersonOffset = new Vector3(0, 3.5f, -7.0f);

        [Header("Sensibilité & Fluidité")]
        public float smoothSpeed = 15f;
        public float rotationSmoothSpeed = 15f;
        public float mouseSensitivity = 2f;

        private Camera cam;
        private float pitch = 0f; // Regarder haut/bas
        private float yaw = 0f;   // Regarder gauche/droite

        private void Start()
        {
            cam = GetComponent<Camera>();
            if (cam != null)
            {
                // Un near clip très proche (0.05m) pour voir le volant et le tableau de bord sans couper la vue !
                cam.nearClipPlane = 0.05f;
                cam.farClipPlane = 1500f;

                if (cam.backgroundColor == Color.white)
                {
                    cam.backgroundColor = new Color(0.18f, 0.55f, 0.85f);
                }
            }

            // Positionnement immédiat au lancement
            if (target != null)
            {
                Vector3 startOffset = (viewMode == ViewMode.FirstPersonDriverEyes) ? driverEyeOffset : thirdPersonOffset;
                transform.position = target.TransformPoint(startOffset);
                transform.rotation = target.rotation;
            }
        }

        private void LateUpdate()
        {
            if (target == null) return;

            if (viewMode == ViewMode.FirstPersonDriverEyes)
            {
                // 1. Positionner la caméra exactement au niveau des YEUX DU CONDUCTEUR
                Transform headBone = FindHeadBone(target);
                Vector3 eyePosition = (headBone != null) ? headBone.position + headBone.forward * 0.1f : target.TransformPoint(driverEyeOffset);

                transform.position = Vector3.Lerp(transform.position, eyePosition, Time.deltaTime * smoothSpeed);

                // Regard libre avec la souris (Optionnel)
                if (Input.GetMouseButton(1))
                {
                    yaw += Input.GetAxis("Mouse X") * mouseSensitivity;
                    pitch -= Input.GetAxis("Mouse Y") * mouseSensitivity;
                    pitch = Mathf.Clamp(pitch, -40f, 60f);
                    transform.rotation = Quaternion.Euler(target.eulerAngles.x + pitch, target.eulerAngles.y + yaw, target.eulerAngles.z);
                }
                else
                {
                    // La vue suit naturellement le regard et la direction du kart
                    yaw = Mathf.Lerp(yaw, 0, Time.deltaTime * 5f);
                    pitch = Mathf.Lerp(pitch, 0, Time.deltaTime * 5f);
                    Quaternion targetRot = target.rotation * Quaternion.Euler(pitch, yaw, 0);
                    transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, Time.deltaTime * rotationSmoothSpeed);
                }
            }
            else
            {
                // Vue 3ème Personne
                Vector3 desiredPosition = target.TransformPoint(thirdPersonOffset);
                Vector3 targetLookAt = target.position + Vector3.up * 1.5f;

                Vector3 rayDirection = desiredPosition - targetLookAt;
                float rayDistance = rayDirection.magnitude;

                if (Physics.Raycast(targetLookAt, rayDirection.normalized, out RaycastHit hit, rayDistance))
                {
                    transform.position = hit.point - rayDirection.normalized * 0.5f;
                }
                else
                {
                    transform.position = Vector3.Lerp(transform.position, desiredPosition, Time.deltaTime * smoothSpeed);
                }

                Quaternion targetRotation = Quaternion.LookRotation(targetLookAt - transform.position);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * rotationSmoothSpeed);
            }
        }

        private Transform FindHeadBone(Transform current)
        {
            if (current.name.ToLower().Contains("head") || current.name.ToLower().Contains("eye") || current.name.ToLower().Contains("tete"))
            {
                return current;
            }

            foreach (Transform child in current)
            {
                Transform found = FindHeadBone(child);
                if (found != null) return found;
            }
            return null;
        }
    }
}
