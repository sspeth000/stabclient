# StabClient Mod Catalog

The first mod-loader version reads a single `availablemods.json` file from `sspeth000/stabfish-mods` at `availablemods.json`.

## Catalog format

The live catalog is maintained in `https://github.com/sspeth000/stabfish-mods/blob/main/availablemods.json`.

Required top-level fields:

- `schemaVersion`: currently `1`.
- `mods`: an array of mod listing objects.

Required fields on each listing:

- `id`: unique lowercase ID using letters, numbers, and hyphens (2–48 characters).
- `name`: display name (up to 60 characters).
- `version`: version string.
- `author`: creator name (up to 48 characters).
- `description`: short description (up to 220 characters).

Optional fields:

- `category`: short category label.
- `homepage`: HTTPS project page.

## What this version does

- Downloads and validates catalog metadata.
- Displays searchable mod cards.
- Saves install, enable, disable, and remove choices in browser local storage.
- Uses text-only DOM rendering for catalog content.

**Important:** this first version does not download or execute mod JavaScript. The enabled flag is currently a saved preference only. A later runtime should use a documented, permission-limited API and an isolated sandbox before any community code can run.
