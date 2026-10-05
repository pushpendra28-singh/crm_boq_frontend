import API_BASE_URL from "../../config/api";

export async function holidayRequest(path, { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("adminToken");
  if (!token) throw Object.assign(new Error("Your session has expired. Please log in again."), { status: 401 });
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, 20000);
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      method, signal: controller.signal, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null);
    // Bulk creation deliberately returns success:false with HTTP 207.
    if (response.status === 207 && data?.partial === true && Array.isArray(data.results)) return data;
    if (!response.ok || data?.success !== true) {
      const error = new Error(data?.message || "Unexpected server response. Refresh before retrying.");
      error.status = response.status;
      error.details = data;
      error.uncertain = method !== "GET" && (response.status >= 500 || response.ok);
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && signal?.aborted) throw error;
    if (error.name === "AbortError" || error instanceof TypeError) {
      throw Object.assign(new Error(method === "GET"
        ? "Unable to load data. Check your connection and try again."
        : "The response could not be confirmed. Close this form and refresh before trying again."), { uncertain: method !== "GET" });
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
