---
goal: "Preserve legacy Likened B2B URLs through Cloudflare while routing visitors to the dedicated B2B GitHub Pages site"
version: 1.0
date_created: 2026-09-21
status: "Planned"
tags: ["feature-brief", "routing", "cloudflare", "github-pages", "discovery"]
---

# Feature Brief: Cloudflare Legacy B2B Redirect

> Stage 1 of 2 - Written BEFORE artifacts. Expands into the Implementation Plan after all artifacts are complete.
> Derivation flow: **this document** -> Specifications -> UL -> ADRs -> Contracts -> Anti-Patterns -> Implementation Plan

Trigger justification: Preserving externally shared B2B URLs is a user-facing routing capability with ambiguous boundaries across Cloudflare, the B2B GitHub Pages site, and the retained webapp host.

## 0. Artifacts Required

- [x] **Specifications** - Redirect behavior changes what visitors experience when opening legacy B2B URLs.
- [x] **Ubiquitous Language** - Legacy route, canonical B2B route, and application-entry route span Cloudflare, `likened-b2b`, and `likened-webapp`.
- [ ] **ADRs** - The dedicated B2B Pages host and Cloudflare nameserver migration are already committed decisions; this brief does not introduce a new reversible architecture decision.
- [x] **Contracts** - The exact legacy-path-to-canonical-path mapping is non-obvious and applies to the root and pricing legacy callers; an incorrect map produces a difficult edge-only routing failure.
- [ ] **Anti-Patterns** - No documented implementation violation has been established; the current rule requires destination validation before classifying it as a violation.
- [x] **Implementation Plan** - The work spans DNS and edge configuration, B2B Pages deployment, route validation, and rollback sequencing.

---

## 1. Executive Summary

`likened.net` has migrated authoritative DNS to Cloudflare, and Cloudflare is active for the zone. The B2B landing site is hosted separately by GitHub Pages at `b2b.likened.net`; the product webapp remains hosted at `likened.net/app/`. The revised Cloudflare rule is intended to collapse legacy `/b-to-b` paths to the B2B landing page. This feature establishes the required behavior and validation boundary for legacy B2B links without relocating the webapp.

---

## 2. Context Snapshot

### Scope

Define and validate edge redirects from `likened.net/b-to-b` legacy URLs to the B2B Pages site, including query-string preservation and B2B links back to the existing webapp application route.

**Scope gate:** The webapp source, deployment, application routes, authentication, and data services are out of scope. This brief does not redesign B2B content or prescribe the final redirect expression.

**Success boundary:** A visitor opening a supported legacy B2B URL reaches the equivalent intended B2B content without a loop, 404, loss of query parameters, or accidental navigation away from `likened.net/app/` for application-entry links.

**Files affected:**
- `../CNAME` - declares the `b2b.likened.net` custom domain for the dedicated B2B Pages site.
- `../public/index.html` and `../public/pricing.html` - retain absolute application-entry URLs that point to the webapp host.
- Cloudflare Redirect Rule `Redirect /b-to-b to b2b.likened.net` - edge configuration requiring destination-path validation.
- `../../likened-webapp/scripts/build.js` - retains only the legacy compatibility behavior required by the webapp host.

**Unchanged:**
- `../../likened-webapp/public/app/` remains in the webapp repository and is served from `https://likened.net/app/`.
- B2B Pages remains a separate GitHub Pages deployment with `b2b.likened.net` as its custom domain.
- No Supabase, authentication, or application data behavior changes.

### Current State

| Symptom (Observable Problem) | Root Cause |
| --- | --- |
| Legacy B2B requests are redirected at the edge rather than being served by the webapp Pages artifact. | Cloudflare is authoritative for `likened.net` and applies the configured redirect rule before the origin response. |
| Supported legacy B2B requests are intended to converge on `https://b2b.likened.net/`. | The revised static redirect removes the legacy path suffix so the B2B Pages landing page receives the request. |
| A B2B application-entry link must leave the B2B host to reach the product. | The product application remains deployed at `https://likened.net/app/#/dashboard`; relative `../app/` links resolve incorrectly from the B2B hostname. |

### Goals & Success Criteria

- Goal 1: Preserve supported externally shared `/b-to-b` links during the B2B site split.
- Goal 2: Ensure every intentionally matched legacy B2B route reaches the B2B Pages landing page.
- Goal 3: Preserve direct B2B product-entry links to the unchanged webapp URL.

### Definition of Done

- [ ] Supported legacy root URLs reach the B2B Pages landing page.
- [ ] The decision to collapse or preserve legacy pricing URLs is documented and validated.
- [ ] Redirect status, destination paths, and query-string behavior are verified from an external HTTP client.
- [ ] `b2b.likened.net` remains bound only to the dedicated B2B Pages repository.
- [ ] B2B product-entry links open `https://likened.net/app/#/dashboard`.
- [ ] A documented rollback restores the previously working edge behavior.

### Non-Functional Requirements & Success Metrics

- Performance: Edge redirects should complete in one redirect hop for supported legacy routes.
- Reliability: A failed or mismapped redirect must be visible through HTTP status and `Location` header checks.
- Security / privacy: Redirects must use fixed host/path mapping only and must not reflect user-controlled hosts.
- Observability: Validation records must capture status code, `Location`, final status, and query-string preservation.
- Compatibility: Preserve existing `/b-to-b` links by routing them to the B2B landing page; query-string behavior must be verified separately from path-suffix behavior.
- Operational risk: Cloudflare changes take effect ahead of GitHub Pages origin routing and can hide origin fixes.

### Security / Privacy Mini Boundary Checklist

- [x] **Auth boundary defined** - The public B2B landing and legacy redirects are unauthenticated; the redirect does not establish application identity or bypass webapp authentication.
- [x] **Data exposure boundary defined** - The rule exposes only public URL routing; it must not add application data, user identifiers, or private query values to a destination beyond the received query string.
- [x] **Secret handling boundary defined** - No secrets belong in Cloudflare redirect expressions, B2B static assets, or GitHub Pages artifacts; Cloudflare and GitHub credentials remain provider-managed configuration.
- [x] **Privilege boundary defined** - Creating or editing Cloudflare redirect rules and GitHub Pages custom-domain bindings requires DNS or repository administrator permissions; page visitors have no such capability.
- [x] **Fail-closed behavior defined** - Unsupported legacy paths must not be broadly redirected to a user-controlled URL; an unmatched request follows the configured origin behavior and must be surfaced as a validation failure if it is not an intentional public page.

---

## 3. Stakeholders & Impact

| Stakeholder / Component Affected | How they are impacted |
| --- | --- |
| Existing B2B visitors and shared-link recipients | Continue to reach B2B content through legacy `likened.net/b-to-b` URLs. |
| B2B GitHub Pages site | Receives canonical landing and pricing traffic at `b2b.likened.net`. |
| Webapp at `likened.net/app/` | Remains independently hosted and receives explicit B2B application-entry navigation. |
| Domain and deployment administrators | Must coordinate Cloudflare redirect changes with GitHub Pages custom-domain availability. |

---

## 4. Known Constraints

- `likened.net` nameservers are `dorthy.ns.cloudflare.com` and `justin.ns.cloudflare.com`; Cloudflare became active on 2026-09-19 at 07:21 UTC.
- The current intended rule filters `(http.host eq "likened.net" and starts_with(http.request.uri.path, "/b-to-b"))` and returns HTTP 301.
- The current intended action is a static redirect to `https://b2b.likened.net/` with path-suffix preservation disabled.
- External HTTP validation performed after the configuration change still observed the prior redirect/origin behavior; edge propagation or rule activation remains unverified.
- GitHub Pages permits one custom domain per Pages site; `b2b.likened.net` belongs to the dedicated B2B repository, while `likened.net` remains assigned to the webapp repository.
- Static GitHub Pages cannot resolve bare package specifiers at runtime; B2B JavaScript must be compiled before browser delivery or use published browser-resolvable module URLs.

---

## 5. Scope Risks (Discovery)

| Risk / Unknown | Impact on Derivation / Implementation |
| --- | --- |
| Path-suffix preservation is disabled for every matching request. | `/b-to-b/pricing` and all matching descendants collapse to the B2B landing page, which may discard a distinct destination users expect. |
| The `starts_with` filter also matches paths such as `/b-to-business`. | The supported legacy route boundary must be defined to prevent unintended redirects. |
| An existing Cloudflare rule may overlap or take precedence. | A correctly configured rule can appear ineffective or create a redirect loop. |
| DNS, Pages certificate, or cache state may lag an edge-rule edit. | Production checks can produce transient results and require time-stamped verification. |

### Rollback & Change Safety

- Rollback path: Disable the Cloudflare redirect rule or restore its prior saved configuration.
- Data / config compatibility: No database, storage, or schema change is involved; the rule is provider configuration.
- Backward compatibility: Legacy root links remain the compatibility surface; legacy pricing behavior must be explicitly accepted if it collapses to the landing page.
- Safe rollout: Validate the exact root and pricing routes with and without query parameters before treating the rule as active.
- Recovery action: Disable the rule, verify the original GitHub Pages origin response, then deploy a corrected rule after the destination mapping is confirmed.

---

## 6. Locked Decisions

- The B2B landing is hosted by the dedicated `KSimonnet/likened-b2b` GitHub Pages site at `b2b.likened.net`. Rationale: GitHub Pages custom domains are bound per Pages site.
- The product webapp remains at `https://likened.net/app/` and is not relocated to the B2B repository. Rationale: B2B is a public landing surface, not an application-hosting replacement.
- Cloudflare is authoritative for `likened.net` DNS and is the edge-routing owner for legacy public paths. Rationale: the registrar delegates the domain to Cloudflare nameservers.
- Path-suffix preservation is disabled so matching legacy paths converge on the B2B landing page. Rationale: the B2B Pages landing page is published at `/`.

---

## 7. Assumptions

- [ ] The B2B Pages deployment serves `/` and `/pricing.html` as the intended canonical landing and pricing destinations.
- [ ] No higher-priority Cloudflare rule rewrites or redirects the same requests.
- [ ] The B2B repository deployment produces browser-executable JavaScript with no unresolved imports.

---

## 8. Open Questions

All current discovery questions are resolved.

- [x] **Legacy descendant destination** - Every path beginning with `/b-to-b`, including `/b-to-b/pricing`, collapses to the B2B landing page. *Resolved in: REQ-ROUT-002*
- [x] **Legacy path match boundary** - The redirect must match every path beginning with `/b-to-b`. *Resolved in: REQ-ROUT-001*
- [x] **Redirect precedence** - The Single Redirect runs in `http_request_dynamic_redirect`, the highest-priority redirect phase, and terminates evaluation. *Resolved in: REQ-ROUT-004*
- [x] **Query-string behavior** - The static redirect must not preserve query strings. *Resolved in: REQ-ROUT-003*

---

## 9. Timeline & Priority

- **Priority:** High
- **Target completion:** 2026-09-21
- **Dependencies:** Active Cloudflare zone, B2B GitHub Pages deployment, valid `b2b.likened.net` custom-domain binding, and a confirmed B2B route map.

---

## 10. References

- Cloudflare dashboard rule: `Redirect /b-to-b to b2b.likened.net`
- `CNAME` - B2B GitHub Pages custom-domain declaration
- `public/index.html` - B2B landing page and application-entry links
- `public/pricing.html` - B2B pricing page and application-entry links
- `../../likened-webapp/public/app/` - retained webapp source and deployment boundary
