using UnityEngine;

namespace HerglaPark
{
    [RequireComponent(typeof(Rigidbody))]
    public class CarControl : MonoBehaviour
    {
        [Header("Vitesses (paliers V+1/2/3/4)")]
        [Tooltip("Vitesse max pour le palier 1 (le plus lent).")]
        public float speedLevel1 = 10f;
        [Tooltip("Vitesse max pour le palier 2.")]
        public float speedLevel2 = 20f;
        [Tooltip("Vitesse max pour le palier 3.")]
        public float speedLevel3 = 35f;
        [Tooltip("Vitesse max pour le palier 4 (le plus rapide).")]
        public float speedLevel4 = 50f;

        [Header("Accélération & Direction")]
        [Tooltip("Force d'accélération appliquée en avant/arrière.")]
        public float acceleration = 15f;
        [Tooltip("Vitesse de rotation du volant (degrés/seconde).")]
        public float turnSpeed = 80f;
        [Tooltip("Force de freinage/décélération naturelle quand aucune touche n'est pressée.")]
        public float naturalDrag = 2f;

        [Header("Stabilité")]
        [Tooltip("Empêche la voiture de basculer sur le côté.")]
        public bool freezeTiltRotation = true;

        private Rigidbody rb;
        private float currentMaxSpeed;
        private int currentSpeedLevel = 2; // Palier par défaut au démarrage
        private bool waitingForSpeedNumber = false;

        void Start()
        {
            rb = GetComponent<Rigidbody>();

            if (freezeTiltRotation)
            {
                rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
            }

            UpdateMaxSpeed();
        }

        void Update()
        {
            HandleSpeedLevelInput();
        }

        void FixedUpdate()
        {
            HandleMovement();
        }

        private void HandleSpeedLevelInput()
        {
            // Appui sur V : on attend un chiffre juste après
            if (Input.GetKeyDown(KeyCode.V))
            {
                waitingForSpeedNumber = true;
                return;
            }

            if (waitingForSpeedNumber)
            {
                if (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Keypad1))
                {
                    currentSpeedLevel = 1;
                    UpdateMaxSpeed();
                    waitingForSpeedNumber = false;
                }
                else if (Input.GetKeyDown(KeyCode.Alpha2) || Input.GetKeyDown(KeyCode.Keypad2))
                {
                    currentSpeedLevel = 2;
                    UpdateMaxSpeed();
                    waitingForSpeedNumber = false;
                }
                else if (Input.GetKeyDown(KeyCode.Alpha3) || Input.GetKeyDown(KeyCode.Keypad3))
                {
                    currentSpeedLevel = 3;
                    UpdateMaxSpeed();
                    waitingForSpeedNumber = false;
                }
                else if (Input.GetKeyDown(KeyCode.Alpha4) || Input.GetKeyDown(KeyCode.Keypad4))
                {
                    currentSpeedLevel = 4;
                    UpdateMaxSpeed();
                    waitingForSpeedNumber = false;
                }
            }
        }

        private void UpdateMaxSpeed()
        {
            switch (currentSpeedLevel)
            {
                case 1: currentMaxSpeed = speedLevel1; break;
                case 2: currentMaxSpeed = speedLevel2; break;
                case 3: currentMaxSpeed = speedLevel3; break;
                case 4: currentMaxSpeed = speedLevel4; break;
                default: currentMaxSpeed = speedLevel2; break;
            }

            Debug.Log($"[CarControl] Palier de vitesse changé : Niveau {currentSpeedLevel} (max {currentMaxSpeed} u/s)");
        }

        private void HandleMovement()
        {
            float verticalInput = 0f;
            float horizontalInput = 0f;

            // Avancer / Reculer (W/S ou Flèches Haut/Bas)
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow))
            {
                verticalInput = 1f;
            }
            else if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow))
            {
                verticalInput = -1f;
            }

            // Tourner Gauche / Droite (A/D ou Flèches Gauche/Droite)
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
            {
                horizontalInput = -1f;
            }
            else if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
            {
                horizontalInput = 1f;
            }

            // Vitesse actuelle projetée vers l'avant de la voiture
            float forwardSpeed = Vector3.Dot(rb.linearVelocity, transform.forward);

            // Appliquer l'accélération si en dessous de la vitesse max du palier actuel
            if (verticalInput != 0f)
            {
                if (Mathf.Abs(forwardSpeed) < currentMaxSpeed)
                {
                    rb.AddForce(transform.forward * verticalInput * acceleration, ForceMode.Acceleration);
                }
            }
            else
            {
                // Décélération naturelle si aucune touche avant/arrière n'est pressée
                Vector3 flatVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
                rb.AddForce(-flatVelocity.normalized * naturalDrag, ForceMode.Acceleration);
            }

            // Rotation (seulement si la voiture avance/recule un minimum, comme une vraie voiture)
            if (Mathf.Abs(forwardSpeed) > 0.5f && horizontalInput != 0f)
            {
                float turnDirection = (verticalInput >= 0) ? horizontalInput : -horizontalInput;
                float rotationAmount = turnDirection * turnSpeed * Time.fixedDeltaTime;
                Quaternion turnRotation = Quaternion.Euler(0f, rotationAmount, 0f);
                rb.MoveRotation(rb.rotation * turnRotation);
            }

            // Limiter la vitesse max absolue (sécurité, évite les dépassements physiques)
            Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
            if (horizontalVelocity.magnitude > currentMaxSpeed)
            {
                Vector3 limitedVelocity = horizontalVelocity.normalized * currentMaxSpeed;
                rb.linearVelocity = new Vector3(limitedVelocity.x, rb.linearVelocity.y, limitedVelocity.z);
            }
        }
    }
}