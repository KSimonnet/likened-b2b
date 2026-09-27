import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

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
    entryPoints: [path.join(PROJECT_ROOT, "public", "js", "landing-page.js")],
    format: "iife",
    outfile: path.join(DIST_ROOT, "js", "landing-page.js"),
    platform: "browser",
    target: "es2020"
  });
}

async function buildTailwindCSS() {
  const input_path = path.join(PROJECT_ROOT, "src", "css", "tailwind.css");
  const output_path = path.join(DIST_ROOT, "css", "tailwind.min.css");
  const config_path = path.join(PROJECT_ROOT, "tailwind.config.js");

  await fs.mkdir(path.dirname(output_path), { recursive: true });
  const minify_flag = IS_PRODUCTION ? "--minify" : "";
  await execAsync(
    `npx tailwindcss -c "${config_path}" -i "${input_path}" -o "${output_path}" ${minify_flag}`,
    { cwd: PROJECT_ROOT }
  );
}

async function buildCSSBundle() {
  await esbuild.build({
    bundle: true,
    entryPoints: [path.join(PROJECT_ROOT, "src", "css", "b-to-b.css")],
    outfile: path.join(DIST_ROOT, "css", "b-to-b-bundle.css"),
    external: [
      "../assets/fonts/OpenSans/OpenSans-Regular.woff2",
      "../assets/fonts/OpenSans/OpenSans-Bold.woff2"
    ]
  });
}

async function validateCSSArtifactBoundary() {
  const public_css_artifacts = ["b-to-b-bundle.css", "tailwind.min.css"];

  for (const artifact_name of public_css_artifacts) {
    try {
      await fs.access(path.join(PROJECT_ROOT, "public", "css", artifact_name));
    } catch (error) {
      if (error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    throw new Error(
      `Generated CSS artifact must not be committed under public/css/: ${artifact_name}`
    );
  }
}

async function build() {
  console.log("Building static B2B site...");
  await validateCSSArtifactBoundary();
  await cleanDist();
  await copyDirectory(path.join(PROJECT_ROOT, "public"), DIST_ROOT);
  await buildTailwindCSS();
  await buildCSSBundle();
  await buildJavaScriptBundle();
  console.log("✅ Static site copied to dist/");
}

build().catch((error) => {
  console.error("❌ Static build failed:", error.message);
  process.exit(1);
});
