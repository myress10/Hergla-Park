using UnityEngine;

public class CarController : MonoBehaviour
{
    [Header("Speed Gears (S taps cycle through these)")]
    public float[] gearSpeeds = { 1f, 2f, 3f, 4f }; // speed level 1 to 4
    private int currentGearIndex = 0; // starts at gear 1 (index 0)

    [Header("Movement")]
    public float acceleration = 5f;
    public float turnSpeed = 60f;      // degrees per second
    public float deceleration = 3f;    // how fast the car slows when not pressing forward

    [Header("Keybinds")]
    public KeyCode forwardKey = KeyCode.W;
    public KeyCode backKey = KeyCode.Z; // reverse
    public KeyCode gearShiftKey = KeyCode.S;
    public KeyCode leftKey = KeyCode.A;
    public KeyCode rightKey = KeyCode.D;

    private float currentSpeed = 0f;
    private bool gearKeyHeldLastFrame = false;

    void Update()
    {
        HandleGearShift();
        HandleAcceleration();
        HandleSteering();
        HandleMovement();
    }

    void HandleGearShift()
    {
        // Detect a single tap (key down this frame, wasn't down last frame)
        bool gearKeyDown = Input.GetKey(gearShiftKey);

        if (gearKeyDown && !gearKeyHeldLastFrame)
        {
            currentGearIndex = (currentGearIndex + 1) % gearSpeeds.Length; // cycles 1 -> 2 -> 3 -> 4 -> 1
        }

        gearKeyHeldLastFrame = gearKeyDown;
    }

    void HandleAcceleration()
    {
        float targetSpeed = gearSpeeds[currentGearIndex];

        if (Input.GetKey(forwardKey))
        {
            currentSpeed = Mathf.MoveTowards(currentSpeed, targetSpeed, acceleration * Time.deltaTime);
        }
        else if (Input.GetKey(backKey))
        {
            currentSpeed = Mathf.MoveTowards(currentSpeed, -targetSpeed, acceleration * Time.deltaTime);
        }
        else
        {
            currentSpeed = Mathf.MoveTowards(currentSpeed, 0f, deceleration * Time.deltaTime);
        }
    }

    void HandleSteering()
    {
        float steerInput = 0f;

        if (Input.GetKey(leftKey)) steerInput = -1f;
        if (Input.GetKey(rightKey)) steerInput = 1f;

        // Only steer while the car is actually moving, like a real car
        if (Mathf.Abs(currentSpeed) > 0.1f)
        {
            float turnDirection = currentSpeed > 0 ? 1f : -1f; // reverse turns opposite when going backward
            transform.Rotate(Vector3.up, steerInput * turnDirection * turnSpeed * Time.deltaTime);
        }
    }

    void HandleMovement()
    {
        transform.Translate(Vector3.forward * currentSpeed * Time.deltaTime);
    }
}