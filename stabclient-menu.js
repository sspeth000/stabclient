(function(){
  'use strict';
  if(document.getElementById('scMainMenu')) return;

  var menu=document.createElement('section');
  menu.id='scMainMenu';
  menu.setAttribute('aria-label','StabClient Tools');
  menu.innerHTML=
    '<header class="sc-head"><strong>StabClient Tools</strong><button class="sc-close" type="button" aria-label="Minimize menu">−</button></header>'+
    '<nav class="sc-nav" aria-label="Tool sections">'+
      '<button type="button" data-tab="home" aria-selected="true">Home</button>'+
      '<button type="button" data-tab="unlock" aria-selected="false">Unlocks</button>'+
      '<button type="button" data-tab="pearls" aria-selected="false">Black Pearl Status</button>'+
    '</nav><main class="sc-content" id="scMenuContent"></main>';
  var toggle=document.createElement('button');
  toggle.id='scMainMenuToggle'; toggle.type='button'; toggle.textContent='StabClient Tools';
  document.body.appendChild(menu); document.body.appendChild(toggle);
  var content=menu.querySelector('#scMenuContent');
  var currentTab='home';

  function renderHome(){
    content.innerHTML=
      '<section class="sc-welcome"><div class="sc-eyebrow">WELCOME TO STABCLIENT</div>'+
      '<h1>StabClient Tools</h1>'+
      '<p>Your custom tools and account information, gathered in one place.</p></section>'+
      '<div class="sc-note">Choose a section from the left to manage your local unlock options or view your Black Pearl balance.</div>';
  }
  function renderUnlocks(){
    content.innerHTML=
      '<div class="sc-eyebrow">COLLECTION</div><h1>Unlocks</h1>'+
      '<p>Choose which collection to unlock.</p>'+
      '<div class="sc-unlock-options">'+
      '<label><input type="radio" name="scMenuCollection" value="fishes"> Fish</label>'+
      '<label><input type="radio" name="scMenuCollection" value="weapons"> Weapons</label>'+
      '<label><input type="radio" name="scMenuCollection" value="masks"> Masks</label>'+
      '<label><input type="radio" name="scMenuCollection" value="hats"> Hats</label>'+
      '<label><input type="radio" name="scMenuCollection" value="all" checked> All</label>'+
      '</div>'+
      '<button type="button" class="sc-apply-unlocks" id="scApplyUnlocks">Apply local unlocks</button>'+
      '<div class="sc-note" id="scUnlockStatus" role="status" aria-live="polite">Select a collection, then apply your unlocks.</div>';
    content.querySelector('#scApplyUnlocks').addEventListener('click',function(){
      var selected=content.querySelector('input[name="scMenuCollection"]:checked');
      var collection=selected?selected.value:'all';
      var status=content.querySelector('#scUnlockStatus');
      try{
        var api=window.StabClient;
        if(!api||typeof api.applyLocalUnlocks!=='function')
          throw new Error('StabClient unlock function is not available yet. Wait for the game to finish loading.');
        var result=api.applyLocalUnlocks(collection);
        status.textContent='Unlock function completed for '+collection+'.'+
          (result&&typeof result==='object'?' Result: '+JSON.stringify(result):'');
      }catch(error){
        status.textContent='Could not apply unlocks: '+error.message;
      }
    });
  }
  function pearlAmount(){
    var manager=window.StabClient&&window.StabClient.userManager;
    var inventory=manager&&manager.inventory;
    return inventory&&typeof inventory.numPearls==='number'&&Number.isFinite(inventory.numPearls)
      ?Math.floor(inventory.numPearls).toLocaleString():'Account balance not available yet';
  }
  function renderPearls(){
    content.innerHTML='<div class="sc-eyebrow">ACCOUNT</div><h1>Black Pearl Status</h1>'+
      '<p>Your Black Pearl balance from the loaded account.</p>'+
      '<div class="sc-pearl-card"><span>BLACK PEARLS</span><strong id="scPearlValue"></strong><small>Read-only account status</small></div>'+
      '<div class="sc-note">This is a status display only. It does not edit account currency.</div>';
    updatePearls();
  }
  function updatePearls(){
    var value=content.querySelector('#scPearlValue');
    if(value) value.textContent=pearlAmount();
  }
  function showTab(name){
    currentTab=name;
    menu.querySelectorAll('[data-tab]').forEach(function(button){
      button.setAttribute('aria-selected',String(button.dataset.tab===name));
    });
    if(name==='unlock') renderUnlocks();
    else if(name==='pearls') renderPearls();
    else renderHome();
  }
  menu.querySelectorAll('[data-tab]').forEach(function(button){
    button.addEventListener('click',function(){showTab(button.dataset.tab);});
  });
  function setOpen(open){
    menu.style.display=open?'grid':'none';
    toggle.style.display=open?'none':'block';
  }
  menu.querySelector('.sc-close').addEventListener('click',function(){setOpen(false);});
  toggle.addEventListener('click',function(){setOpen(true);});
  showTab('home');

  function syncToTitleMenu(){
    var titleMenu=document.getElementById('titleMenu');
    if(!titleMenu){menu.style.display='none';toggle.style.display='none';return;}
    var visible=getComputedStyle(titleMenu).display!=='none'&&titleMenu.getClientRects().length>0;
    if(visible){
      if(menu.dataset.titleVisible!=='yes') setOpen(true);
      menu.dataset.titleVisible='yes';
    }else{
      menu.style.display='none'; toggle.style.display='none'; menu.dataset.titleVisible='no';
    }
  }
  new MutationObserver(syncToTitleMenu).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class','hidden']});
  window.addEventListener('resize',syncToTitleMenu);
  setInterval(function(){syncToTitleMenu();if(currentTab==='pearls')updatePearls();},500);
  syncToTitleMenu();
})();