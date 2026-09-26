---
goal: "Preserve canonical B2B routing and independently build the B2C landing host"
version: 1.2
date_created: 2026-09-22
last_updated: 2026-09-26
status: "Active"
tags: ["migration", "routing", "github-pages", "b2c"]
---

# Specifications: Canonical Landing Host Migration

## Overview

**Context:** Cloudflare routes legacy B2B requests to the dedicated B2B Pages site. The B2C migration establishes a separately deployable marketing host without relocating the product application. The initial B2C migration copied a generated JavaScript bundle into `public/js/landing-page.js`; remediation must restore an editable source entry point and generate the browser bundle only in `dist/`.

**User-Facing Capability:**
- Visitors can open the B2C landing page at `https://b2c.likened.net/`.
- B2C product-entry links open the existing application at `https://likened.net/app/#/dashboard`.

**Scope Constraint:** This migration does not change B2B hosting, Cloudflare's B2B redirect, or application behavior under `/app/`.

Trigger justification: The migration introduces a new public B2C host and changes where visitors access the B2C landing journey.

---

## 1. Requirements

### Legacy B2B Routing

- **REQ-ROUT-001:** Cloudflare MUST match requests whose host is `likened.net` and whose path begins with `/b-to-b`.
- **REQ-ROUT-002:** Every matched Legacy B2B URL MUST redirect with HTTP 301 to exactly `https://b2b.likened.net/`, without preserving the source path suffix.
- **REQ-ROUT-003:** The redirect MUST discard the incoming query string.
- **REQ-ROUT-004:** The rule MUST execute as a terminating Cloudflare Single Redirect before origin routing.

### Canonical B2B Host

- **REQ-B2B-001:** The dedicated B2B repository MUST build and deploy a self-contained Pages artifact to `https://b2b.likened.net/`.
- **REQ-B2B-002:** Every B2B application-entry link MUST target `https://likened.net/app/#/dashboard`.
- **REQ-B2B-003:** `likened-b2b` MUST declare and lock `@ksimonnet/utils@^2.1.0` or later and use `AnimationManager.actions.animateStatCounter` for stat-counter animation.

### Canonical B2C Host

- **REQ-B2C-001:** `https://b2c.likened.net/` MUST return a successful HTTP response containing the B2C landing page.
- **REQ-B2C-002:** `https://b2c.likened.net/pricing.html` MUST return a successful HTTP response containing the B2C pricing page.
- **REQ-B2C-003:** B2C landing and pricing pages MUST declare canonical URLs on `b2c.likened.net`.
- **REQ-B2C-004:** The B2C Pages artifact MUST include every B2C asset required to render landing and pricing pages without requesting files from an unavailable local or sibling-repository path.

### Cross-Host Navigation

- **REQ-B2C-005:** Every B2C application-entry link MUST target `https://likened.net/app/#/dashboard`.
- **REQ-B2C-006:** Every B2C informational link to the B2B marketing journey MUST target `https://b2b.likened.net/` or its corresponding canonical B2B page.
- **REQ-B2C-007:** B2C pages MUST NOT use a relative application path that resolves to `b2c.likened.net/app/`.

### Deployment Behavior

- **REQ-B2C-008:** The B2C Pages deployment MUST publish a built, self-contained artifact rather than unbundled source that contains unresolved browser imports.
- **REQ-B2C-009:** Every browser-delivered B2C JavaScript asset with module dependencies MUST be bundled or otherwise resolve all imports in the deployed artifact.
- **REQ-B2C-010:** The B2C Pages workflow MUST support a manual deployment trigger.
- **REQ-B2C-011:** `likened-b2c/public/js/landing-page.js` MUST remain the editable, unbundled source entry point and MUST NOT contain generated bundler runtime or inlined third-party modules.
- **REQ-B2C-012:** `npm run build` MUST bundle the B2C landing source into `dist/js/landing-page.js`; the generated bundle MUST contain no unresolved static import declarations.
- **REQ-B2C-013:** The B2C Pages workflow MUST run `npm ci` before `npm run build` so a clean runner uses the committed lockfile and declared dependencies.
- **REQ-B2C-014:** `likened-b2c` MUST declare and lock `@ksimonnet/utils@^2.1.0` or later and use `AnimationManager.actions.animateStatCounter` for stat-counter animation.

---

## 2. Constraints

### Hard Constraints

- **CON-ROUT-001:** The Legacy B2B redirect destination MUST be the fixed canonical URL `https://b2b.likened.net/`; request-controlled hosts, paths, and queries MUST NOT influence it.
- **CON-B2B-001:** The B2B Pages site MUST NOT host, proxy, or replace the Webapp Application Route.
- **CON-B2B-002:** The B2B landing source MUST NOT define a local stat-counter animation when that behavior is provided by `@ksimonnet/utils`.
- **CON-B2C-001:** The B2C Pages site MUST NOT host, proxy, or replace `https://likened.net/app/`.
- **CON-B2C-002:** The existing B2B canonical host and the Cloudflare legacy B2B redirect contract MUST remain unchanged.
- **CON-B2C-003:** The B2C Pages artifact MUST be buildable from sources and dependencies available to its own deployment workflow.
- **CON-B2C-004:** Private package access, when required, MUST be authorized before package installation; a failed package install MUST fail deployment before artifact upload.
- **CON-B2C-006:** Source and generated artifacts MUST remain separate: editable JavaScript belongs under `public/js/`, generated browser bundles belong under `dist/js/`, and `dist/` MUST remain ignored.
- **CON-B2C-007:** The B2C landing source MUST NOT define or ship a local stat-counter animation when that behavior is provided by `@ksimonnet/utils`.

### Soft Constraints

- **CON-B2C-005:** The B2C deployment SHOULD use the same Pages workflow shape as the verified B2B deployment: checkout, package authentication, install, build, configure Pages, upload `dist`, and deploy.

**Distinction:** Host ownership and independently reproducible artifacts are public routing invariants. Workflow structure is refactorable provided the observable deployment behavior remains unchanged.

---

## 3. Scope Boundaries

### In Scope
- B2C landing and pricing host availability.
- B2C Pages artifact and custom-domain deployment behavior.
- B2C canonical metadata and cross-host links.

### Out of Scope
- Product application behavior, authentication, and data access under `/app/`.
- B2B page content, its custom domain, and legacy B2B Cloudflare redirect behavior.
- Supabase schema, credentials, and runtime data behavior.

### Affected Files

| File | Change | Impact |
| --- | --- | --- |
| B2C deployment repository workflow | Deploy B2C `dist` to GitHub Pages | Makes canonical B2C host available |
| B2C landing and pricing HTML | Use canonical B2C and absolute cross-host links | Preserves navigation ownership |
| B2C build configuration | Emit self-contained CSS, JavaScript, and assets | Prevents Pages runtime 404 and import failures |
| B2C landing source entry point | Preserve editable module imports and landing behavior | Prevents generated code from becoming the maintenance surface |
| Shared stat-counter package dependency | Resolve the package API version containing the shared action | Prevents missing-action runtime failures and duplicated implementations |

---

## 4. Locked Decisions

| Decision | Rationale |
| --- | --- |
| **LOCK-B2C-001:** Canonical B2C host is `https://b2c.likened.net/`. | Existing B2C metadata and hostname validation define this public destination. |
| **LOCK-B2C-002:** Product application host remains `https://likened.net/app/`. | B2C Pages is marketing-only and must not duplicate application routing. |
| **LOCK-B2C-003:** B2B remains independently hosted at `https://b2b.likened.net/`. | B2B deployment is complete and its legacy redirect is a separate public contract. |

---

## 5. Risks & Assumptions

| Item | Level | Description | Mitigation |
| --- | --- | --- | --- |
| **RISK-B2C-001:** Pages artifact is missing an entrypoint or asset. | High | DNS can validate while the custom domain returns HTTP 404. | Verify deployment completion and HTTP 200 for root and pricing URLs. |
| **RISK-B2C-002:** Browser receives raw imports. | High | Raw source can reference packages or paths unavailable on Pages. | Build and inspect deployed JavaScript for unresolved imports. |
| **RISK-B2C-003:** Package token lacks `read:packages`. | High | `npm ci` returns HTTP 403 and deployment never reaches upload. | Authorize the deployment repository for every private package and validate access before install. |
| **RISK-B2C-004:** Generated bundle is committed as source. | High | Source review, imports, and focused edits become impractical; rebuilding can overwrite the only editable implementation. | Require the source/artifact boundary and validate both sides after a clean build. |
| **ASSUMPTION-B2C-001:** GitHub Pages and DNS administration are available. | Medium | B2C custom-domain binding requires external configuration. | Confirm Pages Source is GitHub Actions and complete DNS check before release. |

---

## 6. End Goals

- **GOAL-B2C-001:** B2C visitors reach landing content from `b2c.likened.net` without a 404.
- **GOAL-B2C-002:** Product-entry navigation continues to reach the unchanged web application host.
- **GOAL-B2C-003:** B2C, B2B, and application ownership boundaries are independently deployable and verifiable.

---

## 7. Acceptance Criteria

- **AC-B2C-001:** `https://b2c.likened.net/` and `https://b2c.likened.net/pricing.html` return successful HTTP responses after deployment.
- **AC-B2C-002:** The deployed B2C landing artifact has no unresolved browser imports.
- **AC-B2C-003:** Product-entry links from B2C resolve to `https://likened.net/app/#/dashboard`.
- **AC-B2C-004:** `https://b2b.likened.net/` and legacy `https://likened.net/b-to-b/` behavior remain unchanged.
- **AC-B2C-005:** `public/js/landing-page.js` contains source imports, while a clean build creates `dist/js/landing-page.js` with no unresolved static imports.
- **AC-B2C-006:** A clean checkout can run `npm ci && npm run build` without files from a sibling repository.
- **AC-B2C-007:** B2B and B2C lockfiles resolve `@ksimonnet/utils` 2.1.0 or later, and both clean builds invoke the package-owned stat-counter action successfully.

---

## 8. Related Artifacts & Traceability

### Derivation Chain
- Feature Brief: [cloudflare-legacy-b2b-redirect-feature-brief.md](../feature-briefs/cloudflare-legacy-b2b-redirect-feature-brief.md)
- Ubiquitous Language: [host-migration-cloudflare-redirect-ul.md](../ubiquitous-language/host-migration-cloudflare-redirect-ul.md)
- Contracts: [host-migration-cloudflare-redirect-contracts.md](../contracts/host-migration-cloudflare-redirect-contracts.md)
- Anti-Patterns: [host-migration-cloudflare-redirect-anti-patterns.md](../anti-patterns/host-migration-cloudflare-redirect-anti-patterns.md)
- Implementation Plan: [host-migration-cloudflare-redirect-implementation-plan.md](../implementation-plans/host-migration-cloudflare-redirect-implementation-plan.md)

### Identifier Mapping
- Requirements: `REQ-B2C-*`
- Routing requirements: `REQ-ROUT-*`
- Constraints: `CON-B2C-*`
- Routing constraints: `CON-ROUT-*`
- Acceptance: `AC-B2C-*`
- Locked Decisions: `LOCK-B2C-*`
- Risks: `RISK-B2C-*`
- Assumptions: `ASSUMPTION-B2C-*`
- Goals: `GOAL-B2C-*`
