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
