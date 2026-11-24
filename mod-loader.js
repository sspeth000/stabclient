/* StabClient Mod Loader
 * Catalog + install-state manager. This version deliberately does not execute
 * downloaded JavaScript. A sandboxed, permission-limited runtime can be added
 * after the public mod API is finalized.
 */
(function () {
  'use strict';

  var CATALOG_URL = window.STABCLIENT_MOD_CATALOG_URL ||
    'https://raw.githubusercontent.com/sspeth000/stabclient-mods/main/availablemods.json';
  var STORAGE_KEY = 'stabclient.mods.v1';
  var panel = document.getElementById('StabClientMainMenu');
  if (!panel) return;

  var list = document.getElementById('scModsList');
  var status = document.getElementById('scModsStatus');
  var refreshButton = document.getElementById('scModsRefresh');
  var searchInput = document.getElementById('scModsSearch');
  var installed = readInstalled();
  var catalog = [];

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
      typeof mod.author === 'string' && mod.author.length <= 48;
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

  async function loadCatalog() {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Loading…';
    setStatus('Connecting to the StabClient mod catalog…');
    try {
      var response = await fetch(CATALOG_URL, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Catalog request failed (' + response.status + ').');
      var data = await response.json();
      catalog = normalizeCatalog(data);
      render();
      setStatus('Catalog loaded: ' + catalog.length + ' mod' + (catalog.length === 1 ? '' : 's') + '.');
    } catch (error) {
      catalog = [];
      render();
      setStatus(error && error.message ? error.message : 'Could not load the mod catalog.', true);
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  }

  list.addEventListener('click', function (event) {
    var button = event.target.closest('[data-mod-action]');
    if (!button || !list.contains(button)) return;
    var id = button.getAttribute('data-mod-id');
    var action = button.getAttribute('data-mod-action');
    var mod = catalog.find(function (item) { return item.id === id; });
    if (!mod) return;

    if (action === 'install') {
      installed[id] = { version: mod.version, enabled: false };
      if (!saveInstalled()) return;
      setStatus(mod.name + ' added. Enable it when you are ready.');
    } else if (action === 'toggle' && installed[id]) {
      installed[id].enabled = !installed[id].enabled;
      installed[id].version = mod.version;
      if (!saveInstalled()) return;
      setStatus(mod.name + ' marked ' + (installed[id].enabled ? 'enabled' : 'disabled') + '.');
    } else if (action === 'remove') {
      delete installed[id];
      if (!saveInstalled()) return;
      setStatus(mod.name + ' removed from your installed list.');
    }
    render();
  });

  refreshButton.addEventListener('click', loadCatalog);
  searchInput.addEventListener('input', render);
  loadCatalog();
})();
