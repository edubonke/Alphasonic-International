# Stitch redesign verification

Source: the provided Stitch ZIP, four named desktop screens and Architectural Precision Modern design specification.

- Preserved original brand artwork without modifying files.
- All 20 source photographs are retained in the selected works page; optimized thumbnails point to the original full-size media in the viewer.
- Both original MP4 paths remain in the portfolio with autoplay, muted, inline, looping playback and controls.
- Existing form review and WhatsApp handoff, local browser draft, and social/contact links are preserved.
- Each of four pages has a single H1, unique IDs, and no missing local media or file references.
- JavaScript syntax checks pass.
- Source screens reviewed for layout, palette, typography and hierarchy. Real media and verified business copy take precedence over unverified imagery or statements in the mockups.

## Browser QA

GitHub Actions runs the Playwright browser suite in Chrome against the actual pull-request files. Full-page screenshots cover all four pages at 1365 × 900 (desktop) and 390 × 844 (mobile). The [successful browser run and screenshots](https://github.com/edubonke/Alphasonic-International/actions/runs/44700954080) cover:

- Desktop and mobile layouts, images, heading structure and horizontal overflow; rendered screenshots inspected for spacing, typography, media and navigation.
- Home execution-stage tabs, service filters and quote preselection.
- Quote wizard required fields, South African phone validation, review summary, WhatsApp handoff URL and clearing saved details. No actual WhatsApp message sent.
- Portfolio filters, 20 original project photographs, gallery viewer, next image and Escape to close.
- Both original videos decode and play in Chrome with muted looping playback.
- Mobile menu, navigation, portfolio filtering and image viewer.
- No application JavaScript errors.

The repeatable QA suite is in `tests/browser-qa.cjs` and `.github/workflows/browser-qa.yml`. It also includes a mobile quote-wizard review check. The PR's final workflow is the release gate. Browser checks cover Chrome desktop and responsive mobile emulation, not physical devices or every browser engine.
