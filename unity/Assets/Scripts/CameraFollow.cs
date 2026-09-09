using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [Header("Target")]
    public Transform target; // Current thing the camera follows (Player or Car)

    [Header("Offset & Smoothing")]
    public Vector3 offset = new Vector3(0f, 3f, -6f); // relative to target's facing direction
    public float positionSmoothSpeed = 8f;
    public float rotationSmoothSpeed = 8f;
    public bool lookAtTarget = true;
    public float lookHeightOffset = 1.5f; // aim slightly above the target's pivot

    void LateUpdate()
    {
        if (target == null) return;

        Vector3 desiredPosition = target.position + target.TransformDirection(offset);
        transform.position = Vector3.Lerp(transform.position, desiredPosition, positionSmoothSpeed * Time.deltaTime);

        if (lookAtTarget)
        {
            Vector3 lookPoint = target.position + Vector3.up * lookHeightOffset;
            Quaternion desiredRotation = Quaternion.LookRotation(lookPoint - transform.position);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, rotationSmoothSpeed * Time.deltaTime);
        }
    }

    // Call this from CarInteraction.cs when the player enters/exits the car
    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }

    // Overload to also change the offset (e.g. driving view needs to be further back than walking view)
    public void SetTarget(Transform newTarget, Vector3 newOffset)
    {
        target = newTarget;
        offset = newOffset;
    }
}