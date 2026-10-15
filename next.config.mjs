import { fileURLToPath } from "node:url";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/docusignisdead";
export default {
  basePath,
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // /f/<id> style public routes live under the same basePath.
  poweredByHeader: false,
};
