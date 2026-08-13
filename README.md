# Trial Deadline

Static, no-sign-up free trial cancellation-date calculator for Cloudflare Pages.

## Deploy

1. Replace every `https://YOUR-DOMAIN.example/` in `index.html`, page metadata, `robots.txt`, and `sitemap.xml` with the production URL.
2. Replace the placeholder privacy-policy contact sentence with a real contact email.
3. In Cloudflare Pages, deploy this folder as a static site. No build command is needed; the build output directory is `/`.

## Structure

- `index.html`: calculator and main SEO landing page
- `features.html`, `about.html`, `privacy.html`: trust and policy content
- `assets/css/site.css`: shared visual system
- `assets/js/app.js`: calculator, URL sharing, and calendar generation

New tools can be added as a new HTML page, reusing the shared CSS and module script (or a new module in `assets/js/`).
