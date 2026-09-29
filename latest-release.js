/*
 * latest-release.js
 *
 * Small, dependency-free helper that keeps a static landing page in sync with
 * the latest published GitHub Release for a repo under the
 * "ofirshudari1-ship-it" account, using GitHub's public unauthenticated REST
 * API (no API key needed, no build step).
 *
 * Usage: mark elements with one of these data attributes, where <repo> is the
 * GitHub repo name (e.g. "optiguard", "playnest", "tapact", "snapcap"):
 *
 *   data-gh-version="<repo>"       -> element's text becomes the tag name
 *                                      exactly as GitHub reports it, e.g. "v4.18.0"
 *   data-gh-version-bare="<repo>"  -> same, but without a leading "v", e.g. "4.18.0"
 *                                      (handy for phrasing like "Version 4.18.0")
 *   data-gh-download="<repo>"      -> element's href is set to the release's
 *                                      .exe asset download URL
 *   data-gh-filename="<repo>"      -> element's text becomes the .exe asset's
 *                                      file name, e.g. "OptiGuard-Setup-4.18.0.exe"
 *   data-gh-size="<repo>"          -> element's text becomes the .exe asset's
 *                                      human-readable size, e.g. "106.8 MB"
 *
 * Resilience: every HTML element carrying one of these attributes must already
 * contain sensible static fallback content (a plausible version string, a
 * working .../releases/latest link, a plausible filename). If the fetch fails
 * for any reason (offline, GitHub down, rate-limited, blocked) that static
 * content is left exactly as it was — nothing is ever cleared or replaced
 * with an error state.
 */
(function () {
  'use strict';

  var GH_OWNER = 'ofirshudari1-ship-it';
  var REPO_RE = /^[A-Za-z0-9._-]+$/;
  var DOWNLOAD_PREFIX = 'https://github.com/' + GH_OWNER + '/';
  var TIMEOUT_MS = 8000;
  var releaseCache = {};

  // Only accept https://github.com/<owner>/... URLs for the owner we trust.
  function isSafeDownloadUrl(url) {
    return typeof url === 'string' && url.indexOf(DOWNLOAD_PREFIX) === 0 && !/[\s"'<>]/.test(url);
  }

  // Attribute values are matched by iterating, never interpolated into a selector.
  function forEachWithAttr(attr, repo, fn) {
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      if (el.getAttribute(attr) === repo) fn(el);
    });
  }

  function fetchLatestRelease(repo) {
    if (releaseCache[repo]) return releaseCache[repo];
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;
    var opts = { headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', referrerPolicy: 'no-referrer' };
    if (controller) opts.signal = controller.signal;
    releaseCache[repo] = fetch(
      'https://api.github.com/repos/' + GH_OWNER + '/' + encodeURIComponent(repo) + '/releases/latest',
      opts
    ).then(function (res) {
      if (!res.ok) throw new Error('GitHub API responded ' + res.status + ' for ' + repo);
      return res.json();
    }).then(function (data) {
      if (timer) clearTimeout(timer);
      return data;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
    return releaseCache[repo];
  }

  function findExeAsset(release) {
    if (!release || !Array.isArray(release.assets)) return null;
    for (var i = 0; i < release.assets.length; i++) {
      if (release.assets[i] && typeof release.assets[i].name === 'string' && /\.exe$/i.test(release.assets[i].name)) return release.assets[i];
    }
    return null;
  }

  function formatSize(bytes) {
    if (!bytes || typeof bytes !== 'number') return '';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function applyRelease(repo, release) {
    var version = release && typeof release.tag_name === 'string' ? release.tag_name : '';
    if (!/^[A-Za-z0-9._+-]{1,40}$/.test(version)) version = '';
    var versionBare = version.replace(/^v/i, '');
    var asset = findExeAsset(release);

    if (version) {
      forEachWithAttr('data-gh-version', repo, function (el) { el.textContent = version; });
      forEachWithAttr('data-gh-version-bare', repo, function (el) { el.textContent = versionBare; });
    }

    if (asset) {
      if (isSafeDownloadUrl(asset.browser_download_url)) {
        forEachWithAttr('data-gh-download', repo, function (el) {
          el.setAttribute('href', asset.browser_download_url);
        });
      }
      if (/^[\w.\- ()+]{1,120}$/.test(asset.name)) {
        forEachWithAttr('data-gh-filename', repo, function (el) { el.textContent = asset.name; });
      }
      var size = formatSize(asset.size);
      if (size) {
        forEachWithAttr('data-gh-size', repo, function (el) { el.textContent = size; });
      }
    }
  }

  function initRepo(repo) {
    fetchLatestRelease(repo)
      .then(function (release) {
        applyRelease(repo, release);
      })
      .catch(function (err) {
        // Offline, GitHub unreachable, rate-limited, or CORS-blocked: do
        // nothing and keep whatever static fallback is already in the HTML.
        if (window.console && console.warn) {
          console.warn('[latest-release] keeping static fallback for "' + repo + '":', err);
        }
      });
  }

  function collectRepos() {
    var repos = {};
    var selector = '[data-gh-version],[data-gh-version-bare],[data-gh-download],[data-gh-filename],[data-gh-size]';
    document.querySelectorAll(selector).forEach(function (el) {
      var repo =
        el.getAttribute('data-gh-version') ||
        el.getAttribute('data-gh-version-bare') ||
        el.getAttribute('data-gh-download') ||
        el.getAttribute('data-gh-filename') ||
        el.getAttribute('data-gh-size');
      if (repo && REPO_RE.test(repo)) repos[repo] = true;
    });
    return Object.keys(repos);
  }

  function init() {
    collectRepos().forEach(initRepo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
