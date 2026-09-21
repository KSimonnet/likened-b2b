import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");

async function cleanDist() {
  await fs.rm(DIST_ROOT, { recursive: true, force: true });
  await fs.mkdir(DIST_ROOT, { recursive: true });
}

async function copyDirectory(src_dir, dest_dir) {
  await fs.cp(src_dir, dest_dir, { recursive: true });
}

async function buildJavaScriptBundle() {
  await esbuild.build({
    bundle: true,
    entryPoints: [path.join(PROJECT_ROOT, "public", "js", "b-to-b.js")],
    format: "iife",
    outfile: path.join(DIST_ROOT, "js", "b-to-b.js"),
    platform: "browser",
    target: "es2020"
  });
}

async function build() {
  console.log("Building static B2B site...");
  await cleanDist();
  await copyDirectory(path.join(PROJECT_ROOT, "public"), DIST_ROOT);
  await buildJavaScriptBundle();
  console.log("✅ Static site copied to dist/");
}

build().catch((error) => {
  console.error("❌ Static build failed:", error.message);
  process.exit(1);
});
