---
goal: "Serve the B2C landing journey from b2c.likened.net while preserving the webapp application host"
version: 1.0
date_created: 2026-09-22
status: "Planned"
tags: ["migration", "routing", "github-pages", "b2c"]
---

# Specifications: B2C Canonical Host Migration

## Overview

**Context:** The B2C landing page currently declares `https://b2c.likened.net/` as canonical, but that host returns HTTP 404. The B2C migration establishes a deployable B2C marketing host without relocating the product application.

**User-Facing Capability:**
- Visitors can open the B2C landing page at `https://b2c.likened.net/`.
- B2C product-entry links open the existing application at `https://likened.net/app/#/dashboard`.

**Scope Constraint:** This migration does not change B2B hosting, Cloudflare's B2B redirect, or application behavior under `/app/`.

Trigger justification: The migration introduces a new public B2C host and changes where visitors access the B2C landing journey.

---

## 1. Requirements

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

---

## 2. Constraints

### Hard Constraints

- **CON-B2C-001:** The B2C Pages site MUST NOT host, proxy, or replace `https://likened.net/app/`.
- **CON-B2C-002:** The existing B2B canonical host and the Cloudflare legacy B2B redirect contract MUST remain unchanged.
- **CON-B2C-003:** The B2C Pages artifact MUST be buildable from sources and dependencies available to its own deployment workflow.
- **CON-B2C-004:** Private package access, when required, MUST be authorized before package installation; a failed package install MUST fail deployment before artifact upload.

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

---

## 8. Related Artifacts & Traceability

### Derivation Chain
- Ubiquitous Language: [cloudflare-legacy-b2b-redirect-ul.md](../ubiquitous-language/cloudflare-legacy-b2b-redirect-ul.md)
- Contracts: [cloudflare-legacy-b2b-redirect-contracts.md](../contracts/cloudflare-legacy-b2b-redirect-contracts.md)
- Implementation Plan: [cloudflare-legacy-b2b-redirect-implementation-plan.md](../implementation-plans/cloudflare-legacy-b2b-redirect-implementation-plan.md)

### Identifier Mapping
- Requirements: `REQ-B2C-*`
- Constraints: `CON-B2C-*`
- Acceptance: `AC-B2C-*`
- Locked Decisions: `LOCK-B2C-*`
- Risks: `RISK-B2C-*`
- Assumptions: `ASSUMPTION-B2C-*`
- Goals: `GOAL-B2C-*`
