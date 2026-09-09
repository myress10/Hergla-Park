using UnityEngine;

// Attach this to the Car GameObject (same object as CarController)
public class CarInteraction : MonoBehaviour
{
    [Header("References")]
    public GameObject player;              // Player GameObject (has PlayerController + CharacterController)
    public CameraFollow cameraFollow;      // The CameraFollow script attached to your Main Camera

    [Header("Camera Offsets")]
    public Vector3 drivingOffset = new Vector3(0f, 4f, -8f);  // further back/up while driving
    public Vector3 walkingOffset = new Vector3(0f, 2f, -4f);  // closer while walking

    [Header("Settings")]
    public KeyCode enterExitKey = KeyCode.Return; // Enter key

    private CarController carController;
    private PlayerController playerController;
    private CharacterController playerCharController;

    private bool playerInRange = false;
    private bool isDriving = false;

    void Start()
    {
        carController = GetComponent<CarController>();
        playerController = player.GetComponent<PlayerController>();
        playerCharController = player.GetComponent<CharacterController>();

        // Car can't be driven until the player gets in
        carController.enabled = false;
    }

    void Update()
    {
        if (!Input.GetKeyDown(enterExitKey)) return;

        if (!isDriving && playerInRange)
        {
            EnterCar();
        }
        else if (isDriving)
        {
            ExitCar();
        }
    }

    void EnterCar()
    {
        isDriving = true;

        // Turn off player movement and hide the player while driving
        playerController.enabled = false;
        playerCharController.enabled = false;
        player.SetActive(false);

        // Turn on car movement
        carController.enabled = true;

        // Smoothly switch the camera to follow the car
        if (cameraFollow != null)
        {
            cameraFollow.SetTarget(transform, drivingOffset);
        }
    }

    void ExitCar()
    {
        isDriving = false;

        // Turn off car movement
        carController.enabled = false;

        // Put the player back next to the car and re-enable them
        player.transform.position = transform.position + transform.right * 2f;
        player.SetActive(true);
        playerCharController.enabled = true;
        playerController.enabled = true;

        // Smoothly switch the camera back to follow the player
        if (cameraFollow != null)
        {
            cameraFollow.SetTarget(player.transform, walkingOffset);
        }
    }

    // This needs a SEPARATE trigger collider on the car (see setup notes)
    void OnTriggerEnter(Collider other)
    {
        if (other.gameObject == player)
        {
            playerInRange = true;
        }
    }

    void OnTriggerExit(Collider other)
    {
        if (other.gameObject == player)
        {
            playerInRange = false;
        }
    }
}