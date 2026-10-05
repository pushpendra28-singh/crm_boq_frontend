import API_BASE_URL from "../../config/api";

async function request(path, { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    throw Object.assign(new Error("Your session has expired. Please log in again."), { status: 401 });
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, 20000);

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/wfh-settings${path}`, {
      method,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw Object.assign(new Error(data?.message || "Unable to process WFH settings."), {
        status: response.status,
      });
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted) {
      throw new Error("The request timed out. Please refresh and try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to connect to the server. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export function getWfhSettings(options) {
  return request("/", options);
}

export function updateWfhSetting(employeeId, payload, options) {
  return request(`/${encodeURIComponent(employeeId)}`, {
    ...options,
    method: "PUT",
    body: payload,
  });
}
