# Journeys · 大徒步网站源码

This repository is both the main website (`datubu.com`) and the shared website code used by eight other Datubu website repositories. **There is no separate journey-engine repository.** All narrative content is read from the sibling **human-journeys** repository at build time.

## Local preview

```sh
npm ci
npm run build:all
npm run check
npm run preview
```

Open http://127.0.0.1:4180/. All ten repositories should be sibling directories. The preview uses `/main/`, `/move/`, `/war/`, `/road/`, `/seek/`, `/quest/`, `/map/`, `/walk/` and `/docs/` to simulate the nine production domains. No custom hostnames or system settings are changed.

## Build a single site

`npm run build` builds the main site to `dist/`. `SITE_CONFIG`, `CONTENT_DIR`, `OUTPUT_DIR`, `GITHUB_OWNER`, `CONTENT_REF`, `ENGINE_REF` and `NETWORK_MODE` can override build inputs. Website wrapper repositories have their own `npm run build` command and site configuration; they reuse this code rather than copying it.

## Content pipeline

Markdown + YAML → bilingual and reference validation → compiled content JSON + static HTML → GitHub Pages artifact. The reader, globe, 3D terrain and chapter navigation use that compiled data. An independent text-only reading page is also generated. Runtime does not require GitHub API access or execute Markdown.

## Features

- Chinese/English switching for interface, chapter text, place records and sources.
- System-aware light/dark themes with manual override; language and theme are carried in cross-site links.
- Mobile bottom navigation, safe-area padding, chapter reading panel and standalone web manifest.
- Local saved journeys and reading progress; no cross-domain account synchronization is claimed.
- Offline app-shell/text cache; satellite imagery and terrain tiles still require a network connection.
- Eleven selected Xuanzang chapters with outbound and return schematics, ten places, one person and seven source records.
- Other themes currently present introduction pages without invented full routes.

## Publication

GitHub owner: datubu. Repositories and Pages are managed under https://github.com/datubu. Domain activation is separate from code upload and requires DNS readiness. See [DEPLOYMENT.md](DEPLOYMENT.md) for the prepared upload flow and domain mapping. Dependencies are lockfile-pinned. `build-info.json` records the exact resolved content and engine commits on GitHub Actions builds.

## Licenses

Original software: MIT. Original content and schematic geography in human-journeys: CC BY 4.0. MapLibre GL JS retains its bundled license. Satellite imagery, terrain data, external fonts and referenced publications retain their respective terms and attribution. No satellite tile archive is bundled.
