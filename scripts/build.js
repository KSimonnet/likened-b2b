import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");
const WEBAPP_ROOT = path.resolve(PROJECT_ROOT, "..", "likened-webapp");

async function cleanDist() {
  await fs.rm(DIST_ROOT, { recursive: true, force: true });
  await fs.mkdir(DIST_ROOT, { recursive: true });
}

async function copyDirectory(src_dir, dest_dir) {
  await fs.cp(src_dir, dest_dir, { recursive: true });
}

async function buildCssBundle() {
  const css_sources = [
    path.join(WEBAPP_ROOT, "shared-css", "likened-brand-kit.css"),
    path.join(WEBAPP_ROOT, "public", "css", "shared", "likened-style.css"),
    path.join(WEBAPP_ROOT, "public", "css", "shared", "page-style.css"),
    path.join(WEBAPP_ROOT, "public", "css", "shared", "modal.css"),
    path.join(WEBAPP_ROOT, "public", "css", "shared", "slider-switch.css"),
    path.join(WEBAPP_ROOT, "public", "css", "pages", "b-to-b.css")
  ];
  const css_content = await Promise.all(
    css_sources.map((css_source) => fs.readFile(css_source, "utf8"))
  );

  await fs.writeFile(
    path.join(DIST_ROOT, "css", "b-to-b-bundle.css"),
    css_content.join("\n\n"),
    "utf8"
  );
}

async function build() {
  console.log("Building static B2B site...");
  await cleanDist();
  await copyDirectory(path.join(PROJECT_ROOT, "public"), DIST_ROOT);
  await buildCssBundle();
  console.log("✅ Static site copied to dist/");
}

build().catch((error) => {
  console.error("❌ Static build failed:", error.message);
  process.exit(1);
});
