import * as esbuild from "esbuild";
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import * as url from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";

const execAsync = promisify(exec);

// Get __dirname equivalent in ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Use Node's module resolution algorithm — correctly resolves packages at any
// workspace hoisting depth without hardcoding relative paths. `resolveHoistedModule()` was reinventing what Node already does natively
const _require = createRequire(import.meta.url);

// Load .env at build time (never committed — Contract-SBM-002)
try {
  const env_raw = readFileSync(path.join(PROJECT_ROOT, ".env"), "utf-8");
  for (const line of env_raw.split(/\r?\n/)) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  // .env absent — SUPABASE vars validated in buildJS()
}

// Parse command line arguments
const args = process.argv.slice(2);
const IS_WATCH = args.includes("--watch");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * @description Process Tailwind CSS using CLI
 * @post dist/css/tailwind.min.css created (always, minified in prod only)
 */
async function processTailwind() {
  const DIST_CSS_DIR = path.join(PROJECT_ROOT, "dist/css");
  await fs.mkdir(DIST_CSS_DIR, { recursive: true });

  // Create input CSS file
  const INPUT_CSS_PATH = path.join(
    PROJECT_ROOT,
    "public/css/tailwind-input.css"
  );
  const OUTPUT_CSS_PATH = path.join(DIST_CSS_DIR, "tailwind.min.css");

  await fs.writeFile(
    INPUT_CSS_PATH,
    `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `.trim()
  );

  // Run Tailwind CLI (using npx for cross-platform compatibility)
  const minify_flag = IS_PRODUCTION ? "--minify" : "";
  await execAsync(
    `npx tailwindcss -i "${INPUT_CSS_PATH}" -o "${OUTPUT_CSS_PATH}" ${minify_flag}`,
    { cwd: PROJECT_ROOT }
  ); // tailwindcss -i public/css/tailwind-input.css -o dist/css/tailwind.min.css --minify

  // Clean up input file
  await fs.unlink(INPUT_CSS_PATH);
  console.log("✅ Tailwind CSS processed");
}
// To use Chart.js, import it in your JavaScript modules: import Chart from 'chart.js/auto'

/**
 * @description Builds a single CSS bundle by concatenating the given source files in order.
 *
 * @param {string[]} file_paths - Ordered absolute paths of CSS files to concatenate
 * @param {string} output_filename - Output filename within dist/css/
 * @param {string} dist_css_dir - Absolute path to dist/css/
 *
 * @returns {Promise<void>}
 *
 * @pre All file_paths point to readable CSS files
 * @post dist/css/{output_filename} written with section headers per source file
 * @throws {Error} If any source file is unreadable
 */
async function buildCSSBundle(file_paths, output_filename, dist_css_dir) {
  const parts = [];
  for (const file_path of file_paths) {
    const file_name = path.basename(file_path);
    const content = await fs.readFile(file_path, "utf-8");
    parts.push(`/* === ${file_name} === */`);
    parts.push(content);
    parts.push("");
  }
  const combined = parts.join("\n");
  const output = IS_PRODUCTION
    ? (await esbuild.transform(combined, { loader: "css", minify: true })).code
    : combined;
  const output_path = path.join(dist_css_dir, output_filename);
  await fs.writeFile(output_path, output);
  console.log(
    `✅ ${output_filename}: ${file_paths.map((p) => path.basename(p)).join(" → ")}`
  );
}

/**
 * @description Materialize all CSS bundles in parallel.
 *
 * Bundles produced:
 *   dist/css/landing-page-bundle.css   — brand-kit + likened-style + page-style + landing-page + slider-switch + modal
 *   dist/css/login-page-bundle.css     — brand-kit + likened-style + page-style + login
 *   dist/css/web-app.css               — brand-kit + likened-style + page-style + modal + transfer-widget + progress-bar + import-networks + crawl-networks + locomotive-scroll
 *   dist/css/prototype-bundle.css      — brand-kit + likened-style + page-style + prototype + modal + progress-bar + crawl-networks + locomotive-scroll
 *   dist/css/pricing-bundle.css        — brand-kit + likened-style + page-style + landing-page + slider-switch + modal + pricing
 *   dist/css/b-to-b-bundle.css         — brand-kit + likened-style + page-style + modal + b-to-b
 *   dist/css/account-bundle.css        — brand-kit + likened-style + page-style + slider-switch + modal + account
 *   dist/css/user-journey-bundle.css   — brand-kit + likened-style + page-style + user-journey
 *
 * @pre Brand kit CSS is resolvable from @ksimonnet/likened-shared/styles
 * @pre Web-shared CSS files exist in public/css/shared/
 * @pre Per-page CSS source files exist in public/css/pages/
 *
 * @post dist/css/landing-page-bundle.css written (minified in prod; compile check — HTML not yet deployed)
 * @post dist/css/login-page-bundle.css written (minified in prod)
 * @post dist/css/web-app.css written (minified in prod)
 * @post dist/css/prototype-bundle.css written (minified in prod)
 * @post dist/css/pricing-bundle.css written (minified in prod)
 * @post dist/css/b-to-b-bundle.css written (minified in prod)
 * @post dist/css/account-bundle.css written (minified in prod)
 * @post dist/css/user-journey-bundle.css written (minified in prod)
 * @throws {Error} If any source CSS file is missing
 */
async function prepareCSS() {
  const DIST_CSS_DIR = path.join(PROJECT_ROOT, "dist/css");
  await fs.mkdir(DIST_CSS_DIR, { recursive: true });

  // Resolve package directory from main entry point, then construct CSS path
  const SHARED_CONSTANTS_MODULE = _require.resolve("@ksimonnet/likened-shared");
  // Main module is at src/index.js, navigate up to package root
  const SHARED_BRAND_KIT_PACKAGE_DIR = path.join(
    path.dirname(SHARED_CONSTANTS_MODULE),
    ".."
  );
  const SHARED_BRAND_KIT_CSS = path.join(
    SHARED_BRAND_KIT_PACKAGE_DIR,
    "dist/likened-brand-kit.css"
  );
  const WEB_SHARED = path.join(PROJECT_ROOT, "public/css/shared");
  const PAGE_CSS = path.join(PROJECT_ROOT, "public/css/pages");
  // Use package's named CSS export — resolves via Node module algorithm at any hoisting depth
  const LOCOMOTIVE_CSS = _require.resolve(
    "locomotive-scroll/locomotive-scroll.css"
  );

  try {
    await Promise.all([
      // Landing page — no popup component styles needed (compile check; HTML not yet deployed)
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(PAGE_CSS, "landing-page.css"),
          // path.join(PAGE_CSS, "animation-slogan.css"),
          path.join(WEB_SHARED, "slider-switch.css"),
          path.join(WEB_SHARED, "modal.css")
        ],
        "landing-page-bundle.css",
        DIST_CSS_DIR
      ),
      // Login page
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(PAGE_CSS, "login.css")
        ],
        "login-page-bundle.css",
        DIST_CSS_DIR
      ),
      // Web app
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(WEB_SHARED, "modal.css"),
          path.join(WEB_SHARED, "transfer-widget.css"),
          path.join(WEB_SHARED, "progress-bar.css"),
          path.join(WEB_SHARED, "import-networks.css"),
          path.join(WEB_SHARED, "crawl-networks.css"),
          LOCOMOTIVE_CSS
        ],
        "web-app.css",
        DIST_CSS_DIR
      ),
      // Prototype page
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(PAGE_CSS, "prototype.css"),
          path.join(WEB_SHARED, "modal.css"),
          path.join(WEB_SHARED, "progress-bar.css"),
          path.join(WEB_SHARED, "crawl-networks.css"),
          LOCOMOTIVE_CSS
        ],
        "prototype-bundle.css",
        DIST_CSS_DIR
      ),
      // Pricing page
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(PAGE_CSS, "landing-page.css"),
          path.join(WEB_SHARED, "slider-switch.css"),
          path.join(WEB_SHARED, "modal.css"),
          path.join(PAGE_CSS, "pricing.css")
        ],
        "pricing-bundle.css",
        DIST_CSS_DIR
      ),
      // BtoB pages
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(WEB_SHARED, "modal.css"),
          path.join(WEB_SHARED, "slider-switch.css"),
          path.join(PAGE_CSS, "b-to-b.css")
        ],
        "b-to-b-bundle.css",
        DIST_CSS_DIR
      ),
      // Account page
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(WEB_SHARED, "slider-switch.css"),
          path.join(WEB_SHARED, "modal.css"),
          path.join(PAGE_CSS, "account.css")
        ],
        "account-bundle.css",
        DIST_CSS_DIR
      ),
      // User journey (LinkedIn import workflow)
      buildCSSBundle(
        [
          SHARED_BRAND_KIT_CSS,
          path.join(WEB_SHARED, "likened-style.css"),
          path.join(WEB_SHARED, "page-style.css"),
          path.join(PAGE_CSS, "user-journey.css")
        ],
        "user-journey-bundle.css",
        DIST_CSS_DIR
      )
    ]);
  } catch (error) {
    console.error("❌ CSS materialization failed:", error.message);
    throw error;
  }
}

/**
 * @description Copy static assets (HTML, pre-minified vendor JS, images, fonts) to dist/
 * @pre public/app/ directory exists with assets
 * @pre shared-assets/ directory exists with shared images and fonts
 * @post dist/ contains copied files (CSS handled by prepareCSS, source JS bundled by buildJS)
 */
async function copyPublicFiles() {
  const files_to_copy = [
    // Apex host acts as routing entrypoint and redirects to canonical b2b host.
    { from: "public/routing/apex-to-b2b-redirect.html", to: "dist/index.html" },
    // Canonical host content paths.
    { from: "public/b-to-b/index.html", to: "dist/b2b/index.html" },
    { from: "public/b-to-b/pricing.html", to: "dist/b2b/pricing.html" },
    { from: "public/index.html", to: "dist/b2c/index.html" },
    { from: "public/pricing.html", to: "dist/b2c/pricing.html" },
    // Keep legacy /b-to-b links alive via static redirect compatibility page.
    {
      from: "public/routing/legacy-b-to-b-to-b2b-redirect.html",
      to: "dist/b-to-b/index.html"
    },
    {
      from: "public/routing/legacy-b-to-b-pricing-to-b2b-redirect.html",
      to: "dist/b-to-b/pricing.html"
    },
    // Keep direct root pages during transition for local/manual checks.
    { from: "public/index.html", to: "dist/b2c-landing-source.html" },
    { from: "public/b-to-b/index.html", to: "dist/b2b-landing-source.html" },
    { from: "public/login.html", to: "dist/login.html" },
    { from: "public/pricing.html", to: "dist/pricing.html" },
    { from: "public/account.html", to: "dist/account.html" },
    { from: "public/app/index.html", to: "dist/app/index.html" },
    { from: "public/prototype/index.html", to: "dist/prototype/index.html" },
    {
      from: "public/prototype-sna/index.html",
      to: "dist/prototype-sna/index.html"
    },
    {
      from: "public/user-journey/index.html",
      to: "dist/user-journey/index.html"
    },
    // Vendor files: already minified, copy as-is
    { from: "public/js/chart.min.js", to: "dist/js/chart.min.js" },
    { from: "public/js/tailwindcss.min.js", to: "dist/js/tailwindcss.min.js" }
  ];

  for (const { from, to } of files_to_copy) {
    const to_path = path.join(PROJECT_ROOT, to);
    await fs.mkdir(path.dirname(to_path), { recursive: true });
    await fs.copyFile(path.join(PROJECT_ROOT, from), to_path);
  }

  // Copy assets (images referenced by manifest icons and webapp)
  await fs.cp(
    path.join(PROJECT_ROOT, "public/assets"),
    path.join(PROJECT_ROOT, "dist/assets"),
    { recursive: true }
  );

  // Merge shared-assets/ (images + fonts) into dist/assets/
  await fs.cp(
    path.join(PROJECT_ROOT, "shared-assets"),
    path.join(PROJECT_ROOT, "dist/assets"),
    { recursive: true }
  );

  console.log("✅ Public files copied");
}

/**
 * @description Fixes esbuild's Windows bug where sourceMappingURL is written as an absolute
 * path (e.g. /dark-mode.js.map) instead of relative (dark-mode.js.map).
 * Walks all *.js files in dist/ and strips the leading slash so browsers
 * request the correct relative URL and find the .map file alongside the bundle.
 *
 * @pre esbuild has already written the output JS and .map files to dist/
 * @post All //# sourceMappingURL comments in dist/**\/*.js use relative paths
 */

/**
 * @description Build all JavaScript entry points with esbuild
 * @post All JS bundles written to dist/ (minified in prod, sourcemaps in dev)
 */
async function buildJS() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL)
    throw new Error(
      "Build failed: SUPABASE_URL missing from .env — REQ-SBM-002"
    );
  if (!SUPABASE_ANON_KEY)
    throw new Error(
      "Build failed: SUPABASE_ANON_KEY missing from .env — REQ-SBM-002"
    );

  const common_options = {
    bundle: true,
    minify: IS_PRODUCTION,
    sourcemap: IS_PRODUCTION
      ? false
      : "inline" /* "inline" embeds the source map as a data URL — no separate .map file request, avoids 404s from esbuild's absolute-path sourceMappingURL on Windows. source directory tree — a virtual reconstruction by DevTools using the source map (bundle.min.js.map). It shows your original pre-bundled source files as they existed on disk before esbuild merged them.
    The map file is at dark-mode.js.map but the comment (e.g. //# sourceMappingURL=/dark-mode.js.map) references /dark-mode.js.map (absolute root path) — esbuild is generating an absolute URL on Windows when outfile is an absolute path. The map file ends up at the wrong URL. */,
    target: ["es2020"],
    // REMOVE the .html loader unless you actually import HTML files in JS
    loader: {
      ".js": "js",
      ".css": "css",
      ".wasm": "file"
    },
    publicPath: "/",
    treeShaking: true,
    logLevel: "info", // instead of "error", changed to "info" so you can see what's happening
    // Ensure this points to the right place or remove it to use default node resolution
    nodePaths: [path.resolve(PROJECT_ROOT, "node_modules")]
  };

  const build_configs = [
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/app/js/main.js")],
      format: "esm",
      define: {
        SUPABASE_URL: JSON.stringify(SUPABASE_URL),
        SUPABASE_ANON_KEY: JSON.stringify(SUPABASE_ANON_KEY)
      },
      outfile: path.join(PROJECT_ROOT, "dist/bundle.min.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/dark-mode.js")],
      format: "iife",
      outfile: path.join(PROJECT_ROOT, "dist/js/dark-mode.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/login.js")],
      format: "esm",
      define: {
        SUPABASE_URL: JSON.stringify(SUPABASE_URL),
        SUPABASE_ANON_KEY: JSON.stringify(SUPABASE_ANON_KEY)
      },
      outfile: path.join(PROJECT_ROOT, "dist/js/login.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/landing-page.js")],
      format: "iife",
      define: {
        SUPABASE_URL: JSON.stringify(SUPABASE_URL),
        SUPABASE_ANON_KEY: JSON.stringify(SUPABASE_ANON_KEY)
      },
      outfile: path.join(PROJECT_ROOT, "dist/js/landing-page.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/pricing.js")],
      format: "iife",
      define: {
        SUPABASE_URL: JSON.stringify(SUPABASE_URL),
        SUPABASE_ANON_KEY: JSON.stringify(SUPABASE_ANON_KEY)
      },
      outfile: path.join(PROJECT_ROOT, "dist/js/pricing.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/b-to-b.js")],
      format: "iife",
      outfile: path.join(PROJECT_ROOT, "dist/js/b-to-b.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/js/account.js")],
      format: "iife",
      define: {
        SUPABASE_URL: JSON.stringify(SUPABASE_URL),
        SUPABASE_ANON_KEY: JSON.stringify(SUPABASE_ANON_KEY)
      },
      outfile: path.join(PROJECT_ROOT, "dist/js/account.js")
    },
    {
      ...common_options,
      entryPoints: [path.join(PROJECT_ROOT, "public/prototype/prototype.js")],
      format: "esm",
      // @ksimonnet/utils barrel (index.js) re-exports Node-only modules (fs, path, stream, child_process).
      // platform: "browser" tells esbuild to treat Node built-ins as unresolvable and exclude them,
      // preventing bundling failures when only browser-safe sub-modules are actually imported.
      platform: "browser",
      outfile: path.join(PROJECT_ROOT, "dist/prototype/prototype.js")
    },
    {
      ...common_options,
      entryPoints: [
        path.join(PROJECT_ROOT, "public/prototype-sna/main-sna.js")
      ],
      format: "esm",
      platform: "browser",
      outfile: path.join(PROJECT_ROOT, "dist/prototype-sna/main-sna.js")
    },
    {
      ...common_options,
      entryPoints: [
        path.join(PROJECT_ROOT, "public/prototype-sna/prototype-sna.js")
      ],
      format: "esm",
      platform: "browser",
      outfile: path.join(PROJECT_ROOT, "dist/prototype-sna/prototype-sna.js")
    }
  ];

  const contexts = await Promise.all(
    build_configs.map((cfg) => esbuild.context(cfg))
  );

  if (IS_WATCH) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("👀 Watching for changes...");
  } else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
    console.log("✅ Build complete");
  }
}

/**
 * @description Main build process
 * @pre Shared package CSS and local CSS files exist
 * @throws {Error} If build fails
 */
async function build() {
  const mode = IS_PRODUCTION ? "production" : "development";
  console.log(`Building in ${mode} mode...`);

  try {
    await fs.rm(path.join(PROJECT_ROOT, "dist"), {
      recursive: true,
      force: true
    });
    console.log("✅ dist/ cleaned");

    await prepareCSS();
    await processTailwind();
    await copyPublicFiles();
    // await assertFontContract();
    await buildJS();
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
