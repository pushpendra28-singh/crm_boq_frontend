/*
  =====================================================
  AUTO DISCOVER INVOICE TEMPLATES
  =====================================================

  Vite automatically templates folder ke andar
  sab .jsx template files load karega.

  New template add karne par registry ko manually
  edit karne ki need nahi hogi.
*/

const templateModules =
  import.meta.glob(
    "./templates/**/*.jsx",
    {
      eager: true,
    }
  );


/*
  =====================================================
  BUILD REGISTRY
  =====================================================
*/

const registry = {};


Object.values(
  templateModules
).forEach((module) => {
  const meta =
    module.templateMeta;

  const component =
    module.default;


  /*
    Template contract invalid hai
    to us file ko registry me include nahi karenge.
  */

  if (
    !meta?.key ||
    !Number.isInteger(
      Number(meta.version)
    ) ||
    !component
  ) {
    return;
  }


  const key =
    String(meta.key)
      .trim()
      .toLowerCase();

  const version =
    Number(meta.version);


  if (!registry[key]) {
    registry[key] = {
      key,

      name:
        meta.name || key,

      description:
        meta.description || "",

      latestVersion:
        version,

      versions: {},

      isDefault:
        Boolean(
          meta.isDefault
        ),
    };
  }


  registry[key].versions[
    version
  ] = component;


  /*
    Automatically latest available version.
  */

  registry[key].latestVersion =
    Math.max(
      registry[key]
        .latestVersion,
      version
    );


  /*
    Latest metadata ko use karenge.
  */

  if (
    version ===
    registry[key]
      .latestVersion
  ) {
    registry[key].name =
      meta.name || key;

    registry[key]
      .description =
      meta.description || "";
  }


  if (meta.isDefault) {
    registry[key].isDefault =
      true;
  }
});


export const
  INVOICE_TEMPLATE_REGISTRY =
    Object.freeze(
      registry
    );


/*
  =====================================================
  DEFAULT TEMPLATE
  =====================================================
*/

const defaultDefinition =
  Object.values(
    INVOICE_TEMPLATE_REGISTRY
  ).find(
    (template) =>
      template.isDefault
  ) ||
  INVOICE_TEMPLATE_REGISTRY
    .modern ||
  Object.values(
    INVOICE_TEMPLATE_REGISTRY
  )[0];


if (!defaultDefinition) {
  throw new Error(
    "No invoice templates found."
  );
}


export const
  DEFAULT_INVOICE_TEMPLATE =
    Object.freeze({
      key:
        defaultDefinition.key,

      version:
        defaultDefinition
          .latestVersion,
    });


/*
  =====================================================
  GET TEMPLATE
  =====================================================
*/

export const getInvoiceTemplate =
  (template) => {
    const requestedKey =
      String(
        template?.key ||
          DEFAULT_INVOICE_TEMPLATE.key
      )
        .trim()
        .toLowerCase();


    const templateDefinition =
      INVOICE_TEMPLATE_REGISTRY[
        requestedKey
      ] ||
      INVOICE_TEMPLATE_REGISTRY[
        DEFAULT_INVOICE_TEMPLATE.key
      ];


    const requestedVersion =
      Number(
        template?.version
      );


    const resolvedVersion =
      requestedVersion &&
      templateDefinition
        .versions[
        requestedVersion
      ]
        ? requestedVersion
        : templateDefinition
            .latestVersion;


    return {
      key:
        templateDefinition.key,

      name:
        templateDefinition.name,

      description:
        templateDefinition
          .description,

      version:
        resolvedVersion,

      component:
        templateDefinition
          .versions[
          resolvedVersion
        ],
    };
  };


/*
  =====================================================
  TEMPLATE SELECTOR DATA
  =====================================================
*/

export const
  getAvailableInvoiceTemplates =
    () => {
      return Object.values(
        INVOICE_TEMPLATE_REGISTRY
      ).map(
        (template) => ({
          key:
            template.key,

          name:
            template.name,

          description:
            template.description,

          version:
            template
              .latestVersion,
        })
      );
    };