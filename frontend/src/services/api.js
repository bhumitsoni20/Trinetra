const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail || data.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function postDetectionFrame(payload) {
  const response = await fetch(`${API_BASE_URL}/api/detect/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
}

export async function fetchLogs() {
  const response = await fetch(`${API_BASE_URL}/api/logs/`);
  const data = await parseJsonResponse(response);
  return Array.isArray(data) ? data : [];
}
