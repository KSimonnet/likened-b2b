---
goal: BtoB Landing Page & BtoB Pricing Page
version: 1.0
date_created: 2026-03-28
last_updated: 2026-09-21
status: Draft
feature_brief: docs/feature-brief/b-to-b-landing-page-feature-brief.md
tags: ['landing-page', 'b2b', 'talent-acquisition', 'marketing']
---

# BtoB Landing Page & BtoB Pricing Page — Specifications

> **Scope**: BtoB only. `public/b-to-b.html` (new) + `public/b-to-b-pricing.html` (new).
> BtoC landing page (`index.html`) and BtoC pricing page (`pricing.html`) are untouched.
> Source material: `docs/references/b-to-b-commercials.md`.

---

## 1. Shared Infrastructure

### REQ-INF-001 — CSS bundle

`b-to-b.html` and `b-to-b-pricing.html` MUST load a `css/b-to-b-bundle.css` file composed (in build order) of:

1. `shared-css/likened-brand-kit.css`
2. `public/css/shared/page-style.css`
3. `public/css/pages/landing-page.css`
4. `public/css/shared/slider-switch.css`
5. `public/css/shared/modal.css`
6. `public/css/pages/b-to-b.css`

This mirrors `landing-page-bundle.css` with `b-to-b.css` appended. Neither `pricing.css` nor any other page-specific stylesheet is included.

Before writing any new CSS class in `b-to-b.css`, the full shared stack MUST be checked. If an equivalent class exists in any of the files above, it MUST be reused — not duplicated (Contract-CSS-001). All colour, shadow, spacing, and font values MUST use `var(--likened-*)` tokens (Contract-CSS-004). No `style=""` attributes and no `element.style.*` assignments for visual properties (Contract-CSS-011).

Canonical shared callout classes (`.cta-callout`, `.reciprocal-redirect`) MUST be defined in `public/css/shared/page-style.css`, not duplicated in `public/css/pages/b-to-b.css`.

### REQ-INF-002 — Dark mode parity

Both `b-to-b.html` and `b-to-b-pricing.html` MUST load `js/dark-mode.js` in `<head>` (identical position to `index.html`) so that the user's dark-mode preference is applied before first paint — no flash of unstyled content.

### REQ-INF-003 — CTA target

All product-entry CTA buttons on both pages MUST point to `app/#/dashboard`.

Exceptions:
- Section 8 discovery CTA on `b-to-b.html` points to `https://forms.gle/p67EoZcdRRpGnTfZA`
- Reciprocal redirect links point to B2C marketing pages

### REQ-INF-004 — CTA label

The primary product-entry CTA label on `b-to-b.html` MUST be **"Sign In"** for all product-entry buttons pointing to `app/#/dashboard`.

Section 8 uses a distinct discovery CTA label: **"Contact Us"**.

### REQ-INF-005 — Footer

The footer (`Copyright © 2025 Likened.net | Privacy Policy`) MUST be reused verbatim on both BtoB pages — identical to `index.html`.

### REQ-INF-006 — Nav in `b-to-b.html`

The nav MUST contain exactly two links:
- **"Sign In"** — `href="../app/#/dashboard"`
- **"Pricing"** — `href="pricing.html"`

The standalone **"For Individuals"** nav link is intentionally removed because Section 9 already provides the reciprocal redirect to B2C.

---

## 2. Shared JS Utility — `animateStatCounter`

### REQ-JS-001 — Extract `animateStatCounter` to `shared-js/`

`animateStatCounter()` MUST be extracted from `public/js/landing-page.js` into a new module at `shared-js/animate-stat-counter.js`. The extracted implementation MUST be identical in behaviour to the current function — no logic changes.

The module MUST export the function as a named export:

```js
export function animateStatCounter(element, duration = 1500) { … }
```

### REQ-JS-002 — Refactor `landing-page.js` to import from shared utility

`public/js/landing-page.js` MUST be updated to import `animateStatCounter` from `shared-js/animate-stat-counter.js` and remove its inline implementation. All existing observable behaviour of `landing-page.js` MUST be preserved exactly — this is a refactor, not a feature change.

### REQ-JS-003 — `b-to-b.js` imports from shared utility

`public/js/b-to-b.js` MUST import `animateStatCounter` from `shared-js/animate-stat-counter.js` and register an `IntersectionObserver` targeting all `[data-target]` elements within `b-to-b.html`. The observer behaviour MUST be identical to that in `landing-page.js` (threshold 0.3, fires once per element).

---

## 3. Build Pipeline — `scripts/build.js`

### REQ-BUILD-001 — Copy BtoB HTML files

`copyPublicFiles` in `scripts/build.js` MUST include entries for:
- `{ from: "public/b-to-b.html", to: "dist/b-to-b.html" }`
- `{ from: "public/b-to-b-pricing.html", to: "dist/b-to-b-pricing.html" }`

### REQ-BUILD-002 — Bundle `b-to-b-bundle.css`

`prepareCSS` MUST include a `b-to-b-bundle.css` entry assembled from the files listed in REQ-INF-001 (in the same order).

### REQ-BUILD-003 — Build `b-to-b.js`

`buildJS` MUST include a `b-to-b.js` entry point producing `dist/js/b-to-b.js` in `iife` format, matching the configuration of the existing `landing-page.js` entry.

---

## 4. BtoB Landing Page (`public/b-to-b.html`)

### REQ-BTB-001 — Page title

`<title>` MUST be **"Likened for Talent Acquisition — Network Science-Powered Talent Mapping"**.

### REQ-BTB-002 — Script

`b-to-b.html` MUST load `./js/b-to-b.js` at the bottom of `<body>` (same position as `landing-page.js` in `index.html`).

### REQ-BTB-003 — Iceberg toggle heading state

The heading text in `index.html` for the iceberg section (`<h2>` currently rendered as "Headhunt Passive-Search Talent") MUST switch with `#iceberg-toggle` state:

- when the slider is on (`#iceberg-toggle:checked`), heading text MUST be **"Headhunt Passive-Search Talent"**
- when the slider is off (not checked), heading text MUST be **"Reactive Post & Pray approach"**

---

### Section 1 — Hero / Mission

#### REQ-BTB-010 — Heading

The `<h1>` MUST read: **"Turn your Talent Acquisition function into a competitive intelligence capability"**.

#### REQ-BTB-011 — Sub-copy

Below the `<h1>`, a single paragraph MUST communicate the mission statement from `b-to-b-commercials.md`:

> Likened augments the capability of Talent Acquisition professionals — elevating them from operational recruiters to strategic Trusted Advisors to the Executive team and C-Suite.

#### REQ-BTB-012 — Primary CTA

A "Sign In" button pointing to `app/#/dashboard` MUST appear in the hero.

---

### Section 2 — Stats Hook

#### REQ-BTB-020 — Section heading

The section MUST carry the heading: **"Your TA function is drowning. The data proves it."**

#### REQ-BTB-021 — Three stat counters

The section MUST display exactly three quantified statistics. Each MUST animate using `animateStatCounter()` on scroll-into-view (Intersection Observer, threshold 0.3, fires once per element).

| # | Display value | Label | Source note |
|---|---|---|---|
| 1 | 30% | of a recruiter's day is spent screening profiles | First-party — no external link |
| 2 | 90% | of screened candidates are unqualified | First-party — no external link |
| 3 | 8 wks → 5 days | longlist delivery with Likened | Likened methodology — no external link |

Stats 1 and 2 use `data-target` + `data-suffix="%"`. Stat 3 is a static comparison string (not animated) rendered as a prominent display figure, since it is not a single integer.

#### REQ-BTB-022 — Problem framing

Each stat MUST be accompanied by a one-line description of the problem it represents (not just the number). Modelled on the DigitalRecruiter "Speed Gap / Scale Ceiling / Data Gap" pattern identified in competitor research.

---

### Section 3 — How It Works

#### REQ-BTB-030 — Section heading

Section heading: **"From role brief to Top 100 longlist in 5 days"**.

#### REQ-BTB-031 — Four-step flow

The section MUST display the following four steps as a numbered sequential flow:

| Step | Label | Output artefact |
|---|---|---|
| 1 | Submit a role brief | Role requirements captured |
| 2 | AI maps the talent cluster | Graph of similar companies and candidate profiles |
| 3 | Longlist delivered | Top 100 candidates at 90% accuracy |
| 4 | Intelligence dashboard | Market data: competitor landscape, sentiment, saturation |

#### REQ-BTB-032 — Image

The section MUST use `assets/images/executive-search-ta-network-science-cropped.png`. Layout: steps left, image right (`section-split`, image on right).

#### REQ-BTB-033 — CTA

A "Sign In" CTA pointing to `app/#/dashboard`.

---

### Section 4 — Commercial Offering

#### REQ-BTB-040 — Section heading

Section heading: **"What Likened delivers"**.

#### REQ-BTB-041 — Two offering pillars

The section MUST present the two commercial offering pillars from `b-to-b-commercials.md # Commercial offering` as distinct sub-sections:

**Pillar 1 — Talent Acquisition**
- Talent Mapping / Strategic Sourcing: data-driven Top 100 longlist (avg. 90% accuracy)
- Talent Insights & Analytics: visualisation dashboard; keyword enrichment (~800 keywords); automated reporting

**Pillar 2 — Talent Market Intelligence**
Must surface the following intelligence categories (each with at least one illustrative question):
- Skillset Mapping (seniority pyramid, talent pool realism)
- Referral Mapping (internal network connections)
- Talent Saturation (geographic distribution, skill gaps)
- Competitor Landscape (top employers, tech stack, growth, turnover)
- Sentiment Analysis (employee reviews, culture, well-being)

#### REQ-BTB-042 — Image

The section MUST use `assets/images/company-card-content-analytics.png` to illustrate the analytics dashboard. Layout: text left, image right.

#### REQ-BTB-043 — CTA

A "Sign In" CTA pointing to `app/#/dashboard`.

---

### Section 5 — Key Differentiators

#### REQ-BTB-050 — Section heading

Section heading: **"Why Likened — not another ATS plugin"**.

#### REQ-BTB-051 — Differentiator grid

The section MUST display the six key differentiators from `b-to-b-commercials.md **Key Differentiators**` as a visual grid (2 or 3 columns, each item with a heading and a one-sentence description):

| Differentiator | Heading | One-sentence description |
|---|---|---|
| 1 | Network Science, not boolean search | Maps talent clusters using Graph Theory — not keyword string matching. |
| 2 | Augments your TA team | Complements your TAPs' sourcing capability; never competes with or replaces them. |
| 3 | Tier 1 scoped, GDPR-compliant | Scoped to Market Intelligence and Longlist only — no sensitive downstream recruitment data enters the platform. |
| 4 | Elevates TAPs to Trusted Advisors | Equips TAPs to advise the Executive team with data-driven market intelligence. |
| 5 | 8 weeks → 5 days | Delivers a Top 100 longlist at contingency-recruitment cost, in a fraction of the industry-average time. |
| 6 | Revenue-generating by-product | Insider network intelligence can be monetised beyond recruitment (business development, competitive intelligence). |

#### REQ-BTB-052 — Image

The section MUST use `assets/images/social-network-analysis-visualization.png` to reinforce the network science differentiator. Layout: grid left, image right, or image as a full-width backdrop if layout permits.

---

### Section 6 — Intelligence Questions

#### REQ-BTB-060 — Section heading

Section heading: **"The intelligence questions your C-Suite is asking"**.

#### REQ-BTB-061 — Seven questions

The section MUST display all seven enterprise intelligence questions from `b-to-b-commercials.md # What?` as a styled list:

1. Which companies in our target market are actively hiring for this skillset?
2. How large is the global talent pool, and how realistic is the laundry list of requirements vs. time-to-delivery?
3. Who in our organisation's network is already connected to our target talent pools?
4. Which competitors are winning the war for this talent, and from which sources are they hiring?
5. What does sentiment data tell us about culture, retention, and employer brand at target companies?
6. Is there a skill gap between talent pools in different locations?
7. What's the seniority pyramid and saturation level for this skillset globally?

#### REQ-BTB-062 — Image

The section MUST use `assets/images/exeksourcing-world-map.png` to reinforce the intelligence / market scope framing. Layout: questions left, image right.

#### REQ-BTB-063 — CTA

A "Sign In" CTA pointing to `app/#/dashboard`.

---

### Section 7 — FAQ

#### REQ-BTB-070 — Section heading

Section heading: **"Frequently asked questions"**.

#### REQ-BTB-071 — At least four FAQ items

The section MUST contain at minimum the following four items, implemented as `<details>` / `<summary>` pairs (same pattern as `index.html`):

| # | Question | Answer source |
|---|---|---|
| 1 | What is Talent Mapping and how is it different from sourcing? | `b-to-b-commercials.md # Commercial offering` — Talent Mapping section |
| 2 | How does Likened ensure GDPR and data privacy compliance? | `b-to-b-commercials.md` — Tier 1 scoping rationale: no downstream recruitment data enters the platform |
| 3 | How long does it take to receive a longlist? | `b-to-b-commercials.md # Benefits` — 8 weeks → 5 days |
| 4 | Does Likened replace our existing TA team or ATS? | `b-to-b-commercials.md **Key Differentiators**` — augments, not replaces |

Additional FAQ items MAY be added in future iterations.

---

### Section 8 — Discovery Call CTA Block

#### REQ-BTB-080 — Section heading

Section heading: **"Turn your TA function into a strategic advantage"**

#### REQ-BTB-081 — Supporting copy

A single discovery-oriented sentence below the heading:
> "You're looking at augmenting Talent Mapping / Sourcing / Insights / Intelligence for your whole team? Book a discovery call with us to see how Likened can help you achieve your Talent Acquisition goals."

#### REQ-BTB-082 — CTA

A prominent `class="cta-callout"` block MUST contain a "Contact Us" button pointing to `https://forms.gle/p67EoZcdRRpGnTfZA`. This is the final direct CTA block before the reciprocal B2C callout.

---

### Section 9 — B2C Callout Block

#### REQ-BTB-083 — Callout heading

Callout heading: **"Looking to future-proof your career in AI?"**

#### REQ-BTB-084 — Supporting copy

The callout supporting copy MUST communicate that referrals are one of the most effective paths into the hidden job market and that many companies run Employee Referral Programs worth up to $5,000 per successful hire.

#### REQ-BTB-085 — Informational link

A "Learn more →" link MUST appear in this callout.
- On `b-to-b/index.html`, the link target MUST be `../index.html` (B2C landing page).
- On `b-to-b/pricing.html`, the link target MUST be `../pricing.html` (B2C pricing page).

Section 9 is NOT a CTA block and MUST NOT include a `.button-link` button. It MUST use `class="reciprocal-redirect"`.

---

## 5. BtoB Pricing Page (`public/b-to-b-pricing.html`)

Source: `docs/references/b-to-c-commercials.md # Pricing Model`.

### REQ-BTP-001 — Page title

`<title>` MUST be **"Likened for TA Teams — Pricing"**.

### REQ-BTP-002 — Page heading

The `<main>` MUST open with an `<h1>`: **"Executive-search-grade talent intelligence. Transparent pricing."** and a subtitle: **"From longlist to full outreach campaign — choose the scope that fits your mandate."**

### REQ-BTP-003 — Loads `b-to-b-bundle.css`

`b-to-b-pricing.html` MUST load `css/b-to-b-bundle.css` (not `landing-page-bundle.css` or `pricing-bundle.css`).

### REQ-BTP-004 — Three service tiers

The page MUST display exactly three tiers rendered as side-by-side cards (same `pricing-tiers-grid` layout pattern as `pricing.html`). These are **per-mandate service tiers**, not SaaS subscription tiers.

#### Tier 1 — Longlist

| Property | Value |
|---|---|
| Name | Longlist |
| Price | $2,000 per mandate |
| Visual treatment | Standard card |
| CTA label | Sign In |
| CTA target | `app/#/dashboard` |

**Includes:**
- Top 100 candidates longlist (avg. 90% accuracy)
- Priority 7-day delivery
- Satisfaction guarantee: refine for free if the longlist does not meet the brief

---

#### Tier 2 — Longlist + Market Intelligence

| Property | Value |
|---|---|
| Name | Longlist + Market Intelligence |
| Price | $4,000 per mandate |
| Visual treatment | Highlighted card with "Most popular" badge |
| CTA label | Sign In |
| CTA target | `app/#/dashboard` |

**Includes everything in Tier 1, plus:**
- Full talent market dataset: up to 4,000 company and employee profiles
- Self-serve query interface to customise and refine the longlist
- Metadata-enriched search criteria (go beyond what is displayed on LinkedIn)

---

#### Tier 3 — Full Mandate (Longlist + Intelligence + Outreach)

| Property | Value |
|---|---|
| Name | Full Mandate |
| Price | $4,000 per mandate + $1,000/month outreach retainer |
| Visual treatment | Premium card with "Best value" badge |
| CTA label | Sign In |
| CTA target | `app/#/dashboard` |

**Includes everything in Tier 2, plus:**
- Outreach campaign and scheduling for up to 50 prospects
- Personalised messaging with A/B testing
- Dedicated Account Manager
- Guaranteed 20% response rate — or the campaign continues at no extra cost

---

### REQ-BTP-005 — No billing toggle

The BtoB pricing page MUST NOT include a monthly/annual billing toggle. These are per-mandate fees, not subscriptions. The toggle from `pricing.html` MUST NOT be carried over.

### REQ-BTP-006 — Guarantee callout

Below the tier cards, a `class="cta-callout"` block MUST display the satisfaction guarantee copy:
> "Every mandate comes with a satisfaction guarantee. If the longlist doesn't meet your role brief, we'll re-calibrate it once at no additional cost."

This is a CTA block and MUST include a `.button-link` button aligned with the page CTA policy.

### REQ-BTP-007 — Reciprocal B2C callout

Below the guarantee callout, a second `class="reciprocal-redirect"` block MUST display:
- Heading: **"Looking to future-proof your career in AI?"**
- Supporting copy: MUST communicate that referrals are one of the most effective paths into the hidden job market and that many companies run Employee Referral Programs worth up to $5,000 per successful hire.
- Informational link: **"Learn more →"** pointing to `../pricing.html`

This block is NOT a CTA block and MUST NOT include a `.button-link` button. It MUST use `class="reciprocal-redirect"`.

### REQ-BTP-008 — Pricing Page Nav

The nav on `b-to-b/pricing.html` MUST include:
- "Sign In" linking to `../app/#/dashboard`
- "Home" linking to `index.html` (the B2B landing page)

The `https://forms.gle/p67EoZcdRRpGnTfZA` URL MUST appear exclusively inside Contact Us callout CTA buttons (not in pricing-page nav links).

### REQ-BTP-009 — Footer

The footer MUST be identical to `index.html` (REQ-INF-005).

---

## 6. Legacy B2B Edge Routing

### REQ-ROUT-001 — Legacy B2B path match

Cloudflare Single Redirects MUST match requests whose host is exactly
`likened.net` and whose path begins with `/b-to-b` using:

```text
(http.host eq "likened.net" and starts_with(http.request.uri.path, "/b-to-b"))
```

The match MUST include `/b-to-b`, `/b-to-b/`, `/b-to-b/#testimonial`,
`/b-to-b/pricing`, and every other path beginning with `/b-to-b`.

### REQ-ROUT-002 — Static landing destination

Every request matched by REQ-ROUT-001 MUST receive an HTTP 301 static redirect
to `https://b2b.likened.net/`.

Path-suffix preservation MUST be disabled. Consequently, a matched descendant
path, including `/b-to-b/pricing`, MUST also resolve to the B2B landing page.

### REQ-ROUT-003 — Query-string removal

The redirect defined by REQ-ROUT-002 MUST NOT preserve query strings. The
Cloudflare `preserve_query_string` setting MUST remain `false`.

### REQ-ROUT-004 — Redirect precedence

The B2B redirect MUST run in Cloudflare's
`http_request_dynamic_redirect` phase through Single Redirects. It is a
terminating action: after a request matches, later URL Rewrite Rules,
Configuration Rules, Origin Rules, Bulk Redirects, and Managed Transforms MUST
NOT alter the response.

### CON-ROUT-001 — Destination host restriction

The redirect destination host MUST be the fixed value `b2b.likened.net` and
MUST NOT be derived from a request header, query parameter, or path fragment.

### GOAL-ROUT-001 — Legacy-link continuity

Visitors opening any legacy URL beginning with `https://likened.net/b-to-b`
reach the canonical B2B landing page in one terminating redirect hop.
