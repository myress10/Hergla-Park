using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float walkSpeed = 4f;
    public float runSpeed = 8f;
    public float jumpHeight = 1.5f;
    public float gravity = -9.81f;

    [Header("Turning")]
    public float turnSpeed = 120f; // degrees per second, like turning a steering wheel

    [Header("Keybinds")]
    public KeyCode runKey = KeyCode.R;
    public KeyCode jumpKey = KeyCode.Space;

    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;

    void Start()
    {
        controller = GetComponent<CharacterController>();
    }

    void Update()
    {
        HandleGravityAndGround();
        HandleTurning();
        HandleMovement();
        HandleJump();

        controller.Move(velocity * Time.deltaTime);
    }

    void HandleGravityAndGround()
    {
        isGrounded = controller.isGrounded;

        // Small negative value keeps the player grounded instead of floating at 0
        if (isGrounded && velocity.y < 0f)
        {
            velocity.y = -2f;
        }

        velocity.y += gravity * Time.deltaTime;
    }

    void HandleTurning()
    {
        float turnInput = Input.GetAxis("Horizontal"); // A / D -> turn left / right

        transform.Rotate(Vector3.up, turnInput * turnSpeed * Time.deltaTime);
    }

    void HandleMovement()
    {
        float vertical = Input.GetAxis("Vertical"); // W / S -> forward / back

        float currentSpeed = Input.GetKey(runKey) ? runSpeed : walkSpeed;

        Vector3 forwardMove = transform.forward * vertical * currentSpeed;
        velocity.x = forwardMove.x;
        velocity.z = forwardMove.z;
    }

    void HandleJump()
    {
        if (isGrounded && Input.GetKeyDown(jumpKey))
        {
            // v = sqrt(h * -2 * gravity)
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }
    }
}