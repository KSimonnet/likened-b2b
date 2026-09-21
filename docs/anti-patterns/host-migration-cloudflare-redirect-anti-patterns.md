# Host Migration Anti-Patterns

Trigger justification: Contract-B2C-001 and constraints CON-B2C-003 and CON-B2C-004 were violated during the B2B Pages migration when GitHub Pages served raw source with unresolved imports and the deployment workflow could not obtain its required build dependencies.

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
# BAD - ships raw source with unresolved imports.
- uses: actions/upload-pages-artifact@v3
  with:
    path: public
```

```yaml
# GOOD - builds and publishes the self-contained artifact.
- run: npm run build
- uses: actions/upload-pages-artifact@v3
  with:
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

**Reference:**
- Contract: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)
