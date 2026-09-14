export const formatInvoiceCurrency = (
  amount,
  currency = "INR",
  locale = "en-IN"
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
};


export const formatInvoiceDate = (
  date
) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


export const getPaymentTermsLabel = (
  paymentTerms
) => {
  if (
    paymentTerms === "custom"
  ) {
    return "Custom";
  }

  if (
    paymentTerms === "0" ||
    paymentTerms === 0
  ) {
    return "Due on Receipt";
  }

  if (
    paymentTerms === undefined ||
    paymentTerms === null ||
    paymentTerms === ""
  ) {
    return "—";
  }

  return `${paymentTerms} Days`;
};

export const resolveInvoiceAssetUrl = (
  assetUrl,
  baseUrl = ""
) => {
  if (!assetUrl) {
    return "";
  }

  const cleanAssetUrl =
    String(assetUrl).trim();


  /*
    Already absolute URL hai.
  */

  if (
    /^https?:\/\//i.test(
      cleanAssetUrl
    )
  ) {
    return cleanAssetUrl;
  }


  /*
    Relative asset ke liye caller base URL dega.

    Browser-specific API config ko
    shared document utility ke andar
    import nahi karenge.
  */

  if (!baseUrl) {
    return cleanAssetUrl;
  }


  try {
    const base =
      new URL(baseUrl);

    return new URL(
      cleanAssetUrl,
      base.origin
    ).toString();
  } catch {
    return cleanAssetUrl;
  }
};