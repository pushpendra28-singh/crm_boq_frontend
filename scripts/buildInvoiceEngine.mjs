import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  fileURLToPath,
} from "node:url";

import {
  createRequire,
} from "node:module";

import {
  build,
} from "esbuild";


const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );


/*
  =====================================================
  PATHS
  =====================================================
*/

const frontendRoot =
  path.resolve(
    __dirname,
    ".."
  );


const templatesDir =
  path.join(
    frontendRoot,
    "src",
    "admin",
    "invoices",
    "invoice-document",
    "templates"
  );


const serverEntryPath =
  path.join(
    frontendRoot,
    "src",
    "admin",
    "invoices",
    "invoice-document",
    "serverEntry.jsx"
  );


/*
  solar-frontend/
  solar-backend/

  sibling folders assume kar rahe hain.
*/

const backendRoot =
  path.resolve(
    frontendRoot,
    "../solar-backend"
  );


const outputDir =
  path.join(
    backendRoot,
    "generated"
  );


const outputEnginePath =
  path.join(
    outputDir,
    "invoiceEngine.cjs"
  );


const outputManifestPath =
  path.join(
    outputDir,
    "invoiceTemplates.json"
  );


/*
  =====================================================
  FIND ALL TEMPLATE JSX FILES
  =====================================================
*/

const findTemplateFiles = (
  directory
) => {
  const files = [];


  const walk = (
    currentDirectory
  ) => {
    const entries =
      fs.readdirSync(
        currentDirectory,
        {
          withFileTypes:
            true,
        }
      );


    entries.forEach(
      (entry) => {
        const fullPath =
          path.join(
            currentDirectory,
            entry.name
          );


        if (
          entry.isDirectory()
        ) {
          walk(fullPath);

          return;
        }


        if (
          entry.isFile() &&
          entry.name.endsWith(
            ".jsx"
          )
        ) {
          files.push(
            fullPath
          );
        }
      }
    );
  };


  walk(directory);


  return files.sort();
};


/*
  =====================================================
  VALIDATE PATHS
  =====================================================
*/

if (
  !fs.existsSync(
    templatesDir
  )
) {
  throw new Error(
    `Templates directory not found: ${templatesDir}`
  );
}


if (
  !fs.existsSync(
    serverEntryPath
  )
) {
  throw new Error(
    `serverEntry.jsx not found: ${serverEntryPath}`
  );
}


const templateFiles =
  findTemplateFiles(
    templatesDir
  );


if (
  templateFiles.length === 0
) {
  throw new Error(
    "No invoice template files found."
  );
}


/*
  =====================================================
  GENERATE TEMP ENTRY
  =====================================================

  Automatically:

  import * as template0 from ModernV1
  import * as template1 from PremiumV1
  ...

  Future template add hote hi next build me
  automatically yahan include ho jayega.
*/

const imports =
  templateFiles.map(
    (filePath, index) => {
      return (
        `import * as template${index} ` +
        `from ${JSON.stringify(filePath)};`
      );
    }
  );


const modules =
  templateFiles.map(
    (_, index) =>
      `template${index}`
  );


const temporaryEntryCode = `
import {
  createInvoiceEngine
} from ${JSON.stringify(
  serverEntryPath
)};

${imports.join("\n")}

const engine =
  createInvoiceEngine([
    ${modules.join(",\n    ")}
  ]);

export const DEFAULT_INVOICE_TEMPLATE =
  engine.DEFAULT_INVOICE_TEMPLATE;

export const getInvoiceTemplate =
  engine.getInvoiceTemplate;

export const getTemplateManifest =
  engine.getTemplateManifest;

export const renderInvoicePdfBuffer =
  engine.renderInvoicePdfBuffer;
`;


/*
  Temporary source file.
*/

const temporaryEntryPath =
  path.join(
    os.tmpdir(),
    `invoice-engine-${Date.now()}.jsx`
  );


fs.writeFileSync(
  temporaryEntryPath,
  temporaryEntryCode,
  "utf8"
);


/*
  =====================================================
  BUILD SERVER BUNDLE
  =====================================================
*/

fs.mkdirSync(
  outputDir,
  {
    recursive: true,
  }
);


try {
  await build({
    entryPoints: [
      temporaryEntryPath,
    ],

    outfile:
      outputEnginePath,

    bundle: true,

    platform: "node",

    format: "cjs",

    target: "node20",

    jsx: "automatic",

    sourcemap: false,

    minify: false,
  });


  /*
    Load generated CJS engine.
  */

  const require =
    createRequire(
      import.meta.url
    );


  delete require.cache[
    require.resolve(
      outputEnginePath
    )
  ];


  const engine =
    require(
      outputEnginePath
    );


  const manifest =
    engine
      .getTemplateManifest();


  fs.writeFileSync(
    outputManifestPath,

    JSON.stringify(
      manifest,
      null,
      2
    ),

    "utf8"
  );


  console.log(
    "\nInvoice engine generated successfully."
  );

  console.log(
    `Templates found: ${templateFiles.length}`
  );

  console.log(
    `Engine: ${outputEnginePath}`
  );

  console.log(
    `Manifest: ${outputManifestPath}\n`
  );


  console.log(
    JSON.stringify(
      manifest,
      null,
      2
    )
  );
} finally {
  /*
    Temp file cleanup.
  */

  if (
    fs.existsSync(
      temporaryEntryPath
    )
  ) {
    fs.unlinkSync(
      temporaryEntryPath
    );
  }
}