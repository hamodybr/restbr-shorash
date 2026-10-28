import { mkdirSync, rmSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repository = resolve(root, "..");
const web = resolve(root, "www");
rmSync(web, { recursive: true, force: true });
mkdirSync(resolve(web, "assets"), { recursive: true });
copyFileSync(resolve(root, "src", "index.html"), resolve(web, "index.html"));
copyFileSync(resolve(root, "src", "styles.css"), resolve(web, "styles.css"));
copyFileSync(resolve(repository, "assets", "shorash-logo.jpeg"), resolve(web, "assets", "shorash-logo.jpeg"));
copyFileSync(resolve(repository, "js", "runtime-config.js"), resolve(web, "config.js"));
await build({
  entryPoints: [resolve(root, "src", "app.js")],
  outfile: resolve(web, "app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "none",
  logLevel: "info"
});
console.log("Staff APK web bundle ready: " + web);
