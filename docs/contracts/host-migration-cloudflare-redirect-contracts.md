# Canonical Landing Host Contracts

## Contract-ROUT-001: Collapse Legacy B2B Requests to the Fixed Landing URL (🔴 HARD)

**Severity:** HARD CONSTRAINT

**Why Severity:** Legacy B2B routing is a public compatibility boundary; a different target, retained suffix, or retained query string changes the visitor-visible route and cannot be corrected by B2B static-site code after Cloudflare has terminated the request.

**Rationale:** The two confirmed legacy inputs, `/b-to-b` and `/b-to-b/pricing`, must behave consistently at the edge. Cloudflare configuration is external to both repositories, so a mapping defect is difficult to trace from application code or the GitHub Pages artifact.

**Source:**
- Specification: REQ-ROUT-001, REQ-ROUT-002, REQ-ROUT-003, REQ-ROUT-004
- Constraint: CON-ROUT-001
- UL: Legacy B2B URL, Legacy Path Match, Canonical B2B Landing URL, Path Collapse, Query Discard, Terminating Redirect

**Rule:** Every request matching `(http.host eq "likened.net" and starts_with(http.request.uri.path, "/b-to-b"))` MUST receive one HTTP 301 terminating redirect to exactly `https://b2b.likened.net/`, with path-suffix preservation and query-string preservation disabled.

**Preconditions (@pre):**
- The request host is `likened.net`.
- The request path begins with `/b-to-b`.

**Postconditions (@post):**
- The response status is `301`.
- The `Location` value is exactly `https://b2b.likened.net/`.
- The destination contains neither the source path suffix nor the source query string.
- No later Cloudflare request phase changes the redirect response.

**Exception:** None.

**Invariants:**
- @invariant The destination host is the fixed value `b2b.likened.net`.
- @invariant Every Legacy B2B URL collapses to the Canonical B2B Landing URL.

**Validation:**

```javascript
// ✅ ALLOWED: both confirmed legacy inputs collapse to the B2B landing page.
expectRedirect("https://likened.net/b-to-b").toEqual({
  status: 301,
  location: "https://b2b.likened.net/"
});
expectRedirect("https://likened.net/b-to-b/pricing?campaign=legacy").toEqual({
  status: 301,
  location: "https://b2b.likened.net/"
});

// ❌ FORBIDDEN: retaining a suffix or query string changes the public contract.
expectRedirect("https://likened.net/b-to-b/pricing?campaign=legacy").toEqual({
  status: 301,
  location: "https://b2b.likened.net/b-to-b/pricing?campaign=legacy"
});
```

**Tests:**
- Unit tests: None; this behavior is owned by Cloudflare rather than a local function.
- Contract tests: `../../likened-webapp/scripts/validation-gates/validate-hostname-cutover.js` must assert the immediate `301` `Location` for both `/b-to-b` and `/b-to-b/pricing?campaign=legacy`, not only the final host after following redirects.
- Anti-pattern checks: A redirect that retains a path suffix, query string, or non-fixed host violates this contract.

**Consequences of Violation:**
- Immediate: Visitors reach an unintended B2B Pages path, a 404, or an attribution-bearing URL that contradicts the configured query-discard policy.
- Long-term: Shared links become inconsistent, origin-level debugging misattributes the failure, and later edge rules can silently reintroduce incompatible redirect behavior.

**Reference:**
- Cloudflare Single Redirects, `http_request_dynamic_redirect` phase

## Contract-B2C-001: Isolate the Canonical B2C Landing Host (🔴 HARD)

**Severity:** HARD CONSTRAINT

**Why Severity:** `b2c.likened.net` is a public host boundary. Serving no artifact, serving B2B content, or moving `/app/` behind the B2C Pages site changes visitor-visible routing and breaks the product application's existing ownership.

**Rule:** `https://b2c.likened.net/` MUST serve the B2C landing artifact successfully. The B2C Pages Site MUST NOT own, proxy, or replace `https://likened.net/app/`.

**Preconditions (@pre):**
- `b2c.likened.net` is configured as the B2C Pages Site custom domain.
- A B2C Pages deployment has completed successfully.

**Postconditions (@post):**
- A request to `https://b2c.likened.net/` returns a successful HTTP response.
- B2C application-entry links target `https://likened.net/app/#/dashboard`.
- The Webapp Application Route remains served by `likened.net`.

**Invariants:**
- @invariant The B2C Pages Site contains marketing content only.
- @invariant B2C deployment does not alter the B2B legacy redirect contract.

**Validation:**

```javascript
expectResponse("https://b2c.likened.net/").toHaveSuccessfulStatus();
expectB2CApplicationEntryLinks().toEqual([
  "https://likened.net/app/#/dashboard"
]);
```

**Tests:**
- Contract tests: `../../likened-webapp/scripts/validation-gates/validate-hostname-cutover.js` must verify that `b2c.likened.net` resolves to its own host with a successful final response.
- Deployment smoke tests: verify the B2C Pages deployment and the Webapp Application Route independently.

**Consequences of Violation:**
- Immediate: visitors receive a 404, B2B content, or a broken application-entry link.
- Long-term: B2C and product-app ownership become coupled, making the next host migration unsafe.

## Contract-B2C-002: Separate B2C Source from Browser Artifacts (🔴 HARD)

**Severity:** HARD CONSTRAINT

**Why Severity:** Treating a generated bundle as the source entry point destroys the reproducible source-to-artifact boundary and makes later feature work modify generated implementation details.

**Source:**
- Requirements: REQ-B2C-011, REQ-B2C-012, REQ-B2C-013
- Constraints: CON-B2C-003, CON-B2C-006
- UL: Source Entry Point, Deployable Browser Bundle, Source/Artifact Boundary

**Rule:** `likened-b2c/public/js/landing-page.js` MUST be maintainable source with explicit imports. The build MUST generate `likened-b2c/dist/js/landing-page.js`, and CI MUST install locked dependencies before building.

**Preconditions (@pre):**
- The B2C repository is checked out without sibling repositories.
- `package.json` and `package-lock.json` declare every build dependency.

**Postconditions (@post):**
- `npm ci && npm run build` succeeds.
- The source entry point retains its module imports.
- The deployable browser bundle contains no unresolved static imports.
- No build writes generated code back into `public/js/landing-page.js`.

**Invariants:**
- @invariant `public/` is the B2C source tree.
- @invariant `dist/` is generated and ignored.

**Tests:**
- Build integration: run `npm ci && npm run build` in `likened-b2c`.
- Source check: `rg '^import ' public/js/landing-page.js` MUST find the source imports.
- Artifact check: `rg '^import ' dist/js/landing-page.js` MUST find no unresolved imports.
- Ownership: this clean-build integration check is the primary enforcement owner; no additional regex gate is required while the repository has one landing entry point.

**Consequences of Violation:**
- Immediate: generated code becomes the editing surface or a clean runner cannot produce the deployed script.
- Long-term: source changes drift from deployment behavior and package upgrades require editing bundled internals.

## Contract-HOSTCUT-001: Use the Package-Owned Stat-Counter Action (🔴 HARD)

**Severity:** HARD CONSTRAINT

**Why Severity:** The same stat-counter algorithm is consumed by multiple independently built landing repositories. A local implementation or an older locked package version creates divergent behavior or a runtime missing-action failure that may only appear after deployment.

**Source:**
- Requirements: REQ-B2B-003, REQ-B2C-014
- Constraints: CON-B2B-002, CON-B2C-007
- UL: Shared Stat-Counter Action

**Rule:** B2B and B2C landing entry points MUST invoke `AnimationManager.actions.animateStatCounter`; they MUST NOT define or import a consumer-local stat-counter helper. Their manifests and lockfiles MUST resolve `@ksimonnet/utils` 2.1.0 or later, the first package version containing this action.

**Preconditions (@pre):**
- `@ksimonnet/utils` 2.1.0 or later is available to the consumer's package registry configuration.
- The consumer dependency manifest and lockfile are updated together.

**Postconditions (@post):**
- The consumer build resolves `AnimationManager.actions.animateStatCounter` from the installed package.
- No local `animateStatCounter` function or `animate-stat-counter.js` helper remains in the consumer source tree.
- A clean install and build succeeds for each consumer.

**Invariants:**
- @invariant The stat-counter algorithm has one implementation, owned by `@ksimonnet/utils`.
- @invariant Landing pages retain their own intersection observation and pass the intersecting element to the shared action.

**Tests:**
- Package unit tests verify target, suffix, duration, and invalid target handling.
- Consumer build tests run after dependency installation and verify the output contains the shared action.
- Consumer source checks verify no local helper definition remains.

**Consequences of Violation:**
- Immediate: consumers can call an action absent from their locked package or render counters with divergent behavior.
- Long-term: algorithm fixes must be duplicated and released independently across repositories.
