# Xarchive

Xarchive is a community-built music archive. It stores song and artist entries, audio files, profile images, listener bios, and follow relationships in Neon Postgres. Lyrics are intentionally represented by uploaded audio files and recording notes.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values from your Neon project.
3. Enable Neon Auth for the project and set its auth URL and cookie secret.
4. Start the app with `npm run dev`.

The required server variables are `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`. The Next auth client uses the same-origin `/api/auth` proxy; no auth secret is exposed to the browser. `DATABASE_URL_UNPOOLED` and `NEON_BRANCH` are optional and are not used by the application.

The archive tables are created automatically on the first API request. The database role must be allowed to create tables and indexes. For production, run this schema setup through a migration before deploying and use a restricted application role afterward.

## Contributing

Contributions require an account. Song entries include an audio file, artist name(s), a source, and optional notes. Artist entries include a name, optional aliases, an optional image, and a short bio. Audio uploads are limited to 8 MB; profile and artist images are limited to 2 MB and accepted as PNG, JPG, GIF, or WebP. Files are stored directly in Postgres, so configure database capacity and backups accordingly.

Profiles support display names, bios, profile images, and follower/following lists. The archive can be browsed without signing in.

## Checks

- `npm run lint`
- `npm run build`