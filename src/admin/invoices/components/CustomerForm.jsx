import React, {
  useEffect,
  useState,
} from "react";

import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ReceiptText,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  createCustomer,
  updateCustomer,
} from "../services/customerApi";


/* =================================================
   INITIAL FORM STATE
================================================= */

const INITIAL_FORM = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  gstin: "",
};


/* =================================================
   VALIDATION REGEX
================================================= */

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;


/* =================================================
   CUSTOMER FORM
================================================= */

const CustomerForm = ({
  open,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  customer = null,
}) => {

    const isEditMode =
  Boolean(customer?.id);

  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  /* =================================================
     RESET WHEN MODAL OPENS
  ================================================= */

  useEffect(() => {
  if (!open) {
    return;
  }

  if (customer?.id) {
    /*
      Edit mode:
      existing DB customer values
      form me prefill kar rahe hain.
    */

    setFormData({
      companyName:
        customer.companyName || "",

      contactPerson:
        customer.contactPerson || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      address:
        customer.address || "",

      gstin:
        customer.gstin || "",
    });
  } else {
    /*
      Add mode:
      blank form.
    */

    setFormData(
      INITIAL_FORM
    );
  }

  setErrors({});
  setIsSubmitting(false);
}, [open, customer]);


  /* =================================================
     INPUT CHANGE
  ================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    let nextValue = value;

    /*
      GSTIN standard uppercase me store/display
      karenge.
    */
    if (name === "gstin") {
      nextValue =
        value.toUpperCase();
    }

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }));


    /*
      User input correct karna start kare to
      us field ka previous error hata do.
    */
    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };


  /* =================================================
     VALIDATION
  ================================================= */

  const validateForm = () => {
    const newErrors = {};


    /* Company Name */

    if (!formData.companyName.trim()) {
      newErrors.companyName =
        "Company name is required.";
    }


    /* Contact Person */

    if (
      formData.contactPerson.trim()
        .length > 120
    ) {
      newErrors.contactPerson =
        "Contact person cannot exceed 120 characters.";
    }


    /* Email */

    const email =
      formData.email.trim();

    if (
      email &&
      !EMAIL_REGEX.test(email)
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }


    /* Phone */

    const phone =
      formData.phone.trim();

    if (phone) {
      const digits =
        phone.replace(/\D/g, "");

      if (
        digits.length < 7 ||
        digits.length > 15
      ) {
        newErrors.phone =
          "Phone number must contain 7 to 15 digits.";
      }
    }


    /* Address */

    if (
      formData.address.trim()
        .length > 500
    ) {
      newErrors.address =
        "Address cannot exceed 500 characters.";
    }


    /* GSTIN */

    const gstin =
      formData.gstin
        .trim()
        .toUpperCase();

    if (
      gstin &&
      !GSTIN_REGEX.test(gstin)
    ) {
      newErrors.gstin =
        "Please enter a valid GSTIN.";
    }


    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };


  /* =================================================
     SUBMIT CUSTOMER
  ================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();


    if (isSubmitting) {
      return;
    }


    const isValid =validateForm();

    if (!isValid) {
      return;
    }


    try {
      setIsSubmitting(true);


      /*
        ownerId intentionally nahi bhej rahe.

        Backend logged-in user ke token se
        ownership set karega.
      */

      const payload = {
        companyName:
          formData.companyName.trim(),

        contactPerson:
          formData.contactPerson.trim(),

        email:
          formData.email
            .trim()
            .toLowerCase(),

        phone:
          formData.phone.trim(),

        address:
          formData.address.trim(),

        gstin:
          formData.gstin
            .trim()
            .toUpperCase(),
      };


const savedCustomer =
  isEditMode
    ? await updateCustomer(
        customer.id,
        payload
      )
    : await createCustomer(
        payload
      );


if (isEditMode) {
  toast.success(
    "Customer updated successfully"
  );

  if (
    typeof onCustomerUpdated ===
    "function"
  ) {
    onCustomerUpdated(
      savedCustomer
    );
  }
} else {
  toast.success(
    "Customer added successfully"
  );

  if (
    typeof onCustomerCreated ===
    "function"
  ) {
    onCustomerCreated(
      savedCustomer
    );
  }
}


      setFormData(
        INITIAL_FORM
      );

      setErrors({});


      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }
    } catch (error) {
      console.error(
        "Create customer error:",
        error
      );

      toast.error(
        error.message ||
          "Unable to add customer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  /* =================================================
     CLOSE MODAL
  ================================================= */

  const handleClose = () => {
    /*
      Submit ke beech modal close nahi karenge.
    */

    if (isSubmitting) {
      return;
    }

    setErrors({});

    if (
      typeof onClose ===
      "function"
    ) {
      onClose();
    }
  };


  /* =================================================
     DON'T RENDER WHEN CLOSED
  ================================================= */

  if (!open) {
    return null;
  }


  /* =================================================
     UI
  ================================================= */

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-gray-950/40
        px-4 py-6
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        /*
          Sirf backdrop click par close.

          Modal ke andar click karne par
          close nahi hoga.
        */

        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="
          flex max-h-[90vh]
          w-full max-w-2xl
          flex-col overflow-hidden
          rounded-2xl
          border border-gray-200
          bg-white
          shadow-2xl
          shadow-gray-900/10
        "
      >

        {/* =========================================
            HEADER
        ========================================= */}

        <div
          className="
            flex items-start
            justify-between gap-4
            border-b border-gray-100
            px-6 py-5
          "
        >
          <div
            className="
              flex items-start
              gap-3
            "
          >
            <div
              className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-green-50
                text-green-600
              "
            >
              <UserPlus
                size={19}
              />
            </div>


            <div>
              <h3
                className="
                  text-[17px]
                  font-bold
                  text-gray-900
                "
              >
                {isEditMode
  ? "Edit Customer"
  : "Add New Customer"}
              </h3>

              <p
                className="
                  mt-1
                  text-[12px]
                  leading-5
                  text-gray-400
                "
              >
                 {isEditMode
    ? "Update customer information used for invoices."
    : "Add customer details to use while creating invoices."}
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              flex h-9 w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>


        {/* =========================================
            FORM
        ========================================= */}

        <form
          onSubmit={handleSubmit}
          className="
            flex min-h-0
            flex-1 flex-col
          "
        >

          {/* SCROLLABLE CONTENT */}

          <div
            className="
              flex-1
              space-y-5
              overflow-y-auto
              px-6 py-5
            "
          >

            {/* ===============================
                COMPANY NAME
            =============================== */}

            <FormField
              label="Company Name"
              name="companyName"
              value={
                formData.companyName
              }
              onChange={
                handleChange
              }
              placeholder="e.g. ABC Technologies Pvt. Ltd."
              icon={Building2}
              error={
                errors.companyName
              }
              required
              autoFocus
            />


            {/* ===============================
                CONTACT PERSON
            =============================== */}

            <FormField
              label="Contact Person"
              name="contactPerson"
              value={
                formData.contactPerson
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Amit Sharma"
              icon={User}
              error={
                errors.contactPerson
              }
            />


            {/* ===============================
                EMAIL + PHONE
            =============================== */}

            <div
              className="
                grid grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                placeholder="billing@company.com"
                icon={Mail}
                error={
                  errors.email
                }
              />


              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                placeholder="+91 98765 43210"
                icon={Phone}
                error={
                  errors.phone
                }
              />
            </div>


            {/* ===============================
                ADDRESS
            =============================== */}

            <div>
              <FieldLabel
                label="Billing Address"
              />

              <div
                className="relative"
              >
                <MapPin
                  size={15}
                  className="
                    absolute
                    left-3.5 top-3.5
                    text-gray-300
                  "
                />

                <textarea
                  name="address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  maxLength={500}
                  placeholder="Enter customer's complete billing address"
                  className={`
                    w-full resize-none
                    rounded-xl border
                    bg-gray-50
                    py-3 pl-10 pr-3
                    text-[13px]
                    text-gray-700
                    outline-none
                    transition

                    placeholder:text-gray-300

                    focus:bg-white
                    focus:ring-2
                    focus:ring-green-100

                    ${
                      errors.address
                        ? "border-red-300 focus:border-red-400"
                        : "border-gray-200 focus:border-green-400"
                    }
                  `}
                />
              </div>


              <div
                className="
                  mt-1.5
                  flex items-center
                  justify-between
                  gap-3
                "
              >
                {errors.address ? (
                  <p
                    className="
                      text-[11px]
                      text-red-500
                    "
                  >
                    {errors.address}
                  </p>
                ) : (
                  <span />
                )}

                <p
                  className="
                    text-[10px]
                    text-gray-300
                  "
                >
                  {
                    formData.address
                      .length
                  }
                  /500
                </p>
              </div>
            </div>


            {/* ===============================
                GSTIN
            =============================== */}

            <FormField
              label="GSTIN"
              name="gstin"
              value={
                formData.gstin
              }
              onChange={
                handleChange
              }
              placeholder="e.g. 27ABCDE1234F1Z5"
              icon={ReceiptText}
              error={
                errors.gstin
              }
              maxLength={15}
              helperText="Optional — required only if the customer is GST registered."
            />


            {/* ===============================
                INFORMATION BOX
            =============================== */}

            <div
              className="
                rounded-xl
                border border-green-100
                bg-green-50/60
                px-4 py-3
              "
            >
              <p
                className="
                  text-[11px]
                  leading-5
                  text-green-700
                "
              >
                This customer will be
                available only in your
                customer list and can be
                selected while creating
                invoices.
              </p>
            </div>

          </div>


          {/* =================================
              FOOTER ACTIONS
          ================================= */}

          <div
            className="
              flex flex-col-reverse
              gap-2
              border-t border-gray-100
              bg-gray-50/50
              px-6 py-4
              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={
                handleClose
              }
              disabled={
                isSubmitting
              }
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border border-gray-200
                bg-white
                px-5 py-2.5
                text-[13px]
                font-semibold
                text-gray-500
                transition

                hover:bg-gray-50
                hover:text-gray-700

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="
                inline-flex
                min-w-[145px]
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-green-600
                px-5 py-2.5
                text-[13px]
                font-semibold
                text-white
                shadow-sm
                transition

                hover:bg-green-700

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
             {isSubmitting ? (
  <>
    <Loader2
      size={15}
      className="animate-spin"
    />

    {isEditMode
      ? "Updating..."
      : "Saving..."}
  </>
) : (
  <>
    <UserPlus
      size={15}
    />

    {isEditMode
      ? "Update Customer"
      : "Add Customer"}
  </>
)}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};


/* =================================================
   REUSABLE FIELD
   Same file me rakha hai.
================================================= */

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  error,
  required = false,
  helperText = "",
  maxLength,
  autoFocus = false,
}) => {
  return (
    <div>

      <FieldLabel
        label={label}
        required={required}
      />


      <div
        className="relative"
      >
        {Icon && (
          <Icon
            size={15}
            className="
              absolute
              left-3.5 top-1/2
              -translate-y-1/2
              text-gray-300
            "
          />
        )}


        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={
            autoFocus
          }
          className={`
            w-full
            rounded-xl
            border
            bg-gray-50
            py-2.5
            pr-3
            text-[13px]
            text-gray-700
            outline-none
            transition

            placeholder:text-gray-300

            focus:bg-white
            focus:ring-2
            focus:ring-green-100

            ${
              Icon
                ? "pl-10"
                : "pl-3"
            }

            ${
              error
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-green-400"
            }
          `}
        />
      </div>


      {error ? (
        <p
          className="
            mt-1.5
            text-[11px]
            text-red-500
          "
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          className="
            mt-1.5
            text-[10px]
            leading-4
            text-gray-400
          "
        >
          {helperText}
        </p>
      ) : null}

    </div>
  );
};


/* =================================================
   FIELD LABEL
================================================= */

const FieldLabel = ({
  label,
  required = false,
}) => {
  return (
    <label
      className="
        mb-1.5
        block
        text-[11px]
        font-semibold
        text-gray-500
      "
    >
      {label}

      {required && (
        <span
          className="
            ml-1
            text-red-400
          "
        >
          *
        </span>
      )}
    </label>
  );
};


export default CustomerForm;