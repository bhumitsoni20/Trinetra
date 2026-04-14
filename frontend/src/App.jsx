import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AlertsPanel from "./components/AlertsPanel";
import HeaderBar from "./components/HeaderBar";
import LogsTimeline from "./components/LogsTimeline";
import WebcamPanel from "./components/WebcamPanel";
import useProctoringSocket from "./hooks/useProctoringSocket";
import { fetchLogs, postDetectionFrame } from "./services/api";

const MAX_ALERTS = 12;
const MAX_LOGS = 80;
const DETECTION_INTERVAL_MS = 1800;
const DEFAULT_USER_ID = "candidate-001";

function normalizeLogEntry(entry) {
	return {
		id:
			entry.id ??
			`${entry.timestamp || Date.now()}-${entry.event || "event"}-${Math.random().toString(16).slice(2, 8)}`,
		user_id: entry.user_id ?? DEFAULT_USER_ID,
		event: entry.event ?? "Unknown Event",
		risk_score: Number(entry.risk_score ?? 0),
		timestamp: entry.timestamp ?? new Date().toISOString(),
	};
}

function App() {
	const webcamRef = useRef(null);
	const detectionInFlight = useRef(false);

	const [monitoringActive, setMonitoringActive] = useState(false);
	const [permissionError, setPermissionError] = useState("");
	const [lastApiError, setLastApiError] = useState("");

	const [alerts, setAlerts] = useState([]);
	const [logs, setLogs] = useState([]);

	const [riskScore, setRiskScore] = useState(0);
	const [riskLevel, setRiskLevel] = useState("LOW");
	const [facesDetected, setFacesDetected] = useState(0);
	const [movementDistance, setMovementDistance] = useState(0);

	const handleRealtimeAlert = useCallback((payload) => {
		const normalized = normalizeLogEntry(payload);
		setAlerts((prev) => [normalized, ...prev].slice(0, MAX_ALERTS));
		setLogs((prev) => [normalized, ...prev].slice(0, MAX_LOGS));
	}, []);

	const { connected: socketConnected } = useProctoringSocket(handleRealtimeAlert);

	useEffect(() => {
		let active = true;

		const loadLogs = async () => {
			try {
				const data = await fetchLogs();
				if (!active) {
					return;
				}
				setLogs(data.map(normalizeLogEntry));
			} catch (error) {
				if (active) {
					setLastApiError(error.message || "Unable to fetch logs");
				}
			}
		};

		loadLogs();
		return () => {
			active = false;
		};
	}, []);

	const startMonitoring = useCallback(async () => {
		setPermissionError("");

		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setPermissionError("This browser does not support webcam access.");
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			stream.getTracks().forEach((track) => track.stop());
			setMonitoringActive(true);
		} catch (error) {
			setPermissionError("Camera permission is required to begin monitoring.");
		}
	}, []);

	const stopMonitoring = useCallback(() => {
		setMonitoringActive(false);
	}, []);

	useEffect(() => {
		if (!monitoringActive) {
			return undefined;
		}

		const intervalId = window.setInterval(async () => {
			if (detectionInFlight.current) {
				return;
			}

			const screenshot = webcamRef.current?.getScreenshot();
			if (!screenshot) {
				return;
			}

			detectionInFlight.current = true;
			try {
				const result = await postDetectionFrame({
					image: screenshot,
					user_id: DEFAULT_USER_ID,
				});

				setRiskScore(Number(result.risk_score ?? 0));
				setRiskLevel(String(result.risk_level ?? "LOW"));
				setFacesDetected(Number(result.faces_detected ?? 0));
				setMovementDistance(Number(result.movement_distance ?? 0));
				setLastApiError("");

				if (!socketConnected && Array.isArray(result.logged_events) && result.logged_events.length > 0) {
					const fallbackEvents = result.logged_events.map(normalizeLogEntry).reverse();
					setAlerts((prev) => [...fallbackEvents, ...prev].slice(0, MAX_ALERTS));
					setLogs((prev) => [...fallbackEvents, ...prev].slice(0, MAX_LOGS));
				}
			} catch (error) {
				setLastApiError(error.message || "Unable to process frame");
			} finally {
				detectionInFlight.current = false;
			}
		}, DETECTION_INTERVAL_MS);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [monitoringActive, socketConnected]);

	const statusTone = useMemo(() => {
		if (!monitoringActive) {
			return "paused";
		}
		if (riskLevel === "HIGH") {
			return "high";
		}
		if (riskLevel === "MEDIUM") {
			return "medium";
		}
		return "safe";
	}, [monitoringActive, riskLevel]);

	const statusMessage = useMemo(() => {
		if (permissionError) {
			return permissionError;
		}
		if (lastApiError) {
			return lastApiError;
		}
		return "Privacy-first mode: no videos or images are stored, only event metadata logs.";
	}, [lastApiError, permissionError]);

	return (
		<div className="relative min-h-screen overflow-x-hidden px-4 py-5 sm:px-6 lg:px-10">
			<div className="ambient-grid" />

			<div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
				<HeaderBar
					monitoringActive={monitoringActive}
					socketConnected={socketConnected}
					riskScore={riskScore}
					riskLevel={riskLevel}
					statusTone={statusTone}
					statusMessage={statusMessage}
				/>

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
					<WebcamPanel
						webcamRef={webcamRef}
						monitoringActive={monitoringActive}
						onStartMonitoring={startMonitoring}
						onStopMonitoring={stopMonitoring}
						facesDetected={facesDetected}
						movementDistance={movementDistance}
						permissionError={permissionError}
					/>
					<AlertsPanel alerts={alerts} />
				</section>

				<LogsTimeline logs={logs} />
			</div>
		</div>
	);
}

export default App;
