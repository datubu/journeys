# Local validation

Validation performed for the initial framework, 2026-10-30. GitHub Actions execution, public Pages URLs, DNS bindings and HTTPS certificates are not yet tested because publication is deferred.

## Automated

- All nine website configurations and distinct domain mappings.
- Ten independent local Git repositories and nine parsed GitHub Pages workflows.
- One route with 11 paired chapters, 10 paired places, one paired person and seven paired references.
- Required frontmatter, stable translation IDs, shared metadata, source references, person/place references, chapter order and coordinate bounds.
- Individual website builds and connected nine-site preview output.
- Nested story assets, standalone manifests, scoped app-shell cache and text-only reading output.
- Six content-pipeline tests: one edit propagates to multiple sites; arbitrary checkout directory works; missing translations fail; missing references fail; draft routes are excluded; active HTML fails; a second route gets a separate static story page. The first item is one combined test, for six tests total.

## Browser

- English/Chinese switch changes chapter prose and navigation together.
- Light/dark theme switch; preferences are carried through cross-site links.
- Desktop route reader and satellite/terrain display.
- Chapter selection, local save and stored reading progress.
- Source search (UNESCO) and linked person/place records.
- Mobile 390px layout, bottom navigation, reader panel and absence of horizontal overflow.

Review screenshots are saved beside the repositories in ../review/. Satellite and terrain service availability is external to the static app. Cached text/app shell does not imply offline map availability.
