import API_BASE_URL from "../../../config/api";


/*
  Logged-in user ka auth token.
*/
const getToken = () => {
  return localStorage.getItem("adminToken");
};


/*
  =================================================
  GET LOGGED-IN USER CUSTOMERS
  =================================================

  Backend:
  GET /api/customers

  Backend ownerId ke according customers filter karega.
*/
export const getCustomers = async () => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/customers`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to fetch customers."
    );
  }

  return data.customers || [];
};


/*
  =================================================
  CREATE CUSTOMER
  =================================================

  Backend:
  POST /api/customers

  ownerId frontend se nahi bhej rahe.
  Backend req.ownerId automatically use karega.
*/
export const createCustomer = async (
  customerData
) => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  const payload = {
    companyName:
      customerData.companyName || "",

    contactPerson:
      customerData.contactPerson || "",

    email:
      customerData.email || "",

    phone:
      customerData.phone || "",

    address:
      customerData.address || "",

    gstin:
      customerData.gstin || "",
  };


  const response = await fetch(
    `${API_BASE_URL}/customers`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to create customer."
    );
  }

  return data.customer;
};


/*
  =================================================
  UPDATE CUSTOMER
  =================================================

  Backend:
  PUT /api/customers/:id

  ownerId frontend se nahi bhej rahe.
  Backend req.ownerId ke through verify karega
  ki customer logged-in user ka hi hai.
*/
export const updateCustomer = async (
  customerId,
  customerData
) => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please login again."
    );
  }


  if (!customerId) {
    throw new Error(
      "Customer ID is required."
    );
  }


  const payload = {
    companyName:
      customerData.companyName || "",

    contactPerson:
      customerData.contactPerson || "",

    email:
      customerData.email || "",

    phone:
      customerData.phone || "",

    address:
      customerData.address || "",

    gstin:
      customerData.gstin || "",
  };


  const response = await fetch(
    `${API_BASE_URL}/customers/${customerId}`,
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


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to update customer."
    );
  }


  return data.customer;
};