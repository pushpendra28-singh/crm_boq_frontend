import API_BASE_URL from "../../config/api";

export async function attendanceRequest(path, { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("adminToken");
  if (!token) throw Object.assign(new Error("Your session has expired. Please log in again."), { status: 401 });
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, 20000);
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/attendance${path}`, {
      method, signal: controller.signal, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw Object.assign(new Error(data?.message || "Unable to process attendance. Please try again."), {
      status: response.status, code: data?.code, details: data?.details,
    });
    if (!data?.success || !["check_in", "check_out", "completed"].includes(data.nextAction) || !Number.isFinite(new Date(data.serverTime).getTime())) {
      throw new Error("Unexpected attendance response. Please refresh today's status.");
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted) {
      throw new Error("The request timed out. Refresh today's status to confirm whether attendance was saved.");
    }
    if (error instanceof TypeError) throw new Error("Unable to reach the server. Check your connection and refresh today's status.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export function getCurrentLocation() {
  if (!window.isSecureContext) return Promise.reject(new Error("Location requires HTTPS. Open the secure website and try again."));
  if (!navigator.geolocation) return Promise.reject(new Error("Your browser does not support location. Please use a supported browser."));
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
    ({ code }) => reject(new Error({
      1: "Location access was denied. Allow location for this website in browser settings, then try again.",
      2: "Your location is unavailable. Turn on device location and try near a window or outside.",
      3: "Location took too long. Move near a window or outside and try again.",
    }[code] || "Unable to get your location. Please try again.")),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  ));
}

export function locationFeedback(location, office) {
  const rad = (n) => n * Math.PI / 180;
  const a = Math.sin(rad(location.latitude - office.latitude) / 2) ** 2 +
    Math.cos(rad(office.latitude)) * Math.cos(rad(location.latitude)) * Math.sin(rad(location.longitude - office.longitude) / 2) ** 2;
  const distance = 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
  return {
    ...location, distance, checkedAt: Date.now(),
    quality: location.accuracy > 0 && location.accuracy <= office.maxAccuracyMeters,
    inside: distance <= office.radiusMeters
  };
}

