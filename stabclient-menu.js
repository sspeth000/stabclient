(function(){
  'use strict';
  if(document.getElementById('scMainMenu')) return;

  var menu=document.createElement('section');
  menu.id='scMainMenu';
  menu.setAttribute('aria-label','StabClient tools');
  menu.innerHTML=
    '<div class="sc-head"><div><strong>StabClient Tools</strong><small>Client Assist</small></div><button class="sc-close" type="button" aria-label="Hide menu">−</button></div>'+
    '<nav class="sc-nav" aria-label="Main menu sections">'+
    '<button type="button" data-tab="home" aria-selected="true">Home</button>'+
    '<button type="button" data-tab="unlock" aria-selected="false">Unlocks</button>'+
    '<button type="button" data-tab="pearls" aria-selected="false">Black Pearl Status</button>'+
    '</nav><div class="sc-content" id="scMenuContent" aria-live="polite"></div>';

  var toggle=document.createElement('button');
  toggle.id='scMainMenuToggle';
  toggle.type='button';
  toggle.textContent='StabClient';
  document.body.appendChild(menu);
  document.body.appendChild(toggle);

  var content=menu.querySelector('#scMenuContent');
  var currentTab='home';
  var pearlTimer=null;

  function gameElement(id){return document.getElementById(id);}
  function clickGameControl(id){
    var control=gameElement(id);
    if(!control) return false;
    control.click();
    return true;
  }
  function setGameInput(id,value){
    var control=gameElement(id);
    if(!control) return false;
    control.value=value;
    control.dispatchEvent(new Event('input',{bubbles:true}));
    control.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }
  function gameToggleOn(id){
    var control=gameElement(id);
    return !!(control&&control.getAttribute('aria-pressed')==='true');
  }
  function updateToggle(button,id){
    var on=gameToggleOn(id);
    button.textContent=on?'✓':'';
    button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label',(button.dataset.label||'Feature')+(on?' on':' off'));
    button.title=(button.dataset.label||'Feature')+(on?' on':' off');
  }
  function toggleRow(label,id){
    return '<div class="sc-toggle-row"><span>'+label+'</span><button type="button" class="sc-check" data-game-toggle="'+id+'" data-label="'+label+'" aria-pressed="false"></button></div>';
  }
  function refreshHome(){
    ['spikeToggle','akToggle','autoXPToggle'].forEach(function(id){
      var button=content.querySelector('[data-game-toggle="'+id+'"]');
      if(button) updateToggle(button,id);
    });
    var status=content.querySelector('#scAssistStatus');
    if(status){
      var spike=gameElement('spikeStatus'),xp=gameElement('autoXPStatus'),ak=gameElement('akStatus');
      status.textContent=[spike&&spike.textContent,xp&&xp.textContent,ak&&ak.textContent].filter(Boolean).join(' · ')||'Game controls are ready when the client loads.';
    }
    [['scFoodTarget','collectFoodXP'],['scAccessoryTarget','collectAccessories']].forEach(function(pair){
      var source=gameElement(pair[1]),mirror=content.querySelector('#'+pair[0]);
      if(source&&mirror&&mirror.checked!==source.checked) mirror.checked=source.checked;
    });
  }
  function renderHome(){
    content.innerHTML=
      '<div class="sc-welcome"><div class="sc-eyebrow">WELCOME BACK</div><h2>Your match, your settings.</h2><p>Quick access to StabClient tools, all in one compact panel.</p></div>'+
      '<div class="sc-section-label">SPIKE PROTECTION</div>'+
      toggleRow('Spike Immunity','spikeToggle')+
      '<div class="sc-section-label">AUTO ASSIST</div>'+
      toggleRow('Auto Kill','akToggle')+
      toggleRow('Auto Collect','autoXPToggle')+
      '<div class="sc-section-label">AUTO COLLECT TARGETS</div>'+
      '<label class="sc-choice"><input type="checkbox" id="scFoodTarget"> Collect Food XP</label>'+
      '<label class="sc-choice"><input type="checkbox" id="scAccessoryTarget"> Collect Accessories</label>'+
      '<div class="sc-section-label">INPUT SETTINGS</div>'+
      '<label class="sc-field">Movement Speed<input id="scSpeed" type="number" step="any"></label>'+
      '<label class="sc-field">Auto Kill Delay (ms)<input id="scKillDelay" type="number" min="50" max="5000" step="50"></label>'+
      '<label class="sc-field">Auto Collect Delay (ms)<input id="scCollectDelay" type="number" min="50" max="5000" step="50"></label>'+
      '<div class="sc-note" id="scAssistStatus">Waiting for game tools…</div>';

    [['scFoodTarget','collectFoodXP'],['scAccessoryTarget','collectAccessories']].forEach(function(pair){
      var source=gameElement(pair[1]),mirror=content.querySelector('#'+pair[0]);
      if(source&&mirror) mirror.checked=source.checked;
      if(mirror) mirror.addEventListener('change',function(){
        var target=gameElement(pair[1]);
        if(target){target.checked=mirror.checked;target.dispatchEvent(new Event('change',{bubbles:true}));}
      });
    });
    [['scSpeed','psSlider'],['scKillDelay','akDelay'],['scCollectDelay','collectDelay']].forEach(function(pair){
      var source=gameElement(pair[1]),mirror=content.querySelector('#'+pair[0]);
      if(source&&mirror) mirror.value=source.value;
      if(mirror) mirror.addEventListener('input',function(){setGameInput(pair[1],mirror.value);});
    });
    content.querySelectorAll('[data-game-toggle]').forEach(function(button){
      updateToggle(button,button.getAttribute('data-game-toggle'));
      button.addEventListener('click',function(){
        clickGameControl(button.getAttribute('data-game-toggle'));
        updateToggle(button,button.getAttribute('data-game-toggle'));
        refreshHome();
      });
    });
    refreshHome();
  }

  function applyUnlocks(collection){
    var api=window.StabClient;
    if(!api||!api.userManager||typeof api.applyLocalUnlocks!=='function')
      throw new Error('Game data is not ready yet. Wait for the game to finish loading.');
    return api.applyLocalUnlocks(collection);
  }
  function renderUnlocks(){
    content.innerHTML=
      '<h2>Unlocks</h2><p>Choose a collection to unlock locally in this browser.</p>'+
      '<div class="sc-note">This is a local preview only. It does not change server-owned account progress or Black Pearls.</div>'+
      '<div class="sc-section-label">COLLECTION</div>'+
      '<label class="sc-choice"><input type="radio" name="scCollection" value="fishes"> Fishes</label>'+
      '<label class="sc-choice"><input type="radio" name="scCollection" value="weapons"> Weapons</label>'+
      '<label class="sc-choice"><input type="radio" name="scCollection" value="masks"> Masks</label>'+
      '<label class="sc-choice"><input type="radio" name="scCollection" value="hats"> Hats</label>'+
      '<label class="sc-choice"><input type="radio" name="scCollection" value="all" checked> All collections</label>'+
      '<button type="button" class="sc-primary" id="scApplyUnlocks">Apply local unlocks</button>'+
      '<div class="sc-note" id="scUnlockStatus" role="status">Ready when game data is loaded.</div>';
    content.querySelector('#scApplyUnlocks').addEventListener('click',function(){
      var selected=content.querySelector('input[name="scCollection"]:checked');
      var collection=selected?selected.value:'all';
      var status=content.querySelector('#scUnlockStatus');
      try{
        var changed=applyUnlocks(collection);
        status.textContent='Applied locally: '+changed.fishes+' fishes, '+changed.weapons+' weapons, '+changed.masks+' masks and '+changed.hats+' hats. Server data is unchanged.';
      }catch(error){status.textContent='Could not apply local unlocks: '+error.message;}
    });
  }
  function pearlAmount(){
    var manager=window.StabClient&&window.StabClient.userManager;
    var inventory=manager&&manager.inventory;
    return inventory&&typeof inventory.numPearls==='number'&&Number.isFinite(inventory.numPearls)
      ?Math.floor(inventory.numPearls).toLocaleString():'Waiting for account data…';
  }
  function renderPearls(){
    content.innerHTML='<div class="sc-eyebrow">ACCOUNT</div><h2>Black Pearl Status</h2><p>Your current balance, read from the loaded game account.</p>'+
      '<div class="sc-pearl-card"><span>BLACK PEARLS</span><strong id="scPearlValue"></strong><small>Live account balance</small></div>'+
      '<div class="sc-note">Read-only. Black Pearls are managed by the game server, so this menu does not offer an edit control.</div>';
    updatePearls();
  }
  function updatePearls(){
    var value=content.querySelector('#scPearlValue');
    if(value) value.textContent=pearlAmount();
  }
  function showTab(name){
    currentTab=name;
    menu.querySelectorAll('[data-tab]').forEach(function(button){
      button.setAttribute('aria-selected',String(button.getAttribute('data-tab')===name));
    });
    if(name==='unlock') renderUnlocks();
    else if(name==='pearls') renderPearls();
    else renderHome();
  }
  menu.querySelectorAll('[data-tab]').forEach(function(button){
    button.addEventListener('click',function(){showTab(button.getAttribute('data-tab'));});
  });

  function setOpen(open){
    menu.style.display=open?'block':'none';
    toggle.style.display=open?'none':'block';
  }
  menu.querySelector('.sc-close').addEventListener('click',function(){setOpen(false);});
  toggle.addEventListener('click',function(){setOpen(true);});
  showTab('home');

  function syncToTitleMenu(){
    var titleMenu=gameElement('titleMenu');
    if(!titleMenu){menu.style.display='none';toggle.style.display='none';return;}
    var style=window.getComputedStyle(titleMenu);
    var visible=style.display!=='none'&&style.visibility!=='hidden'&&titleMenu.getClientRects().length>0;
    if(visible){
      if(menu.dataset.titleVisible!=='yes') setOpen(true);
      menu.dataset.titleVisible='yes';
      toggle.dataset.titleVisible='yes';
    }else{
      menu.style.display='none';
      toggle.style.display='none';
      menu.dataset.titleVisible='no';
      toggle.dataset.titleVisible='no';
    }
  }
  new MutationObserver(syncToTitleMenu).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class','hidden']});
  window.addEventListener('resize',syncToTitleMenu);
  setInterval(function(){
    syncToTitleMenu();
    if(currentTab==='home') refreshHome();
    if(currentTab==='pearls') updatePearls();
  },500);
  syncToTitleMenu();
})();