// Current desktop/mobile acceptance suite; start the isolated test server first.
import { spawnSync } from "node:child_process";
const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["playwright", "test", ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
