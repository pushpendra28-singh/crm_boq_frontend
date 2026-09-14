import React from "react";

import {
  renderToBuffer,
} from "@react-pdf/renderer";


/*
  =====================================================
  CREATE SERVER INVOICE ENGINE
  =====================================================

  Build script automatically discovered template
  modules yahan pass karega.

  Example module:

  {
    default: ModernV1,
    templateMeta: {
      key: "modern",
      version: 1,
      name: "Modern",
      ...
    }
  }
*/

export const createInvoiceEngine = (
  templateModules = []
) => {
  const registry = {};


  /*
    -----------------------------------------------
    Build registry from discovered templates
    -----------------------------------------------
  */

  templateModules.forEach(
    (module) => {
      const meta =
        module?.templateMeta;

      const component =
        module?.default;


      /*
        Invalid template file ignore kar do.
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


      /*
        Same key + version duplicate hua
        to build ko silently continue nahi karenge.
      */

      if (
        registry[key]
          .versions[version]
      ) {
        throw new Error(
          `Duplicate invoice template: ${key} v${version}`
        );
      }


      registry[key]
        .versions[version] =
        component;


      if (
        version >
        registry[key]
          .latestVersion
      ) {
        registry[key]
          .latestVersion =
          version;

        registry[key].name =
          meta.name || key;

        registry[key]
          .description =
          meta.description || "";
      }


      if (meta.isDefault) {
        registry[key]
          .isDefault = true;
      }
    }
  );


  /*
    -----------------------------------------------
    Resolve default template
    -----------------------------------------------
  */

  const defaultDefinition =
    Object.values(
      registry
    ).find(
      (template) =>
        template.isDefault
    ) ||
    registry.modern ||
    Object.values(
      registry
    )[0];


  if (!defaultDefinition) {
    throw new Error(
      "No invoice templates found."
    );
  }


  const DEFAULT_INVOICE_TEMPLATE = {
    key:
      defaultDefinition.key,

    version:
      defaultDefinition
        .latestVersion,
  };


  /*
    -----------------------------------------------
    Resolve exact template
    -----------------------------------------------
  */

  const getInvoiceTemplate = (
    template
  ) => {
    const key =
      String(
        template?.key ||
          DEFAULT_INVOICE_TEMPLATE.key
      )
        .trim()
        .toLowerCase();


    const definition =
      registry[key] ||
      registry[
        DEFAULT_INVOICE_TEMPLATE.key
      ];


    const requestedVersion =
      Number(
        template?.version
      );


    const version =
      definition.versions[
        requestedVersion
      ]
        ? requestedVersion
        : definition.latestVersion;


    return {
      key:
        definition.key,

      version,

      name:
        definition.name,

      description:
        definition.description,

      component:
        definition
          .versions[version],
    };
  };


  /*
    -----------------------------------------------
    Backend validation manifest

    React components nahi jayenge.
    Sirf supported key/version.
    -----------------------------------------------
  */

  const getTemplateManifest =
    () => {
      const manifest = {};


      Object.values(
        registry
      ).forEach(
        (template) => {
          manifest[
            template.key
          ] = {
            latestVersion:
              template
                .latestVersion,

            versions:
              Object.keys(
                template.versions
              )
                .map(Number)
                .sort(
                  (a, b) =>
                    a - b
                ),
          };
        }
      );


      return {
        defaultTemplate:
          DEFAULT_INVOICE_TEMPLATE,

        templates:
          manifest,
      };
    };


  /*
    =====================================================
    PDF GENERATION
    =====================================================

    IMPORTANT:

    Ye PDFKit use nahi karta.

    Wahi React-PDF TemplateComponent render hota
    hai jo frontend preview me use hota hai.
  */

  const renderInvoicePdfBuffer =
    async ({
      invoice,
      template,
    }) => {
      if (!invoice) {
        throw new Error(
          "Invoice data is required."
        );
      }


      const {
        component:
          TemplateComponent,

        key,

        version,
      } =
        getInvoiceTemplate(
          template ||
            invoice.template
        );


      if (!TemplateComponent) {
        throw new Error(
          `Invoice template not found: ${key} v${version}`
        );
      }


      const document =
        React.createElement(
          TemplateComponent,
          {
            invoice,
          }
        );


      return renderToBuffer(
        document
      );
    };


  return {
    DEFAULT_INVOICE_TEMPLATE,

    getInvoiceTemplate,

    getTemplateManifest,

    renderInvoicePdfBuffer,
  };
};