---
plan_id: PLAN-HOSTCUT-001
goal: Deploy B2B as a dedicated GitHub Pages site while preserving the webapp and legacy-route compatibility
purpose: infrastructure
component: host-routing
version: 1.2
date_created: 2026-09-19
last_updated: 2026-09-22
owner: Webapp Platform
status: in-progress
status_badge_label: In Progress
supersedes: null
superseded_by: null
tags: [migration, dns, routing, github-pages, landing-page]
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan deploys the B2B landing page from the dedicated `KSimonnet/likened-b2b` repository to GitHub Pages, while `KSimonnet/likened-webapp` continues to own the web application at `https://likened.net/app/`.

## Human-Readable Overview

This plan changes B2B build ownership, GitHub Pages deployment, static routing, and compatibility redirects. It does not relocate or modify the product application flows, business logic, or Supabase integration.

- Scope: an isolated B2B build pipeline, GitHub Actions Pages deployment, canonical metadata, and legacy path continuity.
- Non-goals: relocation of `likened-webapp/public/app`, redesign of page content, app route changes under `/app`, or auth/data-layer changes.
- Success signal: `b2b.likened.net` serves a built B2B page, B2B CTAs reach `https://likened.net/app/#/dashboard`, and legacy links continue to work.

## 0. Context Snapshot

**Derivation flow:** Feature Brief → Specifications → UL → ADRs → Contracts → Anti-Patterns → **this plan** → Tests → Implementation

**Scope:** Implement a dedicated B2B GitHub Pages deployment at `b2b.likened.net`, preserve the existing webapp deployment at `likened.net`, and retain legacy `/b-to-b` compatibility redirects.

**Files affected:**
- `../likened-b2b/scripts/build.js` — build B2B HTML, assets, CSS, and JavaScript into an isolated `dist/` artifact.
- `../likened-b2b/.github/workflows/deploy-pages.yml` — build and deploy the B2B `dist/` artifact with GitHub Actions Pages.
- `../likened-b2b/index.html` — use absolute webapp targets for application entry links.
- `../likened-b2b/js/b-to-b.js` — import only browser-resolvable local modules that the B2B build bundles.
- `scripts/build.js` — retain only apex, B2C, and legacy B2B compatibility routing.
- `public/routing/apex-to-b2b-redirect.html` — static apex redirect document to canonical B2B host.
- `public/routing/legacy-b-to-b-to-b2b-redirect.html` — compatibility redirect for legacy B2B root path.
- `public/routing/legacy-b-to-b-pricing-to-b2b-redirect.html` — compatibility redirect for legacy B2B pricing path.
- `public/index.html` — set canonical host metadata and reciprocal cross-link target to B2B host.
- `public/pricing.html` — set canonical host metadata for B2C pricing page.
- `public/b-to-b/index.html` — set canonical host metadata for B2B landing page.
- `public/b-to-b/pricing.html` — set canonical host metadata for B2B pricing page.

**Locked decisions:**
- Canonical B2B host is `https://b2b.likened.net/`.
- Canonical B2C host is `https://b2c.likened.net/` (retained by symmetry).
- `KSimonnet/likened-b2b` owns the B2B Pages artifact and custom domain binding.
- `KSimonnet/likened-webapp` continues to own `https://likened.net/app/`; it is not relocated or copied into the B2B repository.
- Legacy `https://likened.net/b-to-b/` must continue to resolve through compatibility redirect.
- B2B application-entry links use `https://likened.net/app/#/dashboard`, not relative `../app/` paths.

**Open questions resolved:**
- Subdomain naming resolved to short form (`b2b` and `b2c`) for campaign and typing efficiency.
- Migration strategy resolved to no folder shuffling at source; remapping is handled at build output and host routing layers.

---

## 1. Source Traceability

| Trace ID | Artifact Type | Source ID | Source Path | Notes |
| --- | --- | --- | --- | --- |
| TRACE-001 | specification | REQ-BUILD-001 | docs/specifications/b-to-b-landing-page-specifications.md | Build output copy behavior must stay explicit and deterministic. |
| TRACE-002 | specification | REQ-BTB-085 | docs/specifications/b-to-b-landing-page-specifications.md | B2B informational cross-journey linking must remain valid and intentional. |
| TRACE-003 | specification | REQ-PR-008 | docs/specifications/landing-page-and-pricing-specifications.md | B2C pages must preserve valid B2B redirect/callout path behavior. |
| TRACE-004 | specification | CON-LP-001 | docs/specifications/landing-page-and-pricing-specifications.md | Changes must remain additive and avoid unrelated page behavior drift. |
| TRACE-005 | adr | ADR-STYLE-004 | docs/architecture/styling-principles-adr.md | CSS architecture remains centralized and not bypassed during host split. |
| TRACE-006 | contract | Contract-CSS-011 | docs/contracts/styling-principles-contracts.md | No inline style behavior is introduced while adding metadata/routing pages. |
| TRACE-007 | anti-pattern | Anti-Pattern-STYLE-003 | docs/anti-patterns/styling-principles-anti-patterns.md | Prevent cross-page bundle composition drift while remapping outputs. |

## 2. Requirements & Constraints (Execution-Scoped)

- **REQ-001**: Apex output path `dist/index.html` must resolve as a redirect entrypoint to canonical B2B host.
- **REQ-002**: The `likened-b2b` workflow must build and deploy a self-contained B2B Pages artifact to `b2b.likened.net`.
- **REQ-003**: Legacy compatibility paths under `/b-to-b/` must resolve through redirect pages.
- **REQ-004**: Every B2B application-entry link must target `https://likened.net/app/#/dashboard`.
- **SEC-001**: Redirect pages must not include dynamic user-controlled inputs.
- **OPS-001**: Build must remain green using existing command `npm run build`.
- **CON-001**: No app routing changes under `/app/#/dashboard`.
- **CON-002**: No modifications to Supabase credentials, auth flow, or runtime data paths.
- **GUD-001**: Do not relocate the webapp or its `/app` route into `likened-b2b`.
- **PAT-001**: Use an esbuild-based B2B build so package and local-module imports resolve before browser delivery.

## 3. Implementation Steps (TDD Workflow)

### Implementation Phase 1

- **PHASE-HOSTCUT-001 Goal:** Emit deterministic B2B fallback pages while Cloudflare owns the terminating legacy-path redirect.
- **Preconditions:** Cloudflare Single Redirect is configured for Legacy B2B URLs; `scripts/build.js` copy pipeline is operational.
- **Completion Criteria:** Build emits `/b-to-b` fallback pages without client-side redirect logic, and Cloudflare redirects matching public requests to the canonical B2B landing URL.
- **Verification Commands:** `npm run build`; `test -f dist/b-to-b/index.html`; `! rg -q "window\.location\.replace|http-equiv=\"refresh\"" dist/b-to-b`.

Human checklist:

| Task | Description | Status | Date |
| --- | --- | --- | --- |
| TASK-HOSTCUT-001 | Remap build copy targets for apex/canonical/legacy outputs | [x] | 2026-09-19 |
| TASK-HOSTCUT-002 | Verify Pages emits non-redirect `/b-to-b` fallback pages while Cloudflare owns legacy redirects | [x] | 2026-09-22 |

Machine task table:

| Task ID | Description | target_path | target_symbol | operation | dependencies | source_spec_ids | status | blocked_reason | validation_command | expected_result | rollback_step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-HOSTCUT-001 | Update copy mapping to emit apex, canonical host, and `/b-to-b` fallback outputs | ../../likened-webapp/scripts/build.js | copyPublicFiles | update | none | REQ-ROUT-001, REQ-ROUT-002 | completed | null | npm run build | Build completes and dist contains the expected B2B fallback paths | Revert the copy mapping and rebuild |
| TASK-HOSTCUT-002 | Verify `/b-to-b` outputs contain B2B content rather than a client-side redirect | ../../likened-webapp/scripts/build.js; Cloudflare Single Redirect | copyPublicFiles; `http_request_dynamic_redirect` | verify | TASK-HOSTCUT-001 | REQ-ROUT-002, REQ-ROUT-004, Contract-ROUT-001 | completed | null | npm run build && test -f dist/b-to-b/index.html && ! rg -q "window\.location\.replace|http-equiv=\"refresh\"" dist/b-to-b && curl -sS -D - -o /dev/null 'https://likened.net/b-to-b/pricing?campaign=legacy' | Pages fallback pages exist; production response is HTTP 301 with `Location: https://b2b.likened.net/` | Disable the Cloudflare rule only to restore origin fallback behavior; do not add client-side redirect logic |

### Implementation Phase 2

- **PHASE-HOSTCUT-002 Goal:** Enforce canonical metadata and cross-host reciprocal link integrity.
- **Preconditions:** Phase 1 completed with successful build and expected dist structure.
- **Completion Criteria:** Canonical links exist on all relevant B2B/B2C pages and reciprocal CTA route targets canonical hostnames.
- **Verification Commands:** `npm run build`; `rg "rel=\"canonical\"|b2b\.likened\.net|b2c\.likened\.net" public/**/*.html`.

Human checklist:

| Task | Description | Status | Date |
| --- | --- | --- | --- |
| TASK-HOSTCUT-003 | Add canonical tags to B2B and B2C root/pricing pages | [x] | 2026-09-19 |
| TASK-HOSTCUT-004 | Update B2C reciprocal CTA to canonical B2B host | [x] | 2026-09-19 |

Machine task table:

| Task ID | Description | target_path | target_symbol | operation | dependencies | source_spec_ids | status | blocked_reason | validation_command | expected_result | rollback_step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-HOSTCUT-003 | Add canonical host metadata to root and pricing pages for both journeys | public/index.html; public/pricing.html; public/b-to-b/index.html; public/b-to-b/pricing.html | `<head>` canonical link | update | TASK-HOSTCUT-002 | REQ-BTB-085, REQ-PR-008, Contract-CSS-011 | completed | null | npm run build && rg "rel=\"canonical\"" public/index.html public/pricing.html public/b-to-b/index.html public/b-to-b/pricing.html | Canonical tags present and build remains green | Revert canonical link additions and rebuild |
| TASK-HOSTCUT-004 | Update B2C reciprocal CTA to point to canonical B2B host URL | public/index.html | `#b2b-callout .reciprocal-redirect a` | update | TASK-HOSTCUT-003 | REQ-PR-008, REQ-BTB-085 | completed | null | rg "https://b2b\.likened\.net/" public/index.html | Reciprocal link resolves to canonical B2B host | Restore previous href to legacy path and rebuild |

### Implementation Phase 3

- **PHASE-HOSTCUT-003 Goal:** Establish the B2B repository build and deploy it as an independent GitHub Pages site.
- **Preconditions:** The B2B source and assets are present in `likened-b2b`; GitHub Pages is configured to use GitHub Actions.
- **Completion Criteria:** `likened-b2b` builds a self-contained `dist/` artifact, deploys it with GitHub Actions, and B2B CTA links reach the unchanged webapp host.
- **Verification Commands:** `npm run build`; `rg "https://likened\.net/app/#/dashboard" index.html`; GitHub Actions Pages deployment status.

Human checklist:

| Task | Description | Status | Date |
| --- | --- | --- | --- |
| TASK-HOSTCUT-005 | Add B2B esbuild build inputs and local module dependencies | [x] | 2026-09-21 |
| TASK-HOSTCUT-006 | Add B2B GitHub Actions Pages workflow and custom-domain deployment | [x] | 2026-09-21 |
| TASK-HOSTCUT-007 | Validate deployed B2B links to the unchanged webapp application route | [x] | 2026-09-21 |

Machine task table:

| Task ID | Description | target_path | target_symbol | operation | dependencies | source_spec_ids | status | blocked_reason | validation_command | expected_result | rollback_step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-HOSTCUT-005 | Add B2B esbuild entry configuration and include imported helper modules in the B2B source tree | ../likened-b2b/package.json; ../likened-b2b/scripts/build.js; ../likened-b2b/public/js | build | update | TASK-HOSTCUT-004 | REQ-002, PAT-001 | completed | null | npm run build && ! rg "^import " dist/js/b-to-b.js | Build exits 0 and `dist/js/b-to-b.js` contains no unresolved browser imports | Restore standalone static-copy build and local helper layout |
| TASK-HOSTCUT-006 | Deploy B2B `dist/` through GitHub Actions Pages with `b2b.likened.net` as its custom domain | ../likened-b2b/.github/workflows/deploy-pages.yml; ../likened-b2b/CNAME | GitHub Pages workflow | create | TASK-HOSTCUT-005 | REQ-002 | completed | null | GitHub Actions deployment status and `curl -sS -o /dev/null -w "%{http_code}" https://b2b.likened.net/` | Pages deployment succeeds and B2B returns HTTP 200 | Disable workflow and restore previous Pages source |
| TASK-HOSTCUT-007 | Convert B2B application-entry links to the preserved webapp URL and validate production navigation | ../likened-b2b/public/index.html; ../likened-b2b/public/pricing.html | application-entry anchors | update | TASK-HOSTCUT-006 | REQ-004, CON-001 | completed | null | rg "https://likened\.net/app/#/dashboard" public/index.html public/pricing.html | Every application-entry link opens the existing webapp | Restore prior link targets |

### Implementation Phase 4 — B2C Replication Runbook

- **PHASE-HOSTCUT-004 Goal:** Publish `likened-webapp/public/index.html` and its B2C companion pages as an independent GitHub Pages site at `b2c.likened.net` without changing the product application at `likened.net/app/`.
- **Current baseline (2026-09-22):** `b2b.likened.net` returns HTTP 200; `b2c.likened.net` returns HTTP 404; the Cloudflare legacy B2B redirect returns HTTP 301 to `https://b2b.likened.net/`.
- **Precondition:** Create or designate a dedicated `KSimonnet/likened-b2c` repository and keep `likened-webapp` as the source of truth until the B2C artifact is independently reproducible.

1. Copy the B2C landing source, pricing page, referenced `assets/`, vendor scripts, and the final B2C CSS bundle into `likened-b2c/public/`. Keep its `CNAME` file at repository root with only `b2c.likened.net`.
2. Make every B2C landing link host-correct. Links to the product remain `https://likened.net/app/...`; links to the B2B journey use `https://b2b.likened.net/`; do not retain relative links that resolve against the new B2C host incorrectly.
3. Build `dist/` from the B2C repository's committed sources. The Pages workflow must upload `dist/`, never a source folder that bypasses generated CSS or JavaScript.
4. Bundle every browser entrypoint that has `import` statements with esbuild as an IIFE or ESM bundle before it reaches `dist/`. Do not ship raw source containing bare package specifiers or imports into absent sibling directories.
5. Keep CI self-contained. Do not check out another private repository merely to build a Pages artifact. If a package is needed, declare it, lock it, and configure GitHub Packages authentication.
6. For private GitHub Packages, use one authentication model consistently: either grant the workflow `GITHUB_TOKEN` package read access through the package's **Manage Actions access** settings, or use an Actions secret named `NODE_AUTH_TOKEN` containing a classic PAT with `read:packages` and `repo`. Add a fail-fast `npm view <package> version --registry=https://npm.pkg.github.com` check before `npm ci`.
7. Add a GitHub Actions Pages workflow with `contents: read`, `pages: write`, `id-token: write`, and `packages: read` when package installation is required. Include `workflow_dispatch` for recovery deployments. Use `actions/checkout@v5` to avoid Node 20 action-runtime deprecation warnings.
8. Set the repository Pages Source to **GitHub Actions**, add `b2c.likened.net` as its custom domain, and complete DNS verification. A successful DNS check alone is insufficient: verify a completed Pages deployment and HTTP 200 response.
9. Validate before cutover and after every deployment:
	```bash
	npm ci
	npm run build
	! rg "^import " dist/js
	curl -sS -o /dev/null -w "b2c=%{http_code}\n" https://b2c.likened.net/
	curl -sS -o /dev/null -w "app=%{http_code}\n" https://likened.net/app/
	```

| Task | Description | Status | Validation |
| --- | --- | --- | --- |
| TASK-HOSTCUT-008 | Create isolated B2C source and build artifact | [ ] | `npm run build` creates B2C `dist/index.html` |
| TASK-HOSTCUT-009 | Bundle all B2C browser entrypoints | [ ] | No unresolved imports in deployed JavaScript |
| TASK-HOSTCUT-010 | Configure B2C Pages workflow, package access, CNAME, and DNS | [ ] | Pages deployment succeeds and `b2c.likened.net` returns HTTP 200 |
| TASK-HOSTCUT-011 | Validate cross-host B2C, B2B, and app links | [ ] | Manual smoke checks resolve each link to its owning host |

### Deployment Lessons

- A GitHub Pages custom-domain DNS check does not deploy a site. A 404 after successful DNS means verify Pages Source, workflow execution, uploaded artifact, and root `index.html`.
- `rel="canonical"` metadata does not redirect local previews or production browsers; HTTP redirects must be implemented at Cloudflare or the serving layer.
- `http-server -o` opens the local preview browser. Keep `npm run serve` simple; a custom server wrapper was unnecessary and caused avoidable debugging churn.
- Do not assume cache freshness when checking generated CSS. Rebuild `dist/`, use no-cache preview settings where possible, or cache-bust the asset URL during verification.
- Keep deployable artifacts self-contained. Copy or generate all CSS, local assets, and bundled JavaScript from files available in the deployment repository.

## 4. Alternatives

- **ALT-001**: Keep content duplicated at apex and canonical hosts; rejected because it introduces duplicate-index risk and canonical ambiguity.
- **ALT-002**: Move source folders to make B2B physically root; rejected because it increases churn and merge risk without routing benefit.
- **ALT-003**: Keep long-form hostnames `b-to-b` and `b-to-c`; rejected due to higher campaign typo risk and lower memorability.

## 5. Dependency Inventory

### Already Available

- ✅ `../likened-webapp/public/app/` — existing application deployment target, retained at `https://likened.net/app/`.
- ✅ `../likened-webapp/.github/workflows/ci-cd-wepapp.yml` — reference workflow for the Pages artifact pattern; it must not deploy the B2B repository.
- ✅ `../likened-b2b` — dedicated B2B source repository and GitHub Pages custom-domain target.

### Not Required (Deprecated / Removed)

- ❌ Directory shuffling of public source folders — not required because build output remapping handles host-route split.

### New Dependencies

- ⭐ `../likened-b2b/.github/workflows/deploy-pages.yml` — B2B-specific GitHub Actions Pages workflow.
- ⭐ B2B-local implementations or source modules for every B2B JavaScript import — required so esbuild can resolve imports before browser delivery.

## 6. Files Affected

- **FILE-HOSTCUT-001**: `../likened-b2b/package.json` — defines the B2B build and verification commands.
- **FILE-HOSTCUT-002**: `../likened-b2b/scripts/build.js` — emits the deployable B2B `dist/` artifact.
- **FILE-HOSTCUT-003**: `../likened-b2b/.github/workflows/deploy-pages.yml` — builds and deploys the B2B Pages artifact.
- **FILE-HOSTCUT-004**: `../likened-b2b/index.html` — B2B landing page with absolute application-entry links.
- **FILE-HOSTCUT-005**: `../likened-b2b/js/b-to-b.js` — B2B entry point compiled by the B2B build.
- **FILE-HOSTCUT-006**: `scripts/build.js` — retains apex, B2C, and compatibility-path output behavior.

## 7. Testing

**TDD Workflow:**
1. Write failing tests (RED) — before implementation
2. Implement code to pass tests (GREEN)
3. Refactor while maintaining GREEN
4. Run full suite: `npm test` — verify no regressions

| Test ID | Test Type | Source IDs Covered | Command | Pass Criteria |
| --- | --- | --- | --- | --- |
| TEST-HOSTCUT-001 | build | REQ-002, PAT-001 | `cd ../likened-b2b && npm run build` | Build exits 0 and creates the B2B `dist/` artifact with a bundled B2B JavaScript entry point |
| TEST-HOSTCUT-002 | static-content | REQ-004, CON-001 | `rg "https://likened\.net/app/#/dashboard" ../likened-b2b/index.html ../likened-b2b/pricing.html` | B2B application-entry links target the unchanged webapp host |
| TEST-HOSTCUT-003 | static-content | REQ-002 | `rg "@ksimonnet/|^import " ../likened-b2b/dist/js/b-to-b.js` | No unresolved package or source import remains in browser-delivered B2B JavaScript |
| TEST-HOSTCUT-004 | deployment-smoke | REQ-002, REQ-004 | Manual URL checks in production | `b2b.likened.net` renders the B2B page and application-entry links open `likened.net/app/#/dashboard` |

## 8. Risks & Assumptions

| ID | Type | Description | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-HOSTCUT-001 | risk | Browser receives unresolved B2B import specifiers | High | Bundle B2B entry points in its own build and maintain imports as B2B-local or package-resolvable build inputs |
| RISK-HOSTCUT-002 | risk | B2B links to a relative `/app` path resolve on the B2B host | High | Use the absolute webapp URL for all B2B application-entry links |
| RISK-HOSTCUT-003 | risk | GitHub Pages permits only one custom domain per Pages site | Medium | Assign `b2b.likened.net` only to the dedicated B2B repository; retain `likened.net` on the webapp repository |
| ASSUMPTION-HOSTCUT-001 | assumption | DNS provider and Pages admin access are available during cutover window | Medium | Validate access in pre-cutover checklist before scheduling deployment |
| ASSUMPTION-HOSTCUT-002 | assumption | Existing CTA app route `/app/#/dashboard` remains unchanged | Low | Keep app links untouched and verify post-deploy smoke checks |

## 9. Acceptance Criteria

- [x] `likened-b2b` builds B2B JavaScript without unresolved browser imports.
- [x] `likened-b2b` Pages Source is GitHub Actions and deploys its `dist/` artifact.
- [x] `b2b.likened.net` is bound only to `likened-b2b` GitHub Pages.
- [x] B2B application-entry links open `https://likened.net/app/#/dashboard`.
- [x] The webapp remains deployed independently at `https://likened.net/app/`.
- [x] Production B2B page and app-entry navigation pass manual smoke testing.
- [ ] `b2c.likened.net` is deployed through an independent self-contained Pages artifact.

## 10. Change Log

| Date | Version | Change |
| --- | --- | --- |
| 2026-09-19 | 1.0 | Initial template-compliant rewrite of hostname cutover implementation plan |
| 2026-09-19 | 1.0 | Marked completed tasks for implemented build remap, redirects, canonical tags, and reciprocal link updates |
| 2026-09-21 | 1.1 | Reframed B2B deployment as an independent GitHub Pages build while preserving the webapp application host |
| 2026-09-22 | 1.2 | Recorded completed B2B migration and added the B2C replication runbook, Pages deployment checks, package-auth guidance, and failure lessons |

## 11. References

### Specifications
- [docs/specifications/b-to-b-landing-page-specifications.md](../specifications/b-to-b-landing-page-specifications.md) — source of B2B build and cross-linking requirements
- [docs/specifications/landing-page-and-pricing-specifications.md](../specifications/landing-page-and-pricing-specifications.md) — source of B2C reciprocal redirect behavior and additive constraints

### Ubiquitous Language
- [docs/ubiquitous-language/registry-ul-term-ownership.md](../ubiquitous-language/registry-ul-term-ownership.md) — naming consistency reference for journey and host terms

### Architecture Decisions
- [docs/architecture/styling-principles-adr.md](../architecture/styling-principles-adr.md) — CSS architecture constraints preserved during routing changes

### Contracts
- [docs/contracts/styling-principles-contracts.md](../contracts/styling-principles-contracts.md) — CSS-first and tokenized styling rules that remain enforced

### Anti-Patterns
- [docs/anti-patterns/styling-principles-anti-patterns.md](../anti-patterns/styling-principles-anti-patterns.md) — cross-page drift anti-pattern avoided during remapping

### Related Feature Brief
- [docs/feature-briefs/b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md) — historical context for B2B page lineage

### Further Reading
- [.github/prompts/create-implementation-plan.prompt.md](../../../.github/prompts/create-implementation-plan.prompt.md)
- [.github/docs/decision-tree-validation-gates.md](../../../.github/docs/decision-tree-validation-gates.md)
