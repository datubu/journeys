# Validation

Validation performed for the initial framework and publication, 2026-10-30.

## Published deployment

- Ten public repositories under https://github.com/datubu, each with its local commit history uploaded.
- Successful content validation workflow and successful Pages deployment workflows for all nine websites.
- Nine custom domains bound to their corresponding repositories, with approved certificates and HTTPS enforcement enabled.
- HTTPS GET responses for every site's homepage and data.json returned HTTP 200.
- Each published data.json identified the correct station, used custom-domain network links and included the 11-chapter Xuanzang route.
- The full example is https://seek.datubu.com/story/xuanzang/.
- Cross-repository content dispatch remains unconfigured; content changes require manually triggering the affected website workflows.

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

## Explorer visual update, 2026-10-30

- Enlarged, cropped homepage globe with default slow rotation, an explicit pause control and a temporary hold during map gestures. Reduced-motion preferences disable default rotation; hidden and offscreen views do not advance the globe.
- Shared warm-paper and forest themes, illustrated compass guide, original SVG landscape, themed destination icons, rounded navigation and cards, and a chapter progress rail.
- Browser-reviewed Chinese and English interfaces, mobile homepage at 390px, mobile dark chapter reader, and desktop English dark archives. The mobile rotation control sits above the floating bottom navigation; reviewed pages have no horizontal page overflow.
- Six content-pipeline tests and the nine-site build/verification checks passed. All interface assets remain in the shared journeys repository.
