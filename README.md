# Ofir's Tools

Source for <https://ofirshudari1-ship-it.github.io/>, a static GitHub Pages site listing four small Windows tools (OptiGuard, Playnest, TapAct, SnapCap) and a set of Claude Code skills and agents. There is no build step: the files are served as they are.

## Structure

```
index.html            Home page (tool cards, link to Claude Code tools)
claude-tools/         Claude Code skills and agents page
optiguard/ playnest/ snapcap/ tapact/   One page per tool
latest-release.js     Keeps versions and download links in sync with GitHub Releases
404.html              Not-found page
robots.txt, sitemap.xml, favicon.svg    SEO and icon files
.nojekyll             Tells GitHub Pages to skip Jekyll processing
SECURITY.md           Security policy
```

## How release sync works

`latest-release.js` finds elements carrying these attributes, where the value is the GitHub repository name under `ofirshudari1-ship-it`:

| Attribute | Effect |
| --- | --- |
| `data-gh-version="repo"` | Text becomes the tag name, for example `v4.18.0` |
| `data-gh-version-bare="repo"` | Same, without the leading `v` |
| `data-gh-download="repo"` | `href` becomes the latest `.exe` asset URL |
| `data-gh-filename="repo"` | Text becomes the `.exe` file name |
| `data-gh-size="repo"` | Text becomes the size, for example `106.8 MB` |

It calls the public `https://api.github.com/repos/<owner>/<repo>/releases/latest` endpoint (no API key), once per repo. Every element must ship with static fallback content (a plausible version, a working `.../releases/latest` link). If the request fails, times out (8 seconds) or is rate limited, the static content stays untouched.

## Security notes

- Strict Content-Security-Policy in a `<meta>` tag on each page (`default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src https://api.github.com; base-uri 'none'; form-action 'none'; object-src 'none'`). Avoid inline scripts and inline event handlers; they will be blocked.
- Repo names are validated against `/^[A-Za-z0-9._-]+$/`, download URLs must start with `https://github.com/ofirshudari1-ship-it/`, and content is written with `textContent` only.
- All `target="_blank"` links use `rel="noopener noreferrer"`.
- See [SECURITY.md](SECURITY.md) for reporting.

## Adding a tool page

1. Create `<tool>/index.html`, copying an existing tool page so the head (CSP, canonical, Open Graph, favicon) and styles match. Use `lang="en" dir="ltr"`.
2. Use the GitHub repo name as the `data-gh-*` value and keep static fallbacks.
3. Load `../latest-release.js` with a plain `<script src>` (no inline script).
4. Add a card on `index.html` and a `<url>` entry in `sitemap.xml`.
5. Check that all internal links resolve and that no target `_blank` link lacks `rel="noopener noreferrer"`.
