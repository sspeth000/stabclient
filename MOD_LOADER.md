# StabClient Mod Loader

The mod loader reads `availablemods.json` from the separate `sspeth000/stabfish-mods` repository.

## Catalog format

Each catalog entry contains the normal listing metadata plus a `manifest` path relative to the repository root:

```json
{
  "schemaVersion": 1,
  "mods": [
    {
      "id": "test-mod",
      "name": "Test Mod",
      "version": "1.0.0",
      "author": "Bash",
      "description": "A simple test mod.",
      "category": "Testing",
      "homepage": "https://github.com/sspeth000/stabfish-mods",
      "manifest": "mods/test-mod/manifest.json"
    }
  ]
}
```

## Mod folder format

A mod has its own directory. The manifest declares its entry point, resources, and requested permissions.

```text
mods/
  test-mod/
    manifest.json
    main.js
    styles.css
    panel.html
    assets/
      icon.png
```

Example manifest:

```json
{
  "manifestVersion": 1,
  "id": "test-mod",
  "name": "Test Mod",
  "version": "1.0.0",
  "author": "Bash",
  "description": "A simple test mod.",
  "entry": "main.js",
  "resources": {
    "scripts": ["main.js"],
    "styles": [],
    "html": [],
    "assets": []
  },
  "permissions": ["custom-ui"]
}
```

## Runtime behavior

- Installing a mod saves it locally. Enabling it fetches and validates its manifest and entry script.
- The entry script runs in a sandboxed iframe with scripts enabled, but without same-origin access or network access.
- Mods cannot access the parent page's DOM directly.
- Mods currently receive no loader-provided JavaScript APIs. Their scripts run in an isolated iframe and cannot access the parent page's DOM or network.
- Disabling or removing a mod destroys its sandbox.
- The loader currently loads the manifest's `entry` script only. The other resource lists are reserved for future CSS, HTML, and asset support.
- Keep the manifest's `permissions` array empty until specific, narrowly scoped APIs are introduced.

The runtime is an initial foundation. Review community mod code and expand the API deliberately rather than granting unrestricted access to the game page.
