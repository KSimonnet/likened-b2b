# BtoB Landing Page — Feature Brief

---

## 0. Implementation Governance (MANDATORY)

- Scope gate: this plan covers the new BtoB public-facing landing page (`public/b-to-b.html`) and the BtoB pricing page (`public/b-to-b-pricing.html`), along with their supporting assets. The web app (`public/app/`), the Chrome extension, the back-end, and the BtoC landing page (`index.html`) are all **explicitly out of scope**.

---

## 1. Context Snapshot

### Scope

Likened has no public-facing entry point for its enterprise / Talent Acquisition audience. The BtoC landing page (`index.html`) speaks to individual job seekers; TA professionals who land on the site today see the wrong value proposition. A dedicated BtoB landing page is needed to convert enterprise prospects into waitlist contacts.

**Files affected:**
- `public/b-to-b.html` — new file; BtoB landing page targeting TA Partners, Heads of Talent, and HR Directors
- `public/b-to-b-pricing.html` — new file; BtoB pricing page (scope extended from original brief — documented here per governance rule)
- `public/css/pages/b-to-b.css` — new file; BtoB-specific style overrides (hero copy, stats layout, differentiators grid)
- `public/js/b-to-b.js` — new file; imports `animateStatCounter` from `shared-js/`
- `shared-js/animate-stat-counter.js` — new file; `animateStatCounter()` extracted from `landing-page.js`
- `public/js/landing-page.js` — refactored to import `animateStatCounter` from `shared-js/` (replaces inline implementation)
- `scripts/build.js` — updated to copy both BtoB HTML files, bundle `b-to-b-bundle.css`, and build `b-to-b.js`

**Unchanged:**
- `public/index.html` content and sections
- `public/pricing.html` — untouched (BtoC pricing page)
- `public/app/` — untouched
- `public/css/pages/landing-page.css` — no changes; shared styles are inherited via the CSS bundle
- `public/js/dark-mode.js` — reused as-is in `b-to-b.html`
- All existing image assets — some are reused; no new images are required for MVP

---

### Current State

┌────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
│ Symptom                                                    │ Root cause                                                 │
├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ Enterprise TA professionals landing on the site see a      │ `index.html` was built for the BtoC persona; no BtoB       │
│ job-seeker value proposition — high cognitive friction     │ entry point exists                                         │
├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ BtoB elevator pitch, stats, commercial offering, and       │ All BtoB content exists in `b-to-b-commercials.md` but     │
│ differentiators are invisible to enterprise visitors       │ has never been translated into public-facing HTML          │
├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ No enterprise-grade social proof or case study             │ No TAP testimonial has been written; the BtoC "John"       │
│                                                            │ story is consumer-facing and irrelevant to TA leads        │
├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ Nav has no "For TA Teams" entry point from the BtoC page   │ BtoB page did not exist at the time the header was built   │
└────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘

---

### Locked Decisions

- **Tech stack stays vanilla** — HTML / CSS / JS + TailwindCSS. No framework (React, Vue, etc.) introduced.
- **`b-to-b.html` is a new standalone file** — mirrors the HTML skeleton of `index.html` (shared header, footer, dark-mode toggle, `tailwind.min.css`, CSS bundle); content and copy are entirely BtoB.
- **CSS bundle**: `b-to-b-bundle.css` = same shared stack as `landing-page-bundle.css` (brand-kit + page-style + landing-page.css + slider-switch + modal) **plus** `b-to-b.css`. This avoids forking the shared stylesheet while allowing BtoB-specific overrides.
- **`animateStatCounter()` is extracted to `shared-js/animate-stat-counter.js`** — the function moves out of `landing-page.js` into a shared utility and is imported by both `landing-page.js` and `b-to-b.js`. This resolves the DRY violation and is a prerequisite for the `b-to-b.js` build step.
- **BtoB stats are presented without external source citations** — statistics are first-party industry analysis; no hyperlinks are added (no external source available).
- **CTA model is purpose-split** — product-entry CTAs use "Sign In" and route to `app/#/dashboard`; the Section 8 discovery CTA uses "Contact Us" and routes to `https://forms.gle/p67EoZcdRRpGnTfZA`; Section 9 reciprocal redirect remains link-only and routes to B2C landing.
- **BtoB stats (sourced from `b-to-b-commercials.md`)**:
  - 30% of recruiter time spent screening (source: first-party industry analysis)
  - 90% of screened candidates are unqualified (source: first-party industry analysis)
  - 8 weeks → 5 days longlist delivery (source: Likened methodology vs industry average)
- **Page sections (ordered)**:
  1. Hero / Mission — TA-specific headline
  2. Stats Hook — TA pain points (recruiter waste, candidate quality, time-to-longlist)
  3. How It Works — 4-step flow: role brief → AI cluster mapping → Longlist (Top 100 candidates at 90% accuracy) → talent intelligence dashboard
  4. Commercial Offering — Talent Mapping, Talent Market Intelligence, Longlist delivery (from `b-to-b-commercials.md # Commercial offering`)
  5. Key Differentiators — Network Science vs boolean search; Tier 1 scoping; TAP elevation; 5-day delivery
  6. Intelligence Questions — "What?" section (7 enterprise intelligence questions from `b-to-b-commercials.md`)
  7. FAQ — TA-specific (at least 4 items; referenced from `b-to-b-commercials.md`)
  8. Discovery call CTA block — "Contact Us" CTA before footer, pointing to the form URL
  9. B2C callout block — reciprocal informational callout below Section 8 for professionals who want to future-proof their career in AI, with a "Learn more →" link to the B2C landing page
- **Iceberg toggle is carried over** — the iceberg section is included in BtoB with the same toggle behavior and heading switch states as implemented in `public/b-to-b/index.html`.
- **Dark mode parity** — `b-to-b.html` reuses `dark-mode.js` and inherits the same CSS custom properties as `index.html`.
- **Nav in `b-to-b.html`** — keeps only "Sign In" and "Pricing". The standalone "For Individuals" nav link is removed because the reciprocal redirect block already routes to B2C landing.
- **BtoB pricing page (`b-to-b-pricing.html`) is in scope** — `pricing.html` is the BtoC pricing page and is untouched; `b-to-b-pricing.html` is a new standalone page to be built as part of this feature. Its tiers and pricing model are a separate specification concern.
- **Testimonial section is included** — Section J includes two client testimonials presented in a carousel with previous/next controls, editable page indicator, and auto-advance behavior.
- **Image assets available for reuse** (no new images required for MVP):
  - `executive-search-ta-network-science-cropped.png` — network science visualisation (How It Works)
  - `exeksourcing-world-map.png` — global talent market intelligence section
  - `company-card-content-analytics.png` — analytics dashboard (Commercial Offering)
  - `social-network-analysis-visualization.png` — Key Differentiators or hero visual

---

### Open Questions

All open questions resolved. No blockers remain before beginning the derivation chain.

- [x] **Stat citations** — stats are presented without source links; no external reference available.
- [x] **`animateStatCounter` extraction** — extracted to `shared-js/animate-stat-counter.js`; imported by both `landing-page.js` and `b-to-b.js`.
- [x] **Social proof** — testimonial section implemented using available client testimonials in Section J; TAP-specific case study copy can still be added in a future iteration.
- [x] **CTA destination split** — product-entry CTAs use `app/#/dashboard`; discovery CTA uses `https://forms.gle/p67EoZcdRRpGnTfZA`; reciprocal redirect links to B2C landing.

---

### Competitor Research (Reference)

Reviewed during brief: [sourcewhale.com](https://sourcewhale.com), [kalent.ai](https://kalent.ai), [herohunt.ai](https://www.herohunt.ai/uwi), [digitalrecruiter.com](https://digitalrecruiter.com).

Key patterns observed across competitors that inform section ordering and copy tone:

- **Problem-first framing before product** — DigitalRecruiter leads with a named structural problem (Speed Gap, Scale Ceiling, Data Gap) and attaches a quantified metric to each pain point before introducing the solution. Likened should mirror this with the recruiter waste / longlist delivery stats in the Stats Hook.
- **Quantified competitive edge over vague claims** — HeroHunt leads with outcome ratios (5× candidates, 2× responses, 4× faster, 95% less sourcing time). Likened's "8 weeks → 5 days" and "90% accuracy" are equivalent claims and should be front-loaded.
- **Step-by-step flow with named inputs and outputs** — Kalent shows a 5-step sourcing loop with tangible inputs ("type your prompt") and tangible outputs ("80% mobile numbers"). Likened's How It Works should name the artefact produced at each step (role brief → cluster map → Top 100 longlist → intelligence dashboard).
- **Single dominant CTA repeated at each section break** — all three sites use one CTA label repeated consistently throughout ("Free trial", "Get started", "Get your free AI readiness score"). Likened should use "Sign In" consistently.
