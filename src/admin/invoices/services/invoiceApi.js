import API_BASE_URL from "../../../config/api";

/* ─────────────────────────────────────────────
   Fetch invoice list
───────────────────────────────────────────── */

export const fetchInvoices = async ({
  page = 1,
  limit = 10,
  signal,
} = {}) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    const error = new Error(
      "Authentication token not found. Please login again."
    );

    error.status = 401;

    throw error;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/invoices?page=${page}&limit=${limit}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        signal,
      }
    );
  } catch (error) {
    /*
      AbortController ne request intentionally cancel ki
      ho to original error hi forward karenge.
    */
    if (error.name === "AbortError") {
      throw error;
    }

    console.error("Invoice API network error:", error);

    throw new Error(
      "Unable to connect to the server. Please check your connection."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  /*
    fetch HTTP 400/401/500 response ko automatically
    JS exception me convert nahi karta, isliye
    response.ok manually check karna important hai.
  */
  if (!response.ok) {
    const error = new Error(
      data?.message || "Unable to fetch invoices."
    );

    error.status = response.status;

    throw error;
  }

  return data;
};

/* ─────────────────────────────────────────────
   Fetch single invoice by ID
───────────────────────────────────────────── */

export const fetchInvoiceById = async ({
  invoiceId,
  signal,
}) => {
  if (!invoiceId) {
    throw new Error("Invoice ID is required.");
  }

  const token = localStorage.getItem("adminToken");

  if (!token) {
    const error = new Error(
      "Authentication token not found. Please login again."
    );

    error.status = 401;

    throw error;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/invoices/${encodeURIComponent(
        invoiceId
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        signal,
      }
    );
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.error(
      "Single invoice API network error:",
      error
    );

    throw new Error(
      "Unable to connect to the server. Please check your connection."
    );
  }

  let data = null;

try {
  data = await response.json();
} catch (error) {
  /*
    Request intentionally abort hui hai
    to AbortError ko suppress mat karo.
    Caller ko same AbortError milna chahiye.
  */

  if (error?.name === "AbortError") {
    throw error;
  }

  throw new Error(
    "Invalid response received from server."
  );
}

  if (!response.ok) {
    const error = new Error(
      data?.message || "Unable to fetch invoice."
    );

    error.status = response.status;

    throw error;
  }

  return data;
};


/* ─────────────────────────────────────────────
   Update invoice
───────────────────────────────────────────── */

export const updateInvoice = async ({
  invoiceId,
  payload,
}) => {
  if (!invoiceId) {
    throw new Error(
      "Invoice ID is required."
    );
  }

  const token =
    localStorage.getItem(
      "adminToken"
    );

  if (!token) {
    const error = new Error(
      "Authentication token not found. Please login again."
    );

    error.status = 401;

    throw error;
  }


  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/invoices/${encodeURIComponent(
        invoiceId
      )}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body:
          JSON.stringify(payload),
      }
    );
  } catch (error) {
    console.error(
      "Update invoice API network error:",
      error
    );

    throw new Error(
      "Unable to connect to the server. Please check your connection."
    );
  }


  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    const error = new Error(
      data?.message ||
        "Unable to update invoice."
    );

    error.status =
      response.status;

    throw error;
  }


  return data;
};



/* ─────────────────────────────────────────────
   Delete invoice
───────────────────────────────────────────── */

export const deleteInvoice = async ({
  invoiceId,
}) => {
  if (!invoiceId) {
    throw new Error(
      "Invoice ID is required."
    );
  }


  const token =
    localStorage.getItem(
      "adminToken"
    );


  if (!token) {
    throw new Error(
      "Your session has expired. Please login again."
    );
  }


  const response = await fetch(
    `${API_BASE_URL}/invoices/${encodeURIComponent(
      invoiceId
    )}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );


  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to delete invoice."
    );
  }


  return data;
};


/* ─────────────────────────────────────────────
   Send invoice email
───────────────────────────────────────────── */

export const sendInvoiceEmail =
  async ({
    invoiceId,
    recipientEmail,
    subject,
    message,
  }) => {

    if (!invoiceId) {
      throw new Error(
        "Invoice ID is required."
      );
    }


    const token =
      localStorage.getItem(
        "adminToken"
      );


    if (!token) {
      throw new Error(
        "Your session has expired. Please login again."
      );
    }


    const response =
      await fetch(
        `${API_BASE_URL}/invoices/${encodeURIComponent(
          invoiceId
        )}/send`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              recipientEmail,
              subject,
              message,
            }),
        }
      );


    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to send invoice."
      );
    }


    return data;
  };