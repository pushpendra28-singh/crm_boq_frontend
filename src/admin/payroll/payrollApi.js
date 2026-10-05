import API_BASE_URL from "../../config/api";

async function request(path, { method = "GET", body, signal, timeout = 30000 } = {}) {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      method,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      const error = new Error(data?.message || "Unable to complete the payroll request.");
      error.status = response.status;
      error.details = data?.details;
      throw error;
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

async function requestBlob(
  path,
  { signal, timeout = 30000 } = {}
) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    const error = new Error(
      "Your session has expired. Please log in again."
    );
    error.status = 401;
    throw error;
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();

  signal?.addEventListener("abort", cancel, {
    once: true,
  });

  if (signal?.aborted) controller.abort();

  const timer = setTimeout(
    () => controller.abort(),
    timeout
  );

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}${path}`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => null);

      const error = new Error(
        data?.message ||
          "Unable to generate the salary slip."
      );

      error.status = response.status;
      error.details = data?.details;

      throw error;
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error(
        "Salary slip PDF is empty."
      );
    }

    return blob;
  } catch (error) {
    if (error.name === "AbortError") {
      if (signal?.aborted) throw error;
      throw new Error(
        "The salary slip request timed out. Please try again."
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect. Check your connection and try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener(
      "abort",
      cancel
    );
  }
}

export function getPayrollEmployees(search = "", options) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request(`/payroll/employees${query}`, options);
}

export function getSalaryStructures(employeeId, options) {
  return request(`/payroll/salaries/${encodeURIComponent(employeeId)}`, options);
}

export function createSalaryStructure(payload, options) {
  return request("/payroll/salaries", { ...options, method: "POST", body: payload });
}

export function updateSalaryStructure(id, payload, options) {
  return request(`/payroll/salaries/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: payload,
  });
}

export function getPayrollRuns(month = "", options) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return request(`/payroll/runs${query}`, options);
}

export function generatePayroll(month, options) {
  return request("/payroll/runs", {
    ...options,
    method: "POST",
    body: { month },
  });
}

export function getPayrollRun(runId, options) {
  return request(`/payroll/runs/${encodeURIComponent(runId)}`, options);
}

export function recalculatePayroll(runId, options) {
  return request(`/payroll/runs/${encodeURIComponent(runId)}/recalculate`, {
    ...options,
    method: "POST",
  });
}

export function movePayrollToReview(runId, options) {
  return request(`/payroll/runs/${encodeURIComponent(runId)}/review`, {
    ...options,
    method: "POST",
  });
}

export function finalizePayroll(runId, options) {
  return request(`/payroll/runs/${encodeURIComponent(runId)}/finalize`, {
    ...options,
    method: "POST",
  });
}

export function updatePayrollRecordPayment(runId, recordId, payload, options) {
  return request(
    `/payroll/runs/${encodeURIComponent(runId)}/records/${encodeURIComponent(recordId)}/payment`,
    {
      ...options,
      method: "POST",
      body: payload,
    }
  );
}

export function markPayrollPaid(runId, options) {
  return request(`/payroll/runs/${encodeURIComponent(runId)}/paid`, {
    ...options,
    method: "POST",
  });
}

export function downloadSalarySlip(
  runId,
  recordId,
  options
) {
  return requestBlob(
    `/payroll/runs/${encodeURIComponent(
      runId
    )}/records/${encodeURIComponent(
      recordId
    )}/salary-slip`,
    options
  );
}
