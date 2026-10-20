xarchive

## Handoff: Audio Archive Work

Status: paused mid-implementation on 2026-10-20. Continue from the checklist below; do not restart the completed route and component moves.

### Completed

- Added song metadata columns for tags, genres, album association, and release year; song cover art is stored on the song and an associated album's cover takes priority.
- Added `archive_audio_files` with an idempotent migration from legacy song audio. Song POST accepts 1-10 cleaned audio files (8 MB each, 32 MB combined).
- Added `lib/audio-processing.ts`; `/contribute` calls lossless FFmpeg WebAssembly stream-copy remuxing to strip embedded tags/art before upload.
- Added song metadata and multi-file selection to `app/contribute/page.tsx`.
- Moved archive home into `app/page.tsx`; reusable components live under `app/pieces` (`peices` spelling corrected). Removed the old one-use archive-home and artist-names modules; renamed SearchInput to `search-input.tsx`.
- Renamed `/add-song` to `/contribute` and updated links.
- Installed `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/util`, and `jszip`.

### Remaining Checklist

- [ ] Update `app/api/archive/[id]/audio/route.ts` to read a selected row from `archive_audio_files` (`?file=<id>`), with a best-available default and legacy fallback. The current route still reads `archive_entries.file_url` only.
- [ ] Wire `lib/audio-file-summary.ts` into archive, artist, and profile GET APIs so they return each file's id, name, type, size, and URL without returning audio base64. The helper is currently unused.
- [ ] Use or remove `lib/audio-response.ts`; it is currently unused.
- [ ] Update `app/pieces/archive-entry-row.tsx` to render audio variants in a tidy list under each song, with playback and per-file download controls. It currently renders only one player.
- [ ] Add temporary tagged-download processing with song title, artist, album, release year, genre, tags, and song/album cover. Preserve the selected source audio stream; do not transcode. Prefer lossless formats first, then larger files as a best-available quality heuristic (the archive does not store measured bitrate/quality yet).
- [ ] Add bulk-download controls with artist, genre, tag, and release-year filters; package selected songs into a ZIP using `jszip`.
- [ ] Add CSS for the new `.audio-file-list` and `.genre-options` form elements.
- [ ] Run `npx tsc --noEmit` and `npm run lint`; verify FFmpeg WebAssembly loads and can strip/tag a sample file in the browser.

Notes: `next typegen` was run after the route rename; a stale `.next/dev/types/validator.ts` was removed, and `npx tsc --noEmit` passed after the multi-file form change. Re-run checks after wiring the remaining audio helpers. FFmpeg core is currently fetched from the pinned unpkg URL in the browser, so verify network/CORS behavior in the target deployment.

GitHub sync: local `main` is 3 commits ahead and 1 commit behind `origin/main`. A read-only merge preview found conflicts in `app/add-song/page.tsx`, `app/pieces/search.css`, `package.json`, and `package-lock.json`. No merge, rebase, reset, push, or new commit was performed. Resolve the conflicts intentionally before pushing.