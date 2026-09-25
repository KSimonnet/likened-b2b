# Likened B2B Site

This repository is the dedicated B2B landing site for the canonical B2B hostname.

## Source structure

`public/` is the canonical static-site source root:

- `public/assets/` contains fonts, images, and videos.
- `public/css/` contains browser stylesheets.
- `public/js/` contains browser JavaScript entry points and local modules.
- `public/index.html` and `public/pricing.html` are the page entry points.

`npm run build` copies `public/` to the generated, ignored `dist/` directory and bundles `public/js/b-to-b.js` for browser delivery. Do not add parallel `assets/`, `css/`, or `js/` directories at the repository root.

## Local preview

```bash
npx http-server public -p 8080
```

Then open http://localhost:8080/

## Deploy

The GitHub Pages workflow builds the site and publishes `dist/` to `b2b.likened.net`.
