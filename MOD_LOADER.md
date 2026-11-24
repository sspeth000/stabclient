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
  "permissions": []
}
```

## Runtime behavior

- Installing a mod saves it locally. Enabling it fetches and validates its manifest and entry script.
- The entry script is injected directly into the page and runs unsandboxed in the page's JavaScript context.
- Mods use ordinary browser JavaScript and the page DOM directly. There is no mod UI API and no iframe.
- Each mod creates, styles, updates, and removes its own UI.
- Mods are trusted first-party code. They can read or change page content and interact with anything available to page scripts. Only use code you wrote or carefully reviewed.
- Removing a script element does not undo code that already ran. After disabling or removing an enabled mod, refresh the page to fully stop its running code and clear its UI, listeners, and timers.
- All installed mods start disabled after a full page reload.
- The loader currently loads the manifest's `entry` script only. The other resource lists are reserved for future CSS, HTML, and asset support.
- Keep the manifest's `permissions` array empty until specific, narrowly scoped APIs are introduced.

The runtime is an initial foundation. Mods currently have no loader-provided APIs and remain isolated from the game page.
