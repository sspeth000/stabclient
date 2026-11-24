/* StabClient Mod Loader
 * Loads manifest-based mods in isolated, script-only iframes.
 * Mods run in isolated, script-only iframes and cannot access the parent DOM.
 */
(function () {
  'use strict';

  var CATALOG_URL = window.STABCLIENT_MOD_CATALOG_URL ||
    'https://raw.githubusercontent.com/sspeth000/stabfish-mods/main/availablemods.json';
  var CATALOG_API_URL =
    'https://api.github.com/repos/sspeth000/stabfish-mods/contents/availablemods.json?ref=main';
  var MOD_BASE_URL = 'https://raw.githubusercontent.com/sspeth000/stabfish-mods/main/';
  var STORAGE_KEY = 'stabclient.mods.v1';
  var panel = document.getElementById('StabClientMainMenu');
  if (!panel) return;

  var list = document.getElementById('scModsList');
  var status = document.getElementById('scModsStatus');
  var refreshButton = document.getElementById('scModsRefresh');
  var searchInput = document.getElementById('scModsSearch');
  var installed = readInstalled();
  var catalog = [];
  var activeMods = Object.create(null);

  function readInstalled() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) {
      return {};
    }
  }

  function saveInstalled() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));
      return true;
    } catch (_) {
      setStatus('Could not save mod settings. Check this browser’s storage permissions.', true);
      return false;
    }
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? '#fca5a5' : '#cbd5e1';
  }

  function validMod(mod) {
    return !!mod &&
      typeof mod.id === 'string' && /^[a-z0-9][a-z0-9-]{1,47}$/.test(mod.id) &&
      typeof mod.name === 'string' && mod.name.length > 0 && mod.name.length <= 60 &&
      typeof mod.version === 'string' && mod.version.length <= 24 &&
      typeof mod.description === 'string' && mod.description.length <= 220 &&
      typeof mod.author === 'string' && mod.author.length <= 48 &&
      (mod.manifest === undefined || validRelativePath(mod.manifest));
  }

  function validRelativePath(path) {
    return typeof path === 'string' && path.length > 0 && path.length <= 180 &&
      path.charAt(0) !== '/' && path.indexOf('..') === -1 &&
      /^[a-zA-Z0-9._/-]+$/.test(path);
  }

  function normalizeCatalog(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.mods)) {
      throw new Error('The catalog format is not supported (expected schemaVersion 1).');
    }
    var seen = Object.create(null);
    return data.mods.filter(function (mod) {
      if (!validMod(mod) || seen[mod.id]) return false;
      seen[mod.id] = true;
      return true;
    }).map(function (mod) {
      return {
        id: mod.id,
        name: mod.name,
        version: mod.version,
        description: mod.description,
        author: mod.author,
        // Older cached catalogs may not include the manifest field yet.
        manifest: typeof mod.manifest === 'string' ? mod.manifest : 'mods/' + mod.id + '/manifest.json',
        category: typeof mod.category === 'string' ? mod.category.slice(0, 32) : 'Other',
        homepage: typeof mod.homepage === 'string' && /^https:\/\//i.test(mod.homepage) ? mod.homepage : ''
      };
    });
  }

  function makeButton(label, className, action, id) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.setAttribute('data-mod-action', action);
    button.setAttribute('data-mod-id', id);
    return button;
  }

  function render() {
    var query = (searchInput.value || '').trim().toLowerCase();
    list.textContent = '';
    var visible = catalog.filter(function (mod) {
      return !query || [mod.name, mod.description, mod.author, mod.category]
        .join(' ').toLowerCase().indexOf(query) !== -1;
    });

    if (!visible.length) {
      var empty = document.createElement('div');
      empty.className = 'sc-mods-empty';
      empty.textContent = catalog.length ? 'No mods match that search.' : 'No mods found in the catalog yet.';
      list.appendChild(empty);
      return;
    }

    visible.forEach(function (mod) {
      var record = installed[mod.id];
      var card = document.createElement('article');
      card.className = 'sc-mod-card';

      var heading = document.createElement('div');
      heading.className = 'sc-mod-heading';
      var title = document.createElement('strong');
      title.textContent = mod.name;
      var version = document.createElement('span');
      version.className = 'sc-mod-version';
      version.textContent = 'v' + mod.version;
      heading.appendChild(title);
      heading.appendChild(version);

      var description = document.createElement('p');
      description.textContent = mod.description;
      var meta = document.createElement('div');
      meta.className = 'sc-mod-meta';
      meta.textContent = mod.category + ' · by ' + mod.author;

      var actions = document.createElement('div');
      actions.className = 'sc-mod-actions';
      if (!record) {
        actions.appendChild(makeButton('Install', 'sc-mod-button primary', 'install', mod.id));
      } else {
        var state = document.createElement('span');
        state.className = 'sc-mod-installed';
        state.textContent = record.enabled ? 'Installed · enabled' : 'Installed · disabled';
        actions.appendChild(state);
        actions.appendChild(makeButton(record.enabled ? 'Disable' : 'Enable', 'sc-mod-button', 'toggle', mod.id));
        actions.appendChild(makeButton('Remove', 'sc-mod-button danger', 'remove', mod.id));
      }
      if (mod.homepage) {
        var link = document.createElement('a');
        link.href = mod.homepage;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'sc-mod-link';
        link.textContent = 'Project page';
        actions.appendChild(link);
      }

      card.appendChild(heading);
      card.appendChild(description);
      card.appendChild(meta);
      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  async function fetchCatalogData() {
    var rawResponse = await fetch(CATALOG_URL, {
      cache: 'no-store',
      credentials: 'omit'
    });
    if (rawResponse.ok) return rawResponse.json();

    // GitHub's Contents API is a fallback if raw.githubusercontent.com is unavailable.
    var apiResponse = await fetch(CATALOG_API_URL, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!apiResponse.ok) {
      throw new Error('Catalog request failed (raw: ' + rawResponse.status +
        ', GitHub API: ' + apiResponse.status + ').');
    }

    var file = await apiResponse.json();
    if (file.encoding !== 'base64' || typeof file.content !== 'string') {
      throw new Error('GitHub returned an unexpected catalog file format.');
    }
    var binary = atob(file.content.replace(/\s/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  async function fetchModFile(path, relativeTo) {
    if (!validRelativePath(path)) throw new Error('The mod contains an unsafe file path.');
    var fileUrl = new URL(path, relativeTo || MOD_BASE_URL);
    var baseUrl = new URL(MOD_BASE_URL);
    if (fileUrl.origin !== baseUrl.origin ||
        fileUrl.pathname.indexOf('/sspeth000/stabfish-mods/main/') !== 0) {
      throw new Error('The mod file path points outside the mod repository.');
    }
    var response = await fetch(fileUrl.toString(), {
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response.ok) throw new Error('Could not fetch ' + path + ' (HTTP ' + response.status + ').');
    return response.text();
  }

  function stopMod(id) {
    var runtime = activeMods[id];
    if (!runtime) return;
    if (runtime.panel) runtime.panel.remove();
    if (runtime.frame) runtime.frame.remove();
    delete activeMods[id];
  }

  function makeSandboxDocument() {
    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\';">' +
      '</head><body><script>' +
      '(function(){' +
      'window.addEventListener("message",function(event){' +
      'var data=event.data;' +
      'if(event.source!==window.parent||!data||data.type!=="stabclient-init")return;' +
      'var script=document.createElement("script");' +
      'script.textContent=String(data.source||"");' +
      'document.body.appendChild(script);' +
      '});' +
      '})();' +
      '<\\/script></body></html>';
  }

  async function startMod(mod) {
    if (activeMods[mod.id]) return;
    var manifest;
    try {
      manifest = JSON.parse(await fetchModFile(mod.manifest));
    } catch (error) {
      throw new Error('Manifest error: ' + (error.message || 'Could not read manifest.'));
    }

    if (!manifest || manifest.manifestVersion !== 1 || manifest.id !== mod.id ||
        !validRelativePath(manifest.entry) || !Array.isArray(manifest.permissions)) {
      throw new Error('The mod manifest is invalid or unsupported.');
    }
    var manifestUrl = new URL(mod.manifest, MOD_BASE_URL).toString();
    var source = await fetchModFile(manifest.entry, manifestUrl);
    var frame = document.createElement('iframe');
    frame.title = 'Isolated mod: ' + mod.name;
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-20px;top:-20px;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    var token = mod.id + ':' + Date.now() + ':' + Math.random().toString(36).slice(2);
    activeMods[mod.id] = { frame: frame, panel: null, token: token };

    frame.srcdoc = makeSandboxDocument();
    frame.onload = function () {
      if (!activeMods[mod.id] || activeMods[mod.id].frame !== frame) return;
      frame.contentWindow.postMessage({
        type: 'stabclient-init',
        token: token,
        source: source
      }, '*');
    };
    document.body.appendChild(frame);
  }

  async function loadCatalog() {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Loading…';
    setStatus('Connecting to the StabClient mod catalog…');
    try {
      var data = await fetchCatalogData();
      catalog = normalizeCatalog(data);
      render();
      setStatus('Catalog loaded: ' + catalog.length + ' mod' + (catalog.length === 1 ? '' : 's') + '.');

      var enabled = catalog.filter(function (mod) {
        return installed[mod.id] && installed[mod.id].enabled;
      });
      for (var i = 0; i < enabled.length; i++) {
        try {
          await startMod(enabled[i]);
        } catch (error) {
          installed[enabled[i].id].enabled = false;
          saveInstalled();
          setStatus(enabled[i].name + ' could not start: ' + error.message, true);
        }
      }
      render();
    } catch (error) {
      catalog = [];
      render();
      setStatus(error && error.message ? error.message : 'Could not load the mod catalog.', true);
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  }

  list.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-mod-action]');
    if (!button || !list.contains(button)) return;
    var id = button.getAttribute('data-mod-id');
    var action = button.getAttribute('data-mod-action');
    var mod = catalog.find(function (item) { return item.id === id; });
    if (!mod) return;

    if (action === 'install') {
      installed[id] = { version: mod.version, enabled: false };
      if (!saveInstalled()) return;
      setStatus(mod.name + ' installed. Enable it to load the mod.');
    } else if (action === 'toggle' && installed[id]) {
      if (installed[id].enabled) {
        stopMod(id);
        installed[id].enabled = false;
        if (!saveInstalled()) return;
        setStatus(mod.name + ' disabled.');
      } else {
        button.disabled = true;
        button.textContent = 'Loading…';
        setStatus('Loading ' + mod.name + '…');
        try {
          await startMod(mod);
          installed[id].enabled = true;
          installed[id].version = mod.version;
          if (!saveInstalled()) {
            stopMod(id);
            installed[id].enabled = false;
            return;
          }
          setStatus(mod.name + ' enabled.');
        } catch (error) {
          stopMod(id);
          installed[id].enabled = false;
          saveInstalled();
          setStatus(mod.name + ' could not start: ' + error.message, true);
        }
      }
    } else if (action === 'remove') {
      stopMod(id);
      delete installed[id];
      if (!saveInstalled()) return;
      setStatus(mod.name + ' removed.');
    }
    render();
  });

  refreshButton.addEventListener('click', loadCatalog);
  searchInput.addEventListener('input', render);
  loadCatalog();
})();
