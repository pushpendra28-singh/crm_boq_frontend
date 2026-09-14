import API_BASE_URL from "../../../config/api";


/* ─────────────────────────────────────────────
   Business Profile API Error
───────────────────────────────────────────── */

export class BusinessProfileApiError extends Error {
  constructor(
    message,
    {
      status = 0,
      code = "",
      errors = {},
      missingFields = [],
    } = {}
  ) {
    super(message);

    this.name =
      "BusinessProfileApiError";

    this.status = status;

    this.code = code;

    this.errors = errors;

    this.missingFields =
      missingFields;
  }
}


/* ─────────────────────────────────────────────
   Auth
───────────────────────────────────────────── */

const getAuthToken = () => {
  const token =
    localStorage.getItem(
      "adminToken"
    );

  if (!token) {
    throw new BusinessProfileApiError(
      "Your session has expired. Please login again.",
      {
        status: 401,
        code:
          "AUTHENTICATION_REQUIRED",
      }
    );
  }

  return token;
};


/* ─────────────────────────────────────────────
   Safe response parser
───────────────────────────────────────────── */

const parseResponse = async (
  response
) => {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message:
        "Server returned an invalid response.",
    };
  }
};


/* ─────────────────────────────────────────────
   Common API response handler
───────────────────────────────────────────── */

const handleResponse = async (
  response
) => {
  const data =
    await parseResponse(
      response
    );

  if (!response.ok) {
    throw new BusinessProfileApiError(
      data.message ||
        "Unable to process business profile request.",
      {
        status:
          response.status,

        code:
          data.code || "",

        errors:
          data.errors || {},

        missingFields:
          Array.isArray(
            data.missingFields
          )
            ? data.missingFields
            : [],
      }
    );
  }

  return data;
};


/* ─────────────────────────────────────────────
   GET My Business Profile
───────────────────────────────────────────── */

/*
 * Returns:
 *
 * {
 *   profileExists,
 *   isComplete,
 *   missingFields,
 *   formData
 * }
 */
export const getBusinessProfile =
  async () => {
    const token =
      getAuthToken();

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/business-profile/me`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      return await handleResponse(
        response
      );
    } catch (error) {
      if (
        error instanceof
        BusinessProfileApiError
      ) {
        throw error;
      }

      throw new BusinessProfileApiError(
        "Unable to connect to the server. Please try again.",
        {
          code:
            "NETWORK_ERROR",
        }
      );
    }
  };


/* ─────────────────────────────────────────────
   Prepare Profile Payload
───────────────────────────────────────────── */

/*
 * Frontend state ko directly request me spread
 * nahi karenge.
 *
 * Sirf allowed business fields send honge.
 *
 * logoUrl intentionally send nahi hota.
 * Logo dedicated upload endpoint handle karta hai.
 */
const buildBusinessProfilePayload =
  (formData = {}) => {
    return {
      businessName:
        formData.businessName ||
        "",

      businessType:
        formData.businessType ||
        "",

      authorizedSignatory:
        formData
          .authorizedSignatory ||
        "",

      email:
        formData.email ||
        "",

      phone:
        formData.phone ||
        "",

      website:
        formData.website ||
        "",

      address: {
        line1:
          formData.address
            ?.line1 || "",

        line2:
          formData.address
            ?.line2 || "",

        city:
          formData.address
            ?.city || "",

        state:
          formData.address
            ?.state || "",

        postalCode:
          formData.address
            ?.postalCode || "",

        country:
          formData.address
            ?.country ||
          "India",
      },

      gstRegistered:
        formData
          .gstRegistered ===
        true,

      gstin:
        formData.gstin ||
        "",

      bank: {
        accountName:
          formData.bank
            ?.accountName || "",

        bankName:
          formData.bank
            ?.bankName || "",

        accountNumber:
          formData.bank
            ?.accountNumber || "",

        ifsc:
          formData.bank
            ?.ifsc || "",
      },
    };
  };


/* ─────────────────────────────────────────────
   SAVE / UPDATE Business Profile
───────────────────────────────────────────── */

/*
 * PUT /api/business-profile/me
 *
 * Same function:
 *
 * profile missing
 * → create
 *
 * profile exists
 * → update
 */
export const saveBusinessProfile =
  async (formData) => {
    const token =
      getAuthToken();

    const payload =
      buildBusinessProfilePayload(
        formData
      );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/business-profile/me`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      return await handleResponse(
        response
      );
    } catch (error) {
      if (
        error instanceof
        BusinessProfileApiError
      ) {
        throw error;
      }

      throw new BusinessProfileApiError(
        "Unable to connect to the server. Please try again.",
        {
          code:
            "NETWORK_ERROR",
        }
      );
    }
  };


/* ─────────────────────────────────────────────
   Upload Business Logo
───────────────────────────────────────────── */

/*
 * PUT /api/business-profile/me/logo
 *
 * Content-Type manually set nahi karna.
 *
 * Browser automatically proper multipart boundary
 * generate karega.
 */
export const uploadBusinessLogo =
  async (file) => {
    if (!(file instanceof File)) {
      throw new BusinessProfileApiError(
        "Please select a business logo.",
        {
          code:
            "BUSINESS_LOGO_REQUIRED",
        }
      );
    }


    const token =
      getAuthToken();

    const formData =
      new FormData();

    /*
     * Backend multer:
     *
     * .single("logo")
     *
     * Isliye field name exactly "logo".
     */
    formData.append(
      "logo",
      file
    );


    try {
      const response =
        await fetch(
          `${API_BASE_URL}/business-profile/me/logo`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              formData,
          }
        );


      return await handleResponse(
        response
      );
    } catch (error) {
      if (
        error instanceof
        BusinessProfileApiError
      ) {
        throw error;
      }


      throw new BusinessProfileApiError(
        "Unable to upload business logo. Please try again.",
        {
          code:
            "NETWORK_ERROR",
        }
      );
    }
  };


/* ─────────────────────────────────────────────
   Logo URL Resolver
───────────────────────────────────────────── */

/*
 * Backend logo example:
 *
 * /api/business-profile/logo/abc.png
 *
 * Vite frontend aur backend different ports par
 * chal sakte hain.
 *
 * Isliye relative backend path ko proper backend
 * origin me convert karna zaroori hai.
 */
export const resolveBusinessLogoUrl =
  (logoUrl) => {
    if (!logoUrl) {
      return "";
    }


    if (
      /^https?:\/\//i.test(
        logoUrl
      )
    ) {
      return logoUrl;
    }


    try {
      /*
       * Example:
       *
       * API_BASE_URL =
       * http://localhost:5000/api
       *
       * origin =
       * http://localhost:5000
       *
       * logoUrl =
       * /api/business-profile/logo/...
       */
      const apiUrl =
        new URL(
          API_BASE_URL,
          window.location.origin
        );

      const backendOrigin =
        apiUrl.origin;


      return new URL(
        logoUrl,
        backendOrigin
      ).toString();
    } catch {
      return logoUrl;
    }
  };