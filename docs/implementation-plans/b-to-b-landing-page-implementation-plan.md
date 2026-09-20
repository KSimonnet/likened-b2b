# Implementation Plan: BtoB Landing Page & BtoB Pricing Page

> Derivation Flow: Feature Brief → Specifications → UL → **this plan** → Tests → Implementation

---

## 0. Implementation Governance (MANDATORY)

- **Scope gate**: Covers `public/b-to-b.html` (new), `public/b-to-b/pricing.html` (new), `public/css/pages/b-to-b.css` (new), `public/js/b-to-b.js` (new), `shared-js/animate-stat-counter.js` (new), `public/js/landing-page.js` (refactor — extract only), and `scripts/build.js` (additive — new entries only). `public/app/`, Chrome extension, back-end, and `pricing.html` are **explicitly out of scope**.
- **ADRs / Contracts / Anti-Patterns**: Scoped N/A for this feature. The feature is a static marketing page with no complex runtime invariants, no event message passing, and no shared state. All design decisions are captured in the Specifications and Feature Brief.

---

## 1. Context Snapshot

> *See [b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md) for full context. Snapshot below captures only what is needed to execute.*

### Scope

New BtoB public-facing entry point converting Talent Acquisition professionals into discovery-call contacts. Two new HTML pages, one new CSS file, one new JS module, one shared JS utility extracted from existing code.

**Files to create (new):**
- `public/b-to-b.html`
- `public/b-to-b-pricing.html`
- `public/css/pages/b-to-b.css`
- `public/js/b-to-b.js`
- `shared-js/animate-stat-counter.js`

**Files to modify (additive / refactor):**
- `public/js/landing-page.js` — remove inline `animateStatCounter`, import from shared utility; zero behaviour change
- `scripts/build.js` — add 2 HTML copy entries, 1 CSS bundle, 1 JS entry point

**Unchanged:** `public/index.html` content / sections, `public/pricing.html`, `public/app/`, all image assets.

### Locked Decisions

| Decision | Detail |
|---|---|
| CSS bundle | `b-to-b-bundle.css` = brand-kit + page-style + landing-page.css + slider-switch + modal + b-to-b.css |
| CTA behavior | Product-entry CTAs use "Sign In" → `app/#/dashboard`; Section 8 discovery CTA uses "Contact Us" → `https://forms.gle/p67EoZcdRRpGnTfZA`; reciprocal redirect uses "Learn more →" → `../index.html` |
| `animateStatCounter` | Extracted to `shared-js/animate-stat-counter.js` as named export; imported (not inlined) by both consumers |
| Stats 1 & 2 | Animated via `data-target` + `data-suffix="%"` + IntersectionObserver (threshold 0.3, once) |
| Stat 3 | Static comparison string (not animated) |
| Testimonial section | Included as Section J with two testimonials in a carousel (Prev/Next, editable page indicator, auto-advance) |
| Dark mode | `dark-mode.js` loaded in `<head>` on both pages |
| Nav (`b-to-b.html`) | "Sign In" (`../app/#/dashboard`) + "Pricing" (`pricing.html`) |

---

## 2. Standalone Artifacts

> This plan contains only execution steps. Specifications and UL live in their standalone files. Do not duplicate their content here.

┌──────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Artifact                         │ File                                                                                           │ Key identifiers                                             │
├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Feature Brief                    │ [b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md)   │ Scope, locked decisions, image assets                       │
├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Specifications                   │ [b-to-b-landing-page-specifications.md](../specifications/b-to-b-landing-page-specifications.md)│ REQ-INF-001–007, REQ-JS-001–003, REQ-BUILD-001–003,         │
│                                  │                                                                                                │ REQ-BTB-001–085, REQ-BTP-001–009                            │
├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Ubiquitous Language          │ [b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md)            │ TAP, Longlist, mandate, service tier, Trusted Advisor,      │
│                                  │                                                                                                │ discovery call, b-to-b-bundle.css, Term Collision Register  │
├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Commercial Reference             │ [b-to-b-commercials.md](../references/landing-page.md)                                   │ Elevator pitch, offering pillars, differentiators, Intel Qs │
├──────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Pricing Reference                │ [b-to-c-commercials.md](../references/landing-page.md)                                   │ BtoB pricing model — lines 95–115                           │
└──────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘

---

## 3. Implementation Checklist

### Phase IP-0: Tests Written First (RED gate)

Write all failing tests before writing source code. Each test MUST fail (RED) before the corresponding implementation step is started.

- [ ] **[Test]** `tests/unit/animate-stat-counter.test.js` — unit test: `animateStatCounter` exported, counts up to `data-target`, stops at target, respects `data-suffix` — **Spec:** REQ-JS-001
- [ ] **[Test]** `tests/unit/landing-page-refactor.test.js` — smoke test: `landing-page.js` no longer contains inline `animateStatCounter` function body; import statement present — **Spec:** REQ-JS-002
- [ ] **[Test]** `tests/build/b-to-b-build.test.js` — build verification: after `npm run build`, `dist/b-to-b.html`, `dist/b-to-b-pricing.html`, `dist/css/b-to-b-bundle.css`, `dist/js/b-to-b.js` all exist — **Spec:** REQ-BUILD-001, REQ-BUILD-002, REQ-BUILD-003
- [ ] **[Test]** `tests/acceptance/b-to-b-page-structure.test.js` — structural acceptance: `b-to-b.html` contains the 9 required sections (headings match spec exactly), CTA/link destinations match spec, `dark-mode.js` is in `<head>` — **Spec:** REQ-BTB-001–085, REQ-INF-002, REQ-INF-003
- [ ] **[Test]** `tests/acceptance/b-to-b-pricing-page-structure.test.js` — structural acceptance: `b-to-b-pricing.html` contains 3 tier cards, no billing toggle, guarantee callout block plus reciprocal B2C callout block present with "Learn more →" link to `../pricing.html` — **Spec:** REQ-BTP-001–009
- [ ] Run `npm test` — confirm all new tests are RED

> **Review gate:** Pause here. User reviews all failing tests before code is written.

---

### Phase IP-1: Extract `animateStatCounter` to `shared-js/`

**Prerequisite:** IP-0 tests are RED.

- [ ] Create `shared-js/animate-stat-counter.js` — copy the `animateStatCounter` function from `public/js/landing-page.js` exactly as-is; export it as a named export — **Spec:** REQ-JS-001
- [ ] Update `public/js/landing-page.js` — add `import { animateStatCounter } from '../../shared-js/animate-stat-counter.js'`; remove the inline function body — **Spec:** REQ-JS-002
- [ ] Run `npm test` — `animate-stat-counter.test.js` and `landing-page-refactor.test.js` turn GREEN
- [ ] Verify the BtoC landing page still behaves identically in browser (manual — animating counters on scroll)

> **Review gate:** Pause for user review before Phase IP-2.

---

### Phase IP-2: Update Build Pipeline

**Prerequisite:** IP-1 GREEN.

- [ ] Open `scripts/build.js` — add two entries to `copyPublicFiles`: `b-to-b.html` and `b-to-b-pricing.html` — **Spec:** REQ-BUILD-001
- [ ] Add `b-to-b-bundle.css` entry to `prepareCSS` (brand-kit → page-style → landing-page.css → slider-switch → modal → b-to-b.css, in that order) — **Spec:** REQ-BUILD-002
- [ ] Add `b-to-b.js` entry to `buildJS` (`iife` format, same config as `landing-page.js`) — **Spec:** REQ-BUILD-003
- [ ] Run `npm run build` — must complete without errors (placeholder empty files for HTML/CSS/JS are sufficient to pass the build at this stage)
- [ ] Run `npm test` — `b-to-b-build.test.js` turns GREEN

> **Review gate:** Pause for user review before Phase IP-3.

---

### Phase IP-3: `public/css/pages/b-to-b.css` + `public/js/b-to-b.js`

**Prerequisite:** IP-2 GREEN.

#### IP-3a: `b-to-b.js`

- [ ] Create `public/js/b-to-b.js` — import `animateStatCounter` from `../../shared-js/animate-stat-counter.js`; register `IntersectionObserver` on all `[data-target]` elements, threshold 0.3, fires once per element — **Spec:** REQ-JS-003
- [ ] Run `npm run build` — verify `dist/js/b-to-b.js` is built

#### IP-3b: `b-to-b.css`

- [ ] Create `public/css/pages/b-to-b.css` — add only classes not already present in the shared CSS stack; use `var(--likened-*)` tokens throughout; no `style=""` attributes — **Spec:** REQ-INF-001 (CSS-001, CSS-004, CSS-011)
- [ ] Required layout classes to define:
  - `.b2b-stats-hook-grid` — 3-column stats grid (mirrors BtoC stats hook; check `landing-page.css` first)
  - `.b2b-differentiator-grid` — 6-item 2–3-column grid (Key Differentiators section)
  - `.cta-callout` — full-width CTA callout block style for guarantee/discovery CTA sections
  - `.reciprocal-redirect` — informational reciprocal redirect style (link-only, no CTA button)
  - Any hero copy sizing overrides specific to BtoB hero
- [ ] Run `npm run build` — verify `dist/css/b-to-b-bundle.css` is produced

> **Review gate:** Pause for user review before Phase IP-4.

---

### Phase IP-4: `public/b-to-b.html`

**Prerequisite:** IP-3 GREEN. All structural acceptance tests are still RED (expected).

Build each section in spec order. After each section, open the file in a browser to verify rendering.

#### IP-4a: Page shell

- [ ] Create `public/b-to-b.html` — copy the head, nav, and footer shell from `index.html`; replace the CSS bundle link with `css/b-to-b-bundle.css`; replace the JS script with `./js/b-to-b.js`; set `<title>` to "Likened for Talent Acquisition — Network Science-Powered Talent Mapping" — **Spec:** REQ-BTB-001, REQ-BTB-002, REQ-INF-002, REQ-INF-005, REQ-INF-006
- [ ] Nav: "Sign In" → `../app/#/dashboard`; "Pricing" → `pricing.html`; no standalone "For Individuals" link — **Spec:** REQ-INF-006

#### IP-4b: Section 1 — Hero / Mission

- [ ] `<h1>`: "Turn your Talent Acquisition function into a competitive intelligence capability" — **Spec:** REQ-BTB-010
- [ ] Sub-copy paragraph (mission statement) — **Spec:** REQ-BTB-011
- [ ] "Sign In" CTA → `app/#/dashboard` — **Spec:** REQ-BTB-012

#### IP-4c: Section 2 — Stats Hook

- [ ] Section heading: "Your TA function is drowning. The data proves it." — **Spec:** REQ-BTB-020
- [ ] Stat 1: `data-target="30"` `data-suffix="%"` + label "of a recruiter's day is spent screening profiles" — **Spec:** REQ-BTB-021
- [ ] Stat 2: `data-target="90"` `data-suffix="%"` + label "of screened candidates are unqualified" — **Spec:** REQ-BTB-021
- [ ] Stat 3: static display "8 wks → 5 days" + label "longlist delivery with Likened" — **Spec:** REQ-BTB-021
- [ ] One-line problem framing below each stat — **Spec:** REQ-BTB-022

#### IP-4d: Section 3 — How It Works

- [ ] Section heading: "From role brief to Top 100 longlist in 5 days" — **Spec:** REQ-BTB-030
- [ ] Four numbered steps with output artefact labels — **Spec:** REQ-BTB-031
- [ ] Image: `assets/images/executive-search-ta-network-science-cropped.png`, layout: steps left / image right — **Spec:** REQ-BTB-032
- [ ] "Sign In" CTA — **Spec:** REQ-BTB-033

#### IP-4e: Section 4 — Commercial Offering

- [ ] Section heading: "What Likened delivers" — **Spec:** REQ-BTB-040
- [ ] Pillar 1 — Talent Acquisition (Talent Mapping, analytics, dashboard) — **Spec:** REQ-BTB-041
- [ ] Pillar 2 — Talent Market Intelligence (5 categories with illustrative questions) — **Spec:** REQ-BTB-041
- [ ] Image: `assets/images/company-card-content-analytics.png`, layout: text left / image right — **Spec:** REQ-BTB-042
- [ ] "Sign In" CTA — **Spec:** REQ-BTB-043

#### IP-4f: Section 5 — Key Differentiators

- [ ] Section heading: "Why Likened — not another ATS plugin" — **Spec:** REQ-BTB-050
- [ ] 6-item differentiator grid (headings + one-sentence descriptions per spec table) — **Spec:** REQ-BTB-051
- [ ] Image: `assets/images/social-network-analysis-visualization.png` — **Spec:** REQ-BTB-052

#### IP-4g: Section 6 — Intelligence Questions

- [ ] Section heading: "The intelligence questions your C-Suite is asking" — **Spec:** REQ-BTB-060
- [ ] 7 questions as styled list (exact copy from spec) — **Spec:** REQ-BTB-061
- [ ] Image: `assets/images/exeksourcing-world-map.png`, layout: questions left / image right — **Spec:** REQ-BTB-062
- [ ] "Sign In" CTA — **Spec:** REQ-BTB-063

#### IP-4h: Section 7 — FAQ

- [ ] Section heading: "Frequently asked questions" — **Spec:** REQ-BTB-070
- [ ] 4 `<details>`/`<summary>` items (Talent Mapping definition, GDPR, longlist timing, augments not replaces) — **Spec:** REQ-BTB-071

#### IP-4i: Section 8 — Discovery Call CTA Block

- [ ] Section heading: "Turn your TA function into a strategic advantage" — **Spec:** REQ-BTB-080
- [ ] Supporting copy: "You're looking at augmenting Talent Mapping / Sourcing / Insights / Intelligence for your whole team? Book a discovery call with us to see how Likened can help you achieve your Talent Acquisition goals." — **Spec:** REQ-BTB-081
- [ ] "Contact Us" CTA in `class="cta-callout"` → `https://forms.gle/p67EoZcdRRpGnTfZA` — **Spec:** REQ-BTB-082

#### IP-4j: Section 9 — B2C Callout Block

- [ ] Callout heading: "Looking to future-proof your career in AI?" — **Spec:** REQ-BTB-083
- [ ] Supporting copy includes referral effectiveness and Employee Referral Program context (up to $5,000 per successful hire) — **Spec:** REQ-BTB-084
- [ ] "Learn more →" informational link → `../index.html` — **Spec:** REQ-BTB-085
- [ ] Run `npm test` — `b-to-b-page-structure.test.js` turns GREEN

> **Review gate:** Pause for user review before Phase IP-5.

---

### Phase IP-5: `public/b-to-b-pricing.html`

**Prerequisite:** IP-4 GREEN.

- [ ] Create `public/b-to-b-pricing.html` — page shell (head, nav, footer) mirroring `b-to-b.html`; load `css/b-to-b-bundle.css` — **Spec:** REQ-BTP-003
- [ ] `<title>`: "Likened for TA Teams — Pricing" — **Spec:** REQ-BTP-001
- [ ] `<h1>`: "Executive-search-grade talent intelligence. Transparent pricing." + subtitle — **Spec:** REQ-BTP-002
- [ ] 3 service tier cards in `pricing-tiers-grid` layout:
  - **Tier 1 — Longlist**: $2,000/mandate; Top 100 longlist, 7-day delivery, satisfaction guarantee; CTA → `app/#/dashboard` — **Spec:** REQ-BTP-004
  - **Tier 2 — Longlist + Market Intelligence**: $4,000/mandate; adds 4,000-profile dataset, self-serve query interface; CTA → `app/#/dashboard` — **Spec:** REQ-BTP-004
  - **Tier 3 — Full Mandate**: $4,000/mandate + $1,000/mo outreach; adds 50-prospect outreach, A/B testing, dedicated AM, 20% response guarantee; CTA → `app/#/dashboard` — **Spec:** REQ-BTP-004
- [ ] No billing toggle — per-mandate fees, no subscription cycle — **Spec:** REQ-BTP-005
- [ ] Guarantee callout block (`.cta-callout`) below tier cards with CTA button — **Spec:** REQ-BTP-006
- [ ] Reciprocal B2C redirect block (`.reciprocal-redirect`) below the guarantee callout with "Learn more →" link to `../pricing.html` and no CTA button — **Spec:** REQ-BTP-007
- [ ] Nav identical to `b-to-b.html` — **Spec:** REQ-INF-006 (nav is shared)
- [ ] Footer identical to `b-to-b.html` — **Spec:** REQ-INF-005
- [ ] Run `npm test` — `b-to-b-pricing-page-structure.test.js` turns GREEN

> **Review gate:** Pause for user review before Phase IP-6.

---

### Phase IP-6: Final Validation

- [ ] Run `npm test` — full suite GREEN, no regressions
- [ ] Run `npm run build` — completes without errors
- [ ] Manual smoke test: `b-to-b.html` in browser:
  - [ ] Dark mode toggle works (no FOUC)
  - [ ] Stats 1 and 2 animate on scroll; stat 3 is static
  - [ ] All 9 sections present with correct headings (per accepted test)
  - [ ] Product-entry CTAs navigate to `app/#/dashboard`
  - [ ] Section 8 CTA label is "Contact Us" and opens `https://forms.gle/p67EoZcdRRpGnTfZA`
  - [ ] Section 9 reciprocal link points to `../index.html`
  - [ ] Images render in all 4 sections
  - [ ] FAQ `<details>` items expand/collapse correctly
  - [ ] Nav links work ("Sign In" → `../app/#/dashboard`; "Pricing" → `pricing.html`)
- [ ] Manual smoke test: `b-to-b-pricing.html` in browser:
  - [ ] 3 tier cards render side-by-side (or stacked on mobile)
  - [ ] No billing toggle present
  - [ ] Guarantee callout block renders below tier cards
  - [ ] Reciprocal B2C callout block renders below the guarantee callout with link-only rendering (no CTA button)
  - [ ] Product-entry CTAs navigate to `app/#/dashboard`
  - [ ] Discovery CTAs route to `https://forms.gle/p67EoZcdRRpGnTfZA`

---

## 4. Dependency Inventory

### Already Available

- ✅ `shared-css/likened-brand-kit.css` — design tokens, colours, typography
- ✅ `public/css/shared/page-style.css` — base layout classes (`section-split`, `hero`, etc.)
- ✅ `public/css/pages/landing-page.css` — landing page layout classes (stats hook, section grids)
- ✅ `public/css/shared/slider-switch.css` — dark mode toggle component
- ✅ `public/css/shared/modal.css` — modal base styles
- ✅ `public/js/dark-mode.js` — dark mode script (reused as-is)
- ✅ `scripts/build.js` — build pipeline (extended, not replaced)
- ✅ `assets/images/executive-search-ta-network-science-cropped.png` — How It Works image
- ✅ `assets/images/exeksourcing-world-map.png` — Intelligence Questions image
- ✅ `assets/images/company-card-content-analytics.png` — Commercial Offering image
- ✅ `assets/images/social-network-analysis-visualization.png` — Key Differentiators image

### To Be Created

- 🆕 `shared-js/animate-stat-counter.js` — extracted from `landing-page.js`
- 🆕 `public/js/b-to-b.js` — imports from `shared-js/`; registers IntersectionObserver
- 🆕 `public/css/pages/b-to-b.css` — BtoB-specific layout overrides
- 🆕 `public/b-to-b.html` — BtoB landing page
- 🆕 `public/b-to-b-pricing.html` — BtoB pricing page

---

## 5. Risks and Mitigation

┌─────────────────────────────────────────────────────────────────────┬───────────┬─────────────┬─────────────────────────────────────────────────────┐
│ Risk                                                                │ Impact    │ Probability │ Mitigation                                          │
├─────────────────────────────────────────────────────────────────────┼───────────┼─────────────┼─────────────────────────────────────────────────────┤
│ `animateStatCounter` extraction breaks BtoC stats animation         │ 🔴 High   │ 🟡 Medium   │ Unit test before and after extraction; manual smoke  │
│                                                                     │           │             │ test on `index.html` immediately after IP-1         │
├─────────────────────────────────────────────────────────────────────┼───────────┼─────────────┼─────────────────────────────────────────────────────┤
│ CSS class duplicated from shared stack into `b-to-b.css`            │ 🟡 Medium │ 🟡 Medium   │ Audit shared CSS before writing new classes in IP-3b │
│ (violates CSS-001 / DRY)                                            │           │             │                                                     │
├─────────────────────────────────────────────────────────────────────┼───────────┼─────────────┼─────────────────────────────────────────────────────┤
│ `b-to-b-bundle.css` bundle order wrong — styles override            │ 🟡 Medium │ 🟢 Low      │ Mirror exact order from REQ-INF-001; verify in build │
│ unintentionally                                                     │           │             │                                                     │
├─────────────────────────────────────────────────────────────────────┼───────────┼─────────────┼─────────────────────────────────────────────────────┤
│ BtoB pricing page `pricing-tiers-grid` class missing from CSS       │ 🟡 Medium │ 🟡 Medium   │ Check `pricing.html` + `pricing.css` for existing    │
│ bundle (not included in b-to-b-bundle.css)                         │           │             │ `.pricing-tiers-grid` before assuming it exists      │
├─────────────────────────────────────────────────────────────────────┼───────────┼─────────────┼─────────────────────────────────────────────────────┤
│ `shared-js/` path not resolved by esbuild entry in `build.js`       │ 🔴 High   │ 🟡 Medium   │ Verify esbuild resolves `../../shared-js/` from       │
│                                                                     │           │             │ `public/js/b-to-b.js` in IP-2 before writing HTML   │
└─────────────────────────────────────────────────────────────────────┴───────────┴─────────────┴─────────────────────────────────────────────────────┘

---

## 6. Acceptance Criteria

### BtoB Landing Page (`b-to-b.html`)
- [ ] All 9 sections present with headings matching spec exactly (REQ-BTB-010, 020, 030, 040, 050, 060, 070, 080, 083)
- [ ] Stats 1 and 2 animate on scroll (IntersectionObserver, threshold 0.3); Stat 3 is static
- [ ] 4 images render in correct sections with correct layout split
- [ ] Product-entry CTAs point to `app/#/dashboard` with label "Sign In"
- [ ] Discovery CTA block uses class `.cta-callout` with label "Contact Us" and target `https://forms.gle/p67EoZcdRRpGnTfZA`
- [ ] Reciprocal redirect block uses class `.reciprocal-redirect` with "Learn more →" target `../index.html`
- [ ] 4 FAQ `<details>` items present
- [ ] Nav: "Sign In" + "Pricing" only
- [ ] Dark mode: no FOUC; `dark-mode.js` in `<head>`
- [ ] Footer: "Copyright © 2025 Likened.net | Privacy Policy"

### BtoB Pricing Page (`b-to-b-pricing.html`)
- [ ] `<h1>` and subtitle match REQ-BTP-002 exactly
- [ ] 3 service tier cards rendered (Longlist / Longlist + Market Intelligence / Full Mandate)
- [ ] Pricing displayed: $2,000 / $4,000 / $4,000 + $1,000/mo
- [ ] No billing toggle present
- [ ] Guarantee callout block below tier cards
- [ ] Reciprocal B2C callout block below the guarantee callout
- [ ] Product-entry CTAs point to `app/#/dashboard`

### Build
- [ ] `npm run build` completes without errors
- [ ] `dist/b-to-b.html`, `dist/b-to-b-pricing.html`, `dist/css/b-to-b-bundle.css`, `dist/js/b-to-b.js` all exist after build

### Regression
- [ ] `npm test` — full suite GREEN (existing BtoC tests unaffected)
- [ ] `index.html` BtoC landing page: visual appearance and behaviour unchanged (stats still animate, nav links still work)

---

## 7. References

- [b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md)
- [b-to-b-landing-page-specifications.md](../specifications/b-to-b-landing-page-specifications.md)
- [b-to-b-landing-page-feature-brief.md](../feature-briefs/b-to-b-landing-page-feature-brief.md)
- [b-to-b-commercials.md](../references/landing-page.md)
- [b-to-c-commercials.md](../references/landing-page.md) (pricing model — lines 95–115)
