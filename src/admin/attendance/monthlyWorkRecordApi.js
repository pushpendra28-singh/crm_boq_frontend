import API_BASE_URL from "../../config/api";

async function request(path, { signal, timeout = 20000 } = {}) {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Your session has expired. Please log in again.");

  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });

  if (signal?.aborted) controller.abort();

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Unable to load monthly work records.");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      if (signal?.aborted) throw error;
      throw new Error("The request timed out. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to connect. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export function getMonthlyWorkRecords(params, options) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return request(`/monthly-work-records?${query.toString()}`, options);
}

export function getMonthlyWorkRecord(employeeId, month, options) {
  return request(
    `/monthly-work-records/${encodeURIComponent(employeeId)}?month=${encodeURIComponent(month)}`,
    options
  );
}
