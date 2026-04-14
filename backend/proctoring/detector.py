from __future__ import annotations

import os
from threading import Lock

import cv2
import numpy as np

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - optional runtime dependency guard
    mp = None

EVENT_RISK_SCORES = {
    "Face Not Visible": 3,
    "Multiple Faces Detected": 5,
    "Suspicious Movement": 2,
}

MOVEMENT_THRESHOLD_PIXELS = 70.0

_mp_solutions_detector = None
_mp_solutions_namespace = getattr(mp, "solutions", None) if mp is not None else None
if _mp_solutions_namespace is not None and hasattr(_mp_solutions_namespace, "face_detection"):
    _mp_solutions_detector = _mp_solutions_namespace.face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.65,
    )

_mp_tasks_detector = None
if mp is not None and hasattr(mp, "tasks"):
    model_path = os.getenv("MEDIAPIPE_FACE_MODEL_PATH")
    if model_path:
        try:
            from mediapipe.tasks.python import vision

            _mp_tasks_detector = vision.FaceDetector.create_from_model_path(model_path)
        except Exception:
            _mp_tasks_detector = None

_haar_detector = None
_cv2_data = getattr(cv2, "data", None)
_haar_root = getattr(_cv2_data, "haarcascades", "") if _cv2_data is not None else ""
if _haar_root:
    _haar_detector = cv2.CascadeClassifier(
        _haar_root + "haarcascade_frontalface_default.xml"
    )
    if _haar_detector.empty():  # pragma: no cover - highly environment specific
        _haar_detector = None

_detector_lock = Lock()
_previous_face_centers: dict[str, np.ndarray] = {}
_state_lock = Lock()


def _risk_level(score: int) -> str:
    if score >= 6:
        return "HIGH"
    if score >= 3:
        return "MEDIUM"
    return "LOW"


def _mp_solutions_face_centers(frame_bgr: np.ndarray) -> list[np.ndarray]:
    if _mp_solutions_detector is None:
        return []

    frame_height, frame_width = frame_bgr.shape[:2]
    rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    with _detector_lock:
        results = _mp_solutions_detector.process(rgb_frame)

    detections = list(results.detections) if results and results.detections else []
    centers = [
        _mp_solutions_face_center(detection, frame_width, frame_height)
        for detection in detections
    ]
    return centers


def _mp_solutions_face_center(detection, width: int, height: int) -> np.ndarray:
    bbox = detection.location_data.relative_bounding_box
    center_x = (bbox.xmin + (bbox.width / 2.0)) * width
    center_y = (bbox.ymin + (bbox.height / 2.0)) * height
    center = np.array([center_x, center_y], dtype=np.float32)
    return np.clip(center, [0.0, 0.0], [float(width), float(height)])


def _mp_tasks_face_centers(frame_bgr: np.ndarray) -> list[np.ndarray]:
    if _mp_tasks_detector is None or mp is None:
        return []

    frame_height, frame_width = frame_bgr.shape[:2]
    rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    with _detector_lock:
        result = _mp_tasks_detector.detect(mp_image)

    detections = result.detections if result and result.detections else []
    centers: list[np.ndarray] = []
    for detection in detections:
        bbox = detection.bounding_box
        center = np.array(
            [
                float(bbox.origin_x + (bbox.width / 2.0)),
                float(bbox.origin_y + (bbox.height / 2.0)),
            ],
            dtype=np.float32,
        )
        centers.append(np.clip(center, [0.0, 0.0], [float(frame_width), float(frame_height)]))

    return centers


def _opencv_haar_face_centers(frame_bgr: np.ndarray) -> list[np.ndarray]:
    if _haar_detector is None:
        return []

    frame_height, frame_width = frame_bgr.shape[:2]
    gray_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    with _detector_lock:
        detections = _haar_detector.detectMultiScale(
            gray_frame,
            scaleFactor=1.12,
            minNeighbors=5,
            minSize=(60, 60),
        )

    centers: list[np.ndarray] = []
    for x, y, width, height in detections:
        center = np.array(
            [x + (width / 2.0), y + (height / 2.0)],
            dtype=np.float32,
        )
        centers.append(np.clip(center, [0.0, 0.0], [float(frame_width), float(frame_height)]))

    return centers


def _extract_face_centers(frame_bgr: np.ndarray) -> list[np.ndarray]:
    centers = _mp_solutions_face_centers(frame_bgr)
    if centers or _mp_solutions_detector is not None:
        return centers

    centers = _mp_tasks_face_centers(frame_bgr)
    if centers or _mp_tasks_detector is not None:
        return centers

    return _opencv_haar_face_centers(frame_bgr)


def detect_suspicious_behavior(frame_bgr: np.ndarray, user_id: str) -> dict:
    face_centers = _extract_face_centers(frame_bgr)
    face_count = len(face_centers)
    alerts: list[str] = []
    movement_distance = 0.0

    if face_count == 0:
        alerts.append("Face Not Visible")

    if face_count > 1:
        alerts.append("Multiple Faces Detected")

    if face_count == 1:
        current_center = face_centers[0]

        with _state_lock:
            previous_center = _previous_face_centers.get(user_id)
            _previous_face_centers[user_id] = current_center

        if previous_center is not None:
            movement_distance = float(np.linalg.norm(current_center - previous_center))
            if movement_distance > MOVEMENT_THRESHOLD_PIXELS:
                alerts.append("Suspicious Movement")
    else:
        with _state_lock:
            _previous_face_centers.pop(user_id, None)

    risk_score = sum(EVENT_RISK_SCORES.get(event, 0) for event in alerts)

    return {
        "alerts": alerts,
        "primary_alert": alerts[0] if alerts else "No Suspicious Activity",
        "risk_score": risk_score,
        "risk_level": _risk_level(risk_score),
        "faces_detected": face_count,
        "movement_distance": round(movement_distance, 2),
    }
