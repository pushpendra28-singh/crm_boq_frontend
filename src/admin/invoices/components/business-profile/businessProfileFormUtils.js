/* ─────────────────────────────────────────────
   Empty Business Profile Form
───────────────────────────────────────────── */

export const createEmptyBusinessProfileForm =
  () => ({
    businessName: "",
    businessType: "",

    logoUrl: "",

    authorizedSignatory: "",

    email: "",
    phone: "",
    website: "",

    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },

    gstRegistered: false,
    gstin: "",

    bank: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    },
  });


/* ─────────────────────────────────────────────
   Safe string helper
───────────────────────────────────────────── */

const safeString = (value) => {
  return typeof value === "string"
    ? value
    : "";
};


/* ─────────────────────────────────────────────
   Convert API profile into form state
───────────────────────────────────────────── */

/*
 * GET /business-profile/me response:
 *
 * {
 *   profileExists,
 *   isComplete,
 *   missingFields,
 *   formData
 * }
 *
 * formData ko directly React state me nahi daalenge.
 * Is utility se shape guarantee karenge.
 */
export const normalizeBusinessProfileForm =
  (data) => {
    const source =
      data && typeof data === "object"
        ? data
        : {};

    const address =
      source.address &&
      typeof source.address === "object"
        ? source.address
        : {};

    const bank =
      source.bank &&
      typeof source.bank === "object"
        ? source.bank
        : {};

    return {
      businessName:
        safeString(
          source.businessName
        ),

      businessType:
        safeString(
          source.businessType
        ),

      logoUrl:
        safeString(
          source.logoUrl
        ),

      authorizedSignatory:
        safeString(
          source.authorizedSignatory
        ),

      email:
        safeString(
          source.email
        ),

      phone:
        safeString(
          source.phone
        ),

      website:
        safeString(
          source.website
        ),

      address: {
        line1:
          safeString(
            address.line1
          ),

        line2:
          safeString(
            address.line2
          ),

        city:
          safeString(
            address.city
          ),

        state:
          safeString(
            address.state
          ),

        postalCode:
          safeString(
            address.postalCode
          ),

        country:
          safeString(
            address.country
          ) || "India",
      },

      gstRegistered:
        source.gstRegistered ===
        true,

      gstin:
        safeString(
          source.gstin
        ),

      bank: {
        accountName:
          safeString(
            bank.accountName
          ),

        bankName:
          safeString(
            bank.bankName
          ),

        accountNumber:
          safeString(
            bank.accountNumber
          ),

        ifsc:
          safeString(
            bank.ifsc
          ),
      },
    };
  };


/* ─────────────────────────────────────────────
   Update top-level form field
───────────────────────────────────────────── */

export const updateBusinessProfileField =
  (
    previous,
    field,
    value
  ) => ({
    ...previous,
    [field]: value,
  });


/* ─────────────────────────────────────────────
   Update address field
───────────────────────────────────────────── */

export const updateBusinessAddressField =
  (
    previous,
    field,
    value
  ) => ({
    ...previous,

    address: {
      ...previous.address,
      [field]: value,
    },
  });


/* ─────────────────────────────────────────────
   Update bank field
───────────────────────────────────────────── */

export const updateBusinessBankField =
  (
    previous,
    field,
    value
  ) => ({
    ...previous,

    bank: {
      ...previous.bank,
      [field]: value,
    },
  });


/* ─────────────────────────────────────────────
   Backend field → readable label
───────────────────────────────────────────── */

const BUSINESS_PROFILE_FIELD_LABELS = {
  businessName:
    "Business Name",

  businessType:
    "Business Type",

  logoUrl:
    "Business Logo",

  authorizedSignatory:
    "Authorized Signatory",

  email:
    "Business Email",

  phone:
    "Phone Number",

  website:
    "Website",

  "address.line1":
    "Address Line 1",

  "address.line2":
    "Address Line 2",

  "address.city":
    "City",

  "address.state":
    "State",

  "address.postalCode":
    "PIN Code",

  "address.country":
    "Country",

  gstRegistered:
    "GST Registration Status",

  gstin:
    "GSTIN",

  "bank.accountName":
    "Account Holder Name",

  "bank.bankName":
    "Bank Name",

  "bank.accountNumber":
    "Account Number",

  "bank.ifsc":
    "IFSC Code",
};


export const getBusinessProfileFieldLabel =
  (field) => {
    return (
      BUSINESS_PROFILE_FIELD_LABELS[
        field
      ] || field
    );
  };


/* ─────────────────────────────────────────────
   Convert missingFields into UI-friendly list
───────────────────────────────────────────── */

export const getMissingBusinessProfileLabels =
  (missingFields = []) => {
    if (
      !Array.isArray(
        missingFields
      )
    ) {
      return [];
    }

    return missingFields.map(
      getBusinessProfileFieldLabel
    );
  };


/* ─────────────────────────────────────────────
   Check whether backend marked field missing
───────────────────────────────────────────── */

export const isBusinessProfileFieldMissing =
  (
    missingFields,
    field
  ) => {
    return (
      Array.isArray(
        missingFields
      ) &&
      missingFields.includes(
        field
      )
    );
  };


/* ─────────────────────────────────────────────
   Client-side required field validation
───────────────────────────────────────────── */

/*
 * Backend remains final source of truth.
 *
 * Ye validation sirf instant UX ke liye hai,
 * taaki obvious blank fields ke liye API call
 * unnecessarily na karni pade.
 */
export const validateBusinessProfileForm =
  (form) => {
    const errors = {};

    if (
      !form.businessName
        ?.trim()
    ) {
      errors.businessName =
        "Business name is required.";
    }

    if (
      !form.authorizedSignatory
        ?.trim()
    ) {
      errors.authorizedSignatory =
        "Authorized signatory is required.";
    }

    if (
      !form.email?.trim()
    ) {
      errors.email =
        "Business email is required.";
    }

    if (
      !form.phone?.trim()
    ) {
      errors.phone =
        "Phone number is required.";
    }


    if (
      !form.address?.line1
        ?.trim()
    ) {
      errors[
        "address.line1"
      ] =
        "Address is required.";
    }

    if (
      !form.address?.city
        ?.trim()
    ) {
      errors[
        "address.city"
      ] =
        "City is required.";
    }

    if (
      !form.address?.state
        ?.trim()
    ) {
      errors[
        "address.state"
      ] =
        "State is required.";
    }

    if (
      !form.address
        ?.postalCode
        ?.trim()
    ) {
      errors[
        "address.postalCode"
      ] =
        "PIN code is required.";
    }

    if (
      !form.address
        ?.country
        ?.trim()
    ) {
      errors[
        "address.country"
      ] =
        "Country is required.";
    }


    if (
      form.gstRegistered ===
        true &&
      !form.gstin?.trim()
    ) {
      errors.gstin =
        "GSTIN is required for GST registered businesses.";
    }


    if (
      !form.bank
        ?.accountName
        ?.trim()
    ) {
      errors[
        "bank.accountName"
      ] =
        "Account holder name is required.";
    }

    if (
      !form.bank
        ?.bankName
        ?.trim()
    ) {
      errors[
        "bank.bankName"
      ] =
        "Bank name is required.";
    }

    if (
      !form.bank
        ?.accountNumber
        ?.trim()
    ) {
      errors[
        "bank.accountNumber"
      ] =
        "Account number is required.";
    }

    if (
      !form.bank
        ?.ifsc
        ?.trim()
    ) {
      errors[
        "bank.ifsc"
      ] =
        "IFSC code is required.";
    }


    return {
      isValid:
        Object.keys(
          errors
        ).length === 0,

      errors,
    };
  };