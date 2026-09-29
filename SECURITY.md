# Security Policy

This repository is a static GitHub Pages site. It has no server-side code, no database, no user accounts and no cookies.

## Reporting a vulnerability

Please report security issues privately using GitHub's "Report a vulnerability" feature on the Security tab of this repository (private vulnerability reporting). If that is not available, open an issue that describes the problem in general terms without exploit details, and the maintainer will follow up.

Please include the affected page or file, steps to reproduce, and the expected impact. You can expect an initial response within a few days.

## Scope

In scope: the HTML, CSS and JavaScript in this repository, including `latest-release.js`, and the Content-Security-Policy applied to the pages.

Out of scope: GitHub Pages infrastructure, GitHub's API, and third-party services (Google Fonts). Report those to their owners. The downloadable tools themselves are built and released from their own repositories.

## Design notes

- Each page carries a strict Content-Security-Policy via a `<meta>` tag, because GitHub Pages cannot set response headers. Meta CSP cannot enforce `frame-ancestors`, so the site cannot prevent being framed.
- Scripts are loaded from the same origin only; no inline scripts run (JSON-LD is a non-executable data block).
- `latest-release.js` validates repository names, accepts download links only under `https://github.com/ofirshudari1-ship-it/`, writes with `textContent`/`setAttribute` only, and times out after 8 seconds.
- External links that open in a new tab use `rel="noopener noreferrer"`.
