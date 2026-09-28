# Host Migration Anti-Patterns

Trigger justification: Contracts B2C-001 and B2C-002 and constraints CON-B2C-003, CON-B2C-004, CON-B2C-006, and CON-B2B-003 were violated during the landing-host migrations: raw modules reached Pages, package authorization failed, and generated JavaScript and CSS bundles were committed as source.

## Anti-Pattern-HOSTCUT-001: Deploying Raw Browser Module Source to GitHub Pages (🔴 CRITICAL)

**Severity:** CRITICAL

**Category:** Pages Artifact Construction

**Violates:**
- Contract-B2C-001 — Isolate the Canonical B2C Landing Host
- Constraint CON-B2C-003 — The Pages artifact is buildable from sources and dependencies available to its deployment workflow
- Requirement REQ-B2C-008 — Publish a built, self-contained artifact
- Requirement REQ-B2C-009 — Resolve browser module dependencies before delivery

**Root Cause:** A static `public/` directory looks deployable because it contains HTML and assets, but source JavaScript can still contain module imports that browsers cannot resolve from a Pages host.

**Definition:** Uploading raw source to GitHub Pages when the page requires generated CSS or JavaScript bundling.

**Why it's harmful:** The custom domain can pass DNS validation and still serve a page whose browser console reports `Cannot use import statement outside a module` or missing package/module paths.

**Code examples:**

```yaml
# GOOD - shared modules and page-specific styles remain separate sources.
Shared sources: individual @ksimonnet/likened-shared/styles/*.css exports
B2B source: src/css/pages/b-to-b.css */
    path: public
```
```yaml
# GOOD - builds and publishes the self-contained artifact.
  sharedCssModules:
    - "@ksimonnet/likened-shared/styles"
    - "@ksimonnet/likened-shared/styles/likened-style.css"
    - "@ksimonnet/likened-shared/styles/page-style.css"
    - "@ksimonnet/likened-shared/styles/landing-page-content.css"
    - "@ksimonnet/likened-shared/styles/slider-switch.css"
    - "@ksimonnet/likened-shared/styles/modal.css"
  pageCss: "src/css/pages/b-to-b.css"
- uses: actions/upload-pages-artifact@v3
  outdir: "dist/css"
    path: dist
```

**Detection strategy:** Search the uploaded artifact for raw import statements:

```bash
rg '^import ' dist/js
```

**Correction strategy:**
1. Add the required bundler entrypoint to the repository build.
2. Run the build before the Pages upload step.
3. Upload `dist/` only.
4. Verify the browser console and deployed script response after deployment.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)

## Anti-Pattern-HOSTCUT-002: Constructing a Pages Artifact from a Sibling Private Repository (🔴 CRITICAL)

**Severity:** CRITICAL

**Category:** Deployment Dependency Ownership

**Violates:**
- Constraint CON-B2C-003 — The Pages artifact is buildable from sources and dependencies available to its deployment workflow
- Requirement REQ-B2C-004 — Include every B2C asset in the B2C artifact

**Root Cause:** A local multi-root workspace makes sibling repositories appear universally available. GitHub Actions checks out only the workflow repository unless a separately authorized token can read another private repository.

**Definition:** Requiring a Pages workflow to check out a sibling private repository to build the deployable landing artifact.

**Why it's harmful:** The workflow fails before build when the runner token lacks repository read access, leaving the custom domain unavailable even though local builds succeed.

**Code examples:**

```yaml
# BAD - requires access to an unrelated private repository.
- uses: actions/checkout@v5
  with:
    repository: KSimonnet/likened-webapp
    path: likened-webapp
```

```yaml
# GOOD - builds from sources committed to the deployment repository.
- uses: actions/checkout@v5
- run: npm run build
```

**Detection strategy:** Search Pages workflows for cross-repository checkout:

```bash
rg 'repository: KSimonnet/' .github/workflows
```

**Correction strategy:**
1. Copy or generate all required static source inputs into the deployment repository.
2. Declare any reusable code as an installable package rather than a sibling file path.
3. Remove cross-repository checkout from the Pages workflow.
4. Validate the build in a clean checkout.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)

## Anti-Pattern-HOSTCUT-003: Deferring Private Package Authorization Until `npm ci` (🟡 MODERATE)

**Severity:** MODERATE

**Category:** Package Authentication

**Violates:**
- Constraint CON-B2C-004 — Authorize private package access before package installation

**Root Cause:** `packages: read` permits the workflow token to request package access but does not grant a repository access to every private package. A token can be present and still receive `403 read_package`.

**Definition:** Installing private GitHub Packages without verifying that the deployment repository and token are authorized.

**Why it's harmful:** The workflow fails late at `npm ci`, after Pages configuration is already in place, and the failure message does not identify the missing package-level repository authorization.

**Code examples:**

```yaml
# BAD - installation is the first package-access check.
- run: npm ci
```

```yaml
# GOOD - fail before installation with an actionable package check.
- name: Configure GitHub Packages authentication
  run: |
    npm config set @ksimonnet:registry https://npm.pkg.github.com
    npm config set //npm.pkg.github.com/:_authToken "$NODE_AUTH_TOKEN"
    npm view @ksimonnet/utils version --registry=https://npm.pkg.github.com >/dev/null
- run: npm ci
```

**Detection strategy:** Search workflow logs for `read_package`, `403 Forbidden`, or a failed `npm ci` before `npm run build`.

**Correction strategy:**
1. In the package settings, add the deployment repository under **Manage Actions access** with **Read** permission.
2. Ensure the workflow token or `NODE_AUTH_TOKEN` secret has `read:packages` permission.
3. Configure the scoped registry before dependency installation.
4. Verify package access with `npm view` before `npm ci`.

**Publishing note:** Publishing also requires `packages: write` in the workflow and **Write** under that package's **Manage Actions access** for the publishing repository. `npm whoami` and `npm view` confirm authentication/read access only; write access granted to a different repository or package does not transfer.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)


## Anti-Pattern-HOSTCUT-004: Committing a Generated Bundle as the Source Entry Point (🔴 CRITICAL)

**Severity:** CRITICAL

**Category:** Source/Artifact Ownership

**Violates:**
- Contract-B2C-002 — Separate B2C Source from Browser Artifacts
- Requirement REQ-B2C-011 — Preserve an editable source entry point
- Requirement REQ-B2C-012 — Generate the browser bundle under `dist/`
- Constraint CON-B2C-006 — Keep source and generated artifacts separate

**Root Cause:** The migration copied generated `dist/js/` bundles into `public/js/` (first `landing-page.js`, then `pricing.js`) to make the standalone host executable without migrating its source dependencies and build step.

**Definition:** Storing bundler runtime, inlined dependencies, and application code in the canonical `public/js/` entrypoint instead of generating that code into `dist/js/`.

**Why it's harmful:** Developers must edit generated internals, source imports disappear, dependency ownership becomes opaque, and a later build cannot prove that the deployed script came from maintainable source.

**Code examples:**

```javascript
// BAD - generated IIFE committed as public source.
(() => {
  var __defProp = Object.defineProperty;
  // thousands of lines of inlined dependencies
})();
```

```javascript
// GOOD - source entry point under public/js.
import { AnimationManager } from "@ksimonnet/utils/web/classes/modules/animation-manager.js";
```

```javascript
// GOOD - build emits every browser artifact under dist/js.
await esbuild.build({
  entryPoints: ["public/js/landing-page.js", "public/js/pricing.js"],
  bundle: true,
  format: "iife",
  outdir: "dist/js"
});
```

**Detection strategy:** No source entry point may begin with generated bundler runtime or inline `node_modules` code; each built artifact must contain no unresolved static imports. An entry point without dependencies legitimately has no imports, so import presence is not a source signal.

**Correction strategy:**
1. Restore the unbundled entrypoints and every repository-owned local dependency.
2. Declare package and bundler dependencies in `package.json` and the lockfile.
3. Bundle each entry point into its `dist/js/` counterpart during `npm run build`.
4. Run the build from a clean checkout after `npm ci`.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)

## Anti-Pattern-HOSTCUT-005: Duplicating a Package-Owned Stat-Counter Action (🔴 CRITICAL)

**Severity:** CRITICAL

**Category:** Shared Package Ownership

**Violates:**
- Contract-HOSTCUT-001 — Use the Package-Owned Stat-Counter Action
- Requirements REQ-B2B-003 and REQ-B2C-014 — Use the supported shared action
- Constraints CON-B2B-002 and CON-B2C-007 — Do not define consumer-local copies

**Root Cause:** The webapp and landing repositories each carried a separate `animateStatCounter` helper, so behavior and fixes could drift between consumers.

**Definition:** Defining or importing a consumer-local `animateStatCounter` implementation after the behavior is provided by `AnimationManager.actions.animateStatCounter` in `@ksimonnet/utils`.

**Why it's harmful:** A fix to the counter algorithm must otherwise be repeated across repositories, while consumers can silently diverge in suffix formatting, duration, or edge-case handling.

**Detection strategy:** Search consumer source for local function definitions and helper files; verify B2B and B2C dependency manifests and lockfiles resolve `@ksimonnet/utils` 2.1.0 or later.

**Correction strategy:**
1. Implement the behavior once in `AnimationManager.actions`.
2. Bump the utility package using the package release process.
3. Update and lock each consumer dependency to the published version.
4. Replace local calls with `AnimationManager.actions.animateStatCounter` and remove duplicate modules.
5. Run package tests and clean consumer builds.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)


## Anti-Pattern-HOSTCUT-006: Committing a Generated Bundle as Public Source (🔴 CRITICAL)

**Severity:** CRITICAL

**Category:** Source/Artifact Ownership

**Violates:**
- Contract-HOSTCUT-002 — Separate Sources from Deployable Bundles
- REQ-B2B-004 — Generate deployable B2B CSS under `dist/`
- CON-B2B-003 — Keep generated B2B CSS out of the committed source tree
- REQ-B2C-011/012 — Keep B2C JavaScript source separate from generated bundles

**Root Cause:** The initial dedicated-B2B repository commit (`4ff04d5`) included generated `public/css/b-to-b-bundle.css` and `public/css/tailwind.min.css`. Its later build copied `public/` and bundled only JavaScript, leaving both stylesheets as undeclared source prerequisites. The B2C migration repeated the pattern by copying generated landing CSS into `public/css/` rather than composing package CSS modules during the build. Later, both landing CI builds failed because `src/css/tailwind.css` and `tailwind.config.js` existed locally but were untracked and therefore absent from clean GitHub Actions checkouts. Earlier B2C work also copied generated JavaScript bundles into `public/js/`.

**Definition:** Keeping generated JavaScript or CSS bundles in `public/` and deploying them by copying the source tree instead of building them from editable source entry points.

**Why it's harmful:** The standalone deployment depends on opaque generated output, source changes can drift from deployed behavior, shared styles can diverge, and a clean build cannot prove that the delivered bundle was produced from maintainable inputs.

**Code examples:**

```text
# BAD - generated output is committed as public source.
public/css/b-to-b-bundle.css
public/css/tailwind.min.css
public/css/landing-page-bundle.css
public/js/landing-page.js  # generated IIFE replacing the maintained source module
```

```css
/* GOOD - maintain package CSS modules and compose them in each consumer build. */
```

```javascript
// GOOD - emit separate shared and page-specific CSS under dist/ from maintained sources.
await esbuild.build({
  stdin: {
    contents: shared_css_modules.map((module_path) => `@import "${module_path}";`).join("\n"),
    resolveDir: process.cwd(),
    loader: "css"
  },
  bundle: true,
  outfile: "dist/css/landing-page.css"
});
await esbuild.build({
  entryPoints: ["src/css/pages/b-to-b.css"],
  bundle: true,
  outfile: "dist/css/b-to-b.css"
});
```

**Detection strategy:**

```bash
cd ../likened-b2b
test ! -e public/css/b-to-b-bundle.css
test ! -e public/css/tailwind.min.css
test ! -e public/css/landing-page.css
test ! -e public/css/b-to-b.css
test -f dist/css/landing-page.css
test -f dist/css/b-to-b.css
test -f dist/css/tailwind.min.css

cd ../likened-b2c
test ! -e public/css/landing-page.css
test ! -e public/css/landing-page-bundle.css
test -f dist/css/landing-page.css
! rg -q '^\(\(\) => \{' public/js/landing-page.js public/js/pricing.js
```

Each repository build must fail if a generated bundle is reintroduced at its public source path.

**Correction strategy:**
1. Keep page-specific CSS under `src/css/pages/` and resolve shared styles from package CSS exports during each consumer build. Commit every Tailwind input/config required by that build; local untracked files are not available to CI.
2. Keep shared CSS modules in `likened-shared`; compose them in the consumer build and generate `landing-page.css` only under that consumer's `dist/css/`.
3. Keep B2C JavaScript entry points as source and emit their bundles only under `likened-b2c/dist/js/`.
4. Remove generated bundles from `public/`, ignore their old paths, and upload `dist/` through Pages.

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)
- Specification: [b-to-b-landing-page-specifications.md](../Specifications/b-to-b-landing-page-specifications.md)

---

## Anti-Pattern-HOSTCUT-007: Mobile Landing Controls Drift Between Consumers (🔴 HIGH)

**Severity:** HIGH

**Category:** Responsive parity — shared CSS is consumed with different page modifiers or a losing cascade rule.

**Root Cause:** B2B used `header-nav-container--compact`, while B2C omitted it, so B2C displayed its full navigation on mobile. Separately, `.hero .button-link` had greater specificity than the generic `.button-link--tertiary` rule, causing the B2C discovery CTA to keep the hero's white fill. A passing build did not expose either visual regression.

**Definition:** Landing consumers use the shared mobile header and hero CTA styles inconsistently, or a contextual selector overrides a generic button variant.

**Why it's harmful:**
- Mobile navigation becomes crowded even though the shared package provides a compact variant.
- Hero CTAs lose their intended visual distinction while source declarations appear correct in isolation.
- Build success gives false confidence because selector precedence and viewport behavior are runtime concerns.

**Detection strategy:** Compare built B2B and B2C pages at 390px and 430px CSS viewport widths. Check computed nav visibility, button direction/width/background, and document overflow. Rebuild first and cache-bust CSS when a preview disagrees with source.

**Correction strategy:**
1. Apply `header-nav-container--compact` on standalone landing pages that need compact mobile navigation.
2. Add a contextual hero modifier rule when a generic button variant is overridden by the hero base selector.
3. Verify the built pages in a browser; do not add a bespoke regex build validator for visual behavior.

**Reference:** [Contract-B2C-003](../contracts/host-migration-cloudflare-redirect-contracts.md)
