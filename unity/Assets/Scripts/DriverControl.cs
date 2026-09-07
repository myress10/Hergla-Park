using UnityEngine;

namespace HerglaPark
{
    [RequireComponent(typeof(CharacterController))]
    public class DriverControl : MonoBehaviour
    {
        [Header("Vitesse de déplacement")]
        [Tooltip("Vitesse de marche normale.")]
        public float walkSpeed = 4f;
        [Tooltip("Vitesse en courant (touche Shift maintenue).")]
        public float runSpeed = 8f;

        [Header("Saut & Gravité")]
        [Tooltip("Hauteur du saut.")]
        public float jumpHeight = 1.5f;
        [Tooltip("Force de gravité appliquée en continu.")]
        public float gravity = -20f;

        [Header("Caméra (optionnel)")]
        [Tooltip("Si assignée, le joueur tourne dans la direction où regarde cette caméra.")]
        public Transform cameraTransform;
        [Tooltip("Vitesse de rotation du joueur pour suivre la caméra.")]
        public float rotationSpeed = 10f;

        private CharacterController controller;
        private Vector3 velocity;
        private bool isGrounded;

        void Start()
        {
            controller = GetComponent<CharacterController>();
        }

        void Update()
        {
            HandleGroundCheck();
            HandleMovement();
            HandleJump();
            ApplyGravity();
        }

        private void HandleGroundCheck()
        {
            isGrounded = controller.isGrounded;

            // Empêche l'accumulation de vélocité verticale négative quand on est au sol
            if (isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
            }
        }

        private void HandleMovement()
        {
            float horizontalInput = 0f;
            float verticalInput = 0f;

            // Avancer / Reculer (W/S ou Flèches Haut/Bas)
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow))
            {
                verticalInput = 1f;
            }
            else if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow))
            {
                verticalInput = -1f;
            }

            // Gauche / Droite (A/D ou Flèches Gauche/Droite)
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
            {
                horizontalInput = -1f;
            }
            else if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
            {
                horizontalInput = 1f;
            }

            // Direction du mouvement basée sur l'orientation du joueur (ou de la caméra si assignée)
            Vector3 forward = transform.forward;
            Vector3 right = transform.right;

            if (cameraTransform != null)
            {
                forward = cameraTransform.forward;
                forward.y = 0f;
                forward.Normalize();

                right = cameraTransform.right;
                right.y = 0f;
                right.Normalize();
            }

            Vector3 moveDirection = (forward * verticalInput) + (right * horizontalInput);
            moveDirection.Normalize();

            // Vitesse actuelle (marche ou course avec Shift)
            bool isRunning = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            float currentSpeed = isRunning ? runSpeed : walkSpeed;

            controller.Move(moveDirection * currentSpeed * Time.deltaTime);

            // Rotation du joueur pour faire face à la direction du mouvement
            if (moveDirection.sqrMagnitude > 0.01f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(moveDirection);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
            }
        }

        private void HandleJump()
        {
            if (isGrounded && Input.GetKeyDown(KeyCode.Space))
            {
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }
        }

        private void ApplyGravity()
        {
            velocity.y += gravity * Time.deltaTime;
            controller.Move(velocity * Time.deltaTime);
        }
    }
}