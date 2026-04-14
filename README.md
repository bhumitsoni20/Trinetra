# Trinetra - AI Exam Proctoring System

Trinetra is a full-stack, privacy-first virtual invigilator for online exams.
It monitors webcam frames in realtime, detects suspicious behavior using AI (MediaPipe + OpenCV), emits live alerts, and logs only metadata events in SQLite.

## Highlights

- Realtime webcam monitoring dashboard with premium dark UI
- AI detections for:
	- Face Not Visible
	- Multiple Faces Detected
	- Suspicious Movement
- Realtime alerts streamed over WebSocket/Socket.IO
- Cheating risk scoring and visual risk level meter
- Event timeline logs from SQLite
- Django admin panel for filtering and sorting logs
- Privacy-safe design: no image/video persistence

## Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- Socket.IO client
- react-webcam

### Backend

- Django
- Django REST Framework
- Django Channels
- SQLite
- python-socketio (Socket.IO compatibility)

### AI / Computer Vision

- OpenCV
- MediaPipe
- NumPy

## Project Structure

```text
Trinetra/
|- backend/
|  |- exam_proctoring/
|  |- proctoring/
|  |- manage.py
|  |- requirements.txt
|- frontend/
|  |- src/
|  |- package.json
|- README.md
```

## Risk Scoring

- Face Missing: +3
- Multiple Faces: +5
- Suspicious Movement: +2

Risk level bands:

- LOW: score < 3
- MEDIUM: score 3 to 5
- HIGH: score >= 6

## API Endpoints

### POST /api/detect/

Input:

```json
{
	"image": "data:image/jpeg;base64,...",
	"user_id": "candidate-001"
}
```

Response:

```json
{
	"alert": "Multiple Faces Detected",
	"alerts": ["Multiple Faces Detected"],
	"risk_score": 5,
	"risk_level": "MEDIUM",
	"faces_detected": 2,
	"movement_distance": 0,
	"logged_events": [
		{
			"user_id": "candidate-001",
			"event": "Multiple Faces Detected",
			"risk_score": 5,
			"timestamp": "2026-04-14T10:00:00.000000+00:00"
		}
	]
}
```

### GET /api/logs/

Returns all logged events ordered by latest first.

## Realtime Events

- Socket.IO event: alert
- Native websocket path (Channels): /ws/alerts/

## Backend Setup

From the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Admin panel: http://127.0.0.1:8000/admin/

## Frontend Setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: http://127.0.0.1:5173

## Optional Frontend Environment Variables

Create frontend/.env if needed:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_SOCKET_URL=http://127.0.0.1:8000
```

## Privacy Notes

- Webcam permission is requested before monitoring starts.
- The backend processes frames in memory only.
- No webcam images or video files are saved.
- Only metadata is stored: user_id, event, risk_score, timestamp.

## Hackathon Demo Flow

1. Start backend and frontend.
2. Open the dashboard and click Start Monitoring.
3. Trigger suspicious scenarios:
	 - Move out of frame
	 - Introduce another face
	 - Move abruptly
4. Observe realtime alerts, risk meter changes, and timeline logs.
5. Open Django admin to verify stored metadata events.
