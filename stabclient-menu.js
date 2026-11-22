(function(){
  'use strict';
  if(document.getElementById('scMainMenu')) return;

  var menu=document.createElement('section');
  menu.id='scMainMenu';
  menu.setAttribute('aria-label','StabClient main menu');
  menu.innerHTML=
    '<div class="sc-head"><span>StabClient Tools</span><button class="sc-close" type="button" aria-label="Hide menu">−</button></div>'+
    '<div class="sc-layout"><nav class="sc-nav" aria-label="Main menu sections">'+
    '<button type="button" data-tab="home" aria-selected="true">Home</button>'+
    '<button type="button" data-tab="assist">Auto Assist</button>'+
    '<button type="button" data-tab="unlock">Unlocks</button>'+
    '<button type="button" data-tab="fishes">Fish</button>'+
    '<button type="button" data-tab="weapons">Weapons</button>'+
    '<button type="button" data-tab="masks">Masks</button>'+
    '<button type="button" data-tab="hats">Hats</button>'+
    '<button type="button" data-tab="pearls">Black Pearls</button>'+
    '</nav><div class="sc-content" id="scMenuContent" aria-live="polite"></div></div>';

  var toggle=document.createElement('button');
  toggle.id='scMainMenuToggle';
  toggle.type='button';
  toggle.textContent='StabClient';
  document.body.appendChild(menu);
  document.body.appendChild(toggle);

  var categories={fishes:'Fishes',weapons:'Weapons',masks:'Masks',hats:'Hats',all:'All'};
  var content=menu.querySelector('#scMenuContent');
  var currentTab='home';

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
  function refreshAssist(){
    ['spikeToggle','akToggle','autoXPToggle'].forEach(function(id){
      var button=content.querySelector('[data-game-toggle="'+id+'"]');
      if(button) updateToggle(button,id);
    });
    var status=content.querySelector('#scAssistStatus');
    if(status){
      var spike=gameElement('spikeStatus'),xp=gameElement('autoXPStatus'),ak=gameElement('akStatus');
      status.textContent=[spike&&spike.textContent,xp&&xp.textContent,ak&&ak.textContent].filter(Boolean).join(' · ')||'Waiting for game tools…';
    }
  }
  function renderAssist(){
    content.innerHTML='<h3>Auto Assist</h3><p>These controls are linked to the same settings used by the in-game panel.</p>'+
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
      var source=gameElement(pair[1]),mirror=gameElement(pair[0]);
      if(source&&mirror) mirror.checked=source.checked;
      if(mirror) mirror.addEventListener('change',function(){
        var target=gameElement(pair[1]);
        if(target){target.checked=mirror.checked;target.dispatchEvent(new Event('change',{bubbles:true}));}
      });
    });
    [['scSpeed','psSlider'],['scKillDelay','akDelay'],['scCollectDelay','collectDelay']].forEach(function(pair){
      var source=gameElement(pair[1]),mirror=gameElement(pair[0]);
      if(source&&mirror) mirror.value=source.value;
      if(mirror) mirror.addEventListener('input',function(){setGameInput(pair[1],mirror.value);});
    });
    content.querySelectorAll('[data-game-toggle]').forEach(function(button){
      updateToggle(button,button.getAttribute('data-game-toggle'));
      button.addEventListener('click',function(){
        clickGameControl(button.getAttribute('data-game-toggle'));
        updateToggle(button,button.getAttribute('data-game-toggle'));
        refreshAssist();
      });
    });
    refreshAssist();
  }

  function applyUnlocks(collection){
    var api=window.StabClient;
    if(!api||!api.userManager||typeof api.applyLocalUnlocks!=='function')
      throw new Error('Game data is not ready yet. Wait for the game to finish loading.');
    return api.applyLocalUnlocks(collection);
  }
  function renderUnlocks(collection){
    var title=categories[collection]||'All';
    content.innerHTML='<h3>'+title+' Unlocks</h3><p>Apply a local collection unlock preview using the game client’s supported local-unlock feature.</p>'+
      '<div class="sc-note">This changes local browser game data only. Server-owned account progress and Black Pearls are not modified.</div>'+
      '<button type="button" class="sc-primary" id="scApplyUnlocks">Apply '+title.toLowerCase()+' unlocks</button>'+
      '<div class="sc-note" id="scUnlockStatus" role="status">Ready when game data is loaded.</div>';
    content.querySelector('#scApplyUnlocks').addEventListener('click',function(){
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
    content.innerHTML='<h3>Black Pearls</h3><p>Your current account balance, read directly from the loaded game data.</p>'+
      '<div class="sc-pearl-value" id="scPearlValue"></div>'+
      '<div class="sc-note">Read-only. Black Pearls are server-managed, so this menu does not offer an edit field.</div>';
    content.querySelector('#scPearlValue').textContent=pearlAmount();
  }
  function showTab(name){
    currentTab=name;
    menu.querySelectorAll('[data-tab]').forEach(function(button){
      button.setAttribute('aria-selected',String(button.getAttribute('data-tab')===name));
    });
    if(name==='assist') renderAssist();
    else if(name==='unlock') renderUnlocks('all');
    else if(categories[name]) renderUnlocks(name);
    else if(name==='pearls') renderPearls();
    else content.innerHTML='<h3>StabClient Tools</h3><p>The main-menu controls now match the in-game Assist panel.</p>'+
      '<div class="sc-note">Auto Assist settings can be prepared here before entering a match. Unlocks remain local to this browser. Black Pearls are displayed as a read-only account value.</div>'+
      '<button type="button" class="sc-primary" id="scGoAssist">Open Auto Assist</button>';
    var go=content.querySelector('#scGoAssist');
    if(go) go.addEventListener('click',function(){showTab('assist');});
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
    if(currentTab==='assist') refreshAssist();
    if(currentTab==='pearls'){
      var value=content.querySelector('#scPearlValue');
      if(value) value.textContent=pearlAmount();
    }
  },500);
  syncToTitleMenu();
})();