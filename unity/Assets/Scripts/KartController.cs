using UnityEngine;

namespace HerglaPark
{
    [RequireComponent(typeof(Rigidbody))]
    public class KartController : MonoBehaviour
    {
        [Header("Performances du Kart")]
        [Tooltip("Force d'accélération.")]
        public float acceleration = 30f;

        [Tooltip("Vitesse maximale.")]
        public float maxSpeed = 35f;

        [Tooltip("Vitesse de virage/rotation.")]
        public float turnSpeed = 90f;

        [Tooltip("Force de freinage.")]
        public float brakeForce = 5f;

        [Tooltip("Multiplicateur de gravité pour garder le kart collé à la piste.")]
        public float gravityMultiplier = 3.0f;

        [Header("Stabilité & Physique")]
        public float centerOfMassOffsetY = -0.5f;

        private Rigidbody rb;
        private float moveInput;
        private float turnInput;
        private bool isGrounded;

        private void Start()
        {
            rb = GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.centerOfMass += new Vector3(0, centerOfMassOffsetY, 0);
            }
        }

        private void Update()
        {
            // Entrées ZQSD / WASD / Flèches du clavier
            moveInput = Input.GetAxis("Vertical");
            turnInput = Input.GetAxis("Horizontal");

            // Vérifier si le kart touche la piste
            isGrounded = Physics.Raycast(transform.position + Vector3.up * 0.3f, Vector3.down, 1.5f);
        }

        private void FixedUpdate()
        {
            if (rb == null) return;

            if (isGrounded)
            {
                // Avancer / Reculer
                if (Mathf.Abs(moveInput) > 0.05f)
                {
                    if (rb.linearVelocity.magnitude < maxSpeed)
                    {
                        Vector3 force = transform.forward * moveInput * acceleration;
                        rb.AddForce(force, ForceMode.Acceleration);
                    }
                }

                // Virage (Rotation le long de l'axe Y)
                if (rb.linearVelocity.magnitude > 0.5f)
                {
                    float dir = moveInput >= 0 ? 1f : -1f;
                    float rotationAmount = turnInput * turnSpeed * dir * Time.fixedDeltaTime;
                    Quaternion turnRotation = Quaternion.Euler(0f, rotationAmount, 0f);
                    rb.MoveRotation(rb.rotation * turnRotation);
                }

                // Frein à main (Touche Espace)
                if (Input.GetKey(KeyCode.Space))
                {
                    rb.linearVelocity = Vector3.Lerp(rb.linearVelocity, Vector3.zero, Time.fixedDeltaTime * brakeForce);
                }
            }
            else
            {
                // Gravité renforcée pour éviter le décollage
                rb.AddForce(Vector3.down * gravityMultiplier * 9.81f, ForceMode.Acceleration);
            }
        }
    }
}
