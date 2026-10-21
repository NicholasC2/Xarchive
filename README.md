# Xarchive

## Current status

This project is active and still in a mid-refactor state. The app has already moved a lot of work forward, but there are several remaining gaps between the architecture, UX, auth flow, and the archive's audio/content model.

The goal is to treat this as the source of truth for required work and to keep each fix tracked in one place until the app is production-ready.

## Completed work already in place

- Multi-file song uploads are supported in the contribution form.
- The app supports song metadata for tags, genres, album association, release year, and optional cover art.
- Audio metadata stripping has been introduced through FFmpeg/WebAssembly processing.
- Archive pages and reusable UI pieces have been split into dedicated files under `app/pieces`.
- Bulk download page exists as a dedicated route and receives selectors via query parameters.
- SearchInput was centralized as a shared component and reused in the app.
- The app now distinguishes between archive entries, artist/collective pages, and audio-file handling at the route/component level.
- A dedicated bulk route was created and linked from navbar/item actions.

## Required work backlog

### 1) Core media model and song/audio distinction

- [ ] Songs need multiple audio files, where each file is a variant or version of the song rather than a separate song record.
- [ ] Songs may have multiple cover images, but the first cover is always the one used when exporting or downloading a tracked song.
- [ ] Songs and audio files are two separate things: songs are the canonical archive entries, audio files are the actual media variants attached to a song.
- [ ] Audio files should work like tracks in albums do, where you upload each file and attach all metadata in the song contribution flow; there should not be a separate audio-file contribution section.
- [ ] Audio files should support added metadata, such as bios, sources, comments, and labels, while the song itself should not carry a source field.
- [ ] Add comments to songs, audio files, artists, and albums.
- [ ] Add source metadata to audio files and keep song-level source fields out of the canonical song model.
- [ ] Ensure song upload and song download logic works properly, including stripping metadata and adding metadata back in a correct way.
- [ ] Covers should be stored and exported as the front cover metadata field, not just as a generic image.
- [ ] When exporting or downloading items, metadata should be added to the audio file using the correct fields, including cover front, title, artist, album, release year, genre, tags, and source.
- [ ] The server-side song representation must never carry embedded metadata or cover payloads; only the browser/export pipeline may add metadata and cover art during download or processing.
- [ ] Song records on the server should remain stripped and canonical, and should not store metadata or cover data as part of the persisted entry itself.

### 2) Audio processing and download quality

- [ ] Bulk download should use the maximum audio quality available from the selected files and variants.
- [ ] Tagged download processing must preserve the selected source audio stream and avoid unnecessary transcoding.
- [ ] Download behavior should prefer lossless formats first, then larger or better-quality files as a best-available quality heuristic.
- [ ] Audio files should be ordered by quality and relevance when downloaded in bulk.
- [ ] The archive should not assume measured bitrate/quality is stored yet; the implementation should still choose the best available stream by format and file metadata.
- [ ] Metadata stripping and reconstructing should work correctly with browser-side FFmpeg/WebAssembly and not corrupt the source stream.
- [ ] Verify FFmpeg WebAssembly loads and can strip and re-add metadata on a real sample file in the browser.
- [ ] Keep cover art attached appropriately as front cover, not embedded as a generic art blob.

### 3) Bulk download: filters and power

- [ ] Bulk download needs to be very powerful with filters that can include and exclude sources, tags, genres, artists, album/artist relationships, and any other archive metadata.
- [ ] Bulk download should support song-name regex filters.
- [ ] Bulk download needs to be able to filter by artist, collective, album, source, tag, genre, release year, and exact or partial title matching.
- [ ] Bulk download should support include/exclude logic and composable filter groups.
- [ ] Bulk download should be a dedicated page and should not live on the home page as a primary action.
- [ ] Bulk download should be accessible from the top bar and from relevant item pages.
- [ ] Bulk download page should be improved visually and functionally with stronger selection UX and better progress feedback.
- [ ] Bulk ZIP creation should package selected songs and their chosen variants correctly.

### 4) Search, pages, and API architecture

- [ ] Search should be separate from the home page; the home page should only surface the top 10 artists and top 10 songs, with songs sorted by downloads by default and artists sorted by views by default.
- [ ] Search results must not fetch entire collections or all songs from the database when the archive can be huge; it must request only the relevant results.
- [ ] Search should support pagination with 100 results per page.
- [ ] Search should cover albums, artists, songs, and collectives.
- [ ] Search API should filter by type and query terms, with server-side pagination and bounded result counts.
- [ ] Search result pages should be distinct from the home page and should use the shared SearchInput consistently.
- [ ] All search-related input fields must use the shared search input component, with no custom one-offs.
- [ ] SearchInput dropdown should not show the arrow dropdown chrome; it should have a cleaner, flatter drop-down style.
- [ ] SearchInput dropdown should be 100% width, without rounded borders, and should match the background color of the input field.
- [ ] The dropdown should look better and be easier to scan.

### 5) Artist, album, collective, and profile UX

- [ ] Artist page bio and AKA should use ReadMore and should have appropriate limits: AKA should be one line and bio should be five lines.
- [ ] Artist pages and collective pages should support the same image types: profile image, banner image, and additional gallery images.
- [ ] Add all relevant images to profiles and other display locations.
- [ ] Album and collective inputs need to match the styling of the other form inputs.
- [ ] The clickable area of the archive entry row should be the background area rather than only the text, so the entire row is clickable.
- [ ] Profile customization should be expanded and more consistent with the archive design.
- [ ] Home page and search page should be clearly distinct; home should be curated and search should be the full archive lookup.
- [ ] Artist/collective profile pages should show bios, gallery images, banner images, and profile images in a consistent presentation.

### 6) Auth and account flow

- [ ] Fix login; it is still broken.
- [ ] Fix Neon auth configuration and route flow so login and signup work consistently.
- [ ] Ensure the auth setup is consistent with the running app and the environment variables.
- [ ] Add `NEON_AUTH_COOKIE_SECRET` to `.env.local` and verify the config is loaded correctly.
- [ ] Investigate and clean up any peer dependency or package warnings around the auth layer.

### 7) Contribution flow and refactor cleanup

- [ ] Split each contribute tab into separate components next to `app/contribute/page.tsx` and keep it maintainable.
- [ ] Ensure the contribution form keeps the correct shared component usage and does not reimplement UI primitives in multiple places.
- [ ] Remove unused files and dead code after the refactor.
- [ ] Make the contribution flow consistent with the rest of the app and preserve reusable patterns.
- [ ] Keep all forms aligned with the shared SearchInput and repeated input styling across the app.

### 8) Archive row and component consistency

- [ ] Update every file to use the correct reusable pieces and components; remove duplicate implementations.
- [ ] All search-driven UI should be routed through the shared search input component.
- [ ] The app should not reimplement common patterns across archive, profile, artist, and collective pages.
- [ ] Audit all page and component folders for duplicate or leftover code.

### 9) Footer and global shell

- [ ] Add a footer with the relevant archive/site information.
- [ ] Ensure the footer is consistent with the design and included on all pages that need it.

### 10) Structure cleanup and final polish

- [ ] Clean up folder structure and remove unused files, dead modules, and stale routes.
- [ ] Refactor the app and `lib` directories so the folder structure stays clean and logical.
- [ ] Review every file for unused imports, duplicate patterns, and stale naming.
- [ ] Standardize naming and ensure component folders are in the expected locations.
- [ ] Keep the project organized and maintainable as more archive features are added.

## Prioritized current blockers

1. Fix auth/login.
2. Make the song/audio model consistent and correct.
3. Finish bulk download quality and filter system.
4. Clean up search API, pagination, and home/search split.
5. Standardize artist/album/collective forms and images.
6. Finish archive row and page clickability, footer, and cleanup pass.

## Notes for implementation

- Use the shared SearchInput wherever search/autocomplete is required.
- Keep the contribution form organized by tab/component instead of monolithic logic.
- Use `ReadMore` on long text blocks like bio and AKA, especially on artist and profile screens.
- Keep page-level bulk functionality separate from home-page browsing.
- Treat the archive as a huge searchable dataset, so all large query paths must remain paginated and filtered server-side.
- Verify network/CORS and FFmpeg performance in the deployment target before finalizing the audio workflow.

## Reminder for the next pass

Before any final push or merge, intentionally resolve outstanding conflicts and confirm the final codebase is in the correct shape: no stale route names, no duplicate UI implementations, no broken auth flow, and no incomplete archive model mismatches.