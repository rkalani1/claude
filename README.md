# Learn Claude

Learn Claude - a beginner-first guide for using Claude across chat, uploads, Research, Projects, Artifacts, Design, Cowork, Code, Office, Chrome, connectors, skills, plugins, and model fit without jargon.

Live site: https://rkalani1.github.io/claude/

## Data Boundary

The public site is an educational guide. Do not paste PHI, patient identifiers, learner records, credentials, confidential data, or restricted research data into prompts or exported prompt packs.

## Develop

This is a static site. Open `index.html` directly or serve the folder locally:

```sh
python3 -m http.server 8129
```

## Verify

- Check source links in the Sources section.
- Run a browser accessibility pass on desktop and mobile.
- Confirm task picker, prompt lab, model fit, answer fixer, reusable templates, prompt export, agent workflow prompt, feature posts, disclosure panels, and prompt copy buttons work.
- Toggle your OS between light and dark appearance and confirm the page follows it.
- Scroll the page and confirm the active section is highlighted in the top navigation.

## Structure

- `index.html` — markup, metadata (Open Graph, Twitter, JSON-LD), and content.
- `styles.css` — editorial design system with light/dark palettes (CSS custom properties).
- `app.js` — task picker, prompt builder, answer fixer, prompt export, and active-nav highlighting.
- `site.webmanifest`, `robots.txt`, `sitemap.xml`, `og-image.svg`, `favicon.svg` — PWA, SEO, and social assets.

## License

MIT. This site is independent and is not affiliated with or endorsed by Anthropic.
