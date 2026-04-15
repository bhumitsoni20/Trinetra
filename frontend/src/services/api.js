const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail || data.message || JSON.stringify(data) || "Request failed";
    throw new Error(message);
  }
  return data;
}

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("trinetra_user") || "null");
  const headers = { "Content-Type": "application/json" };
  if (user?.id) {
    headers["Authorization"] = `User ${user.id}`;
  }
  return headers;
}

// ---- Auth ----
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonResponse(response);
}

export async function submitAuthToken(endpoint, idToken) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  return parseJsonResponse(response);
}

export async function sendOTP(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseJsonResponse(response);
}

export async function verifyOTP(email, otp) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return parseJsonResponse(response);
}

export async function resetPasswordAPI(email, otp, newPassword) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, password: newPassword }),
  });
  return parseJsonResponse(response);
}

export async function registerUser(data) {
  const response = await fetch(`${API_BASE_URL}/api/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(response);
}

// ---- Exam ----
export async function createExam(payload) {
  const response = await fetch(`${API_BASE_URL}/api/exams/create/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}

export async function startExam(userId) {
  const response = await fetch(`${API_BASE_URL}/api/start-exam/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  return parseJsonResponse(response);
}

export async function submitExam(sessionId, answers) {
  const response = await fetch(`${API_BASE_URL}/api/submit-exam/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ session_id: sessionId, answers }),
  });
  return parseJsonResponse(response);
}

export async function reportTabSwitch(sessionId, userId) {
  const response = await fetch(`${API_BASE_URL}/api/tab-switch/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ session_id: sessionId, user_id: userId }),
  });
  return parseJsonResponse(response);
}

// ---- Detection ----
export async function postDetectionFrame(payload) {
  const response = await fetch(`${API_BASE_URL}/api/detect/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}

// ---- Logs ----
export async function fetchLogs() {
  const response = await fetch(`${API_BASE_URL}/api/logs/`, { headers: authHeaders() });
  const data = await parseJsonResponse(response);
  return Array.isArray(data) ? data : [];
}

// ---- Users ----
export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/api/users/`, { headers: authHeaders() });
  const data = await parseJsonResponse(response);
  return Array.isArray(data) ? data : [];
}

export async function updateUser(userId, data) {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseJsonResponse(response);
}

export async function deleteUser(userId) {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
  return true;
}

// ---- Sessions ----
export async function fetchSessions() {
  const response = await fetch(`${API_BASE_URL}/api/sessions/`, { headers: authHeaders() });
  const data = await parseJsonResponse(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchSessionDetail(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/`, { headers: authHeaders() });
  return parseJsonResponse(response);
}

// ---- Metrics ----
export async function fetchAdoptionStats() {
  const response = await fetch(`${API_BASE_URL}/api/metrics/adoption/`);
  return parseJsonResponse(response);
}
