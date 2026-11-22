(function(){
  'use strict';
  if(document.getElementById('scMainMenu')) return;
  var menu=document.createElement('section');
  menu.id='scMainMenu';
  menu.setAttribute('aria-label','StabClient main menu');
  menu.innerHTML='<div class="sc-head"><span>StabClient Tools</span><button class="sc-close" type="button" aria-label="Hide menu">−</button></div>'+
    '<div class="sc-layout"><nav class="sc-nav" aria-label="Main menu sections">'+
    '<button type="button" data-tab="home" aria-selected="true">Home</button>'+
    '<button type="button" data-tab="unlock">Unlocks</button>'+
    '<button type="button" data-tab="fish">Fish</button>'+
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

  var pages={
    home:['Main Menu','StabClient’s separate overlay is ready. The original game menu remains untouched.','Choose a section to browse the available customization categories.'],
    unlock:['Collection Browser','Browse the game’s collection categories in one place.','This menu currently provides a local interface only. It does not grant server-locked items or change account progression.'],
    fish:['Fish','Fish collection browser placeholder.','A collection view can be connected to legitimate items exposed by the game client.'],
    weapons:['Weapons','Weapon collection browser placeholder.','A collection view can be connected to legitimate items exposed by the game client.'],
    masks:['Masks','Mask collection browser placeholder.','Previewing cosmetics locally can be added without changing server-owned inventory.'],
    hats:['Hats','Hat collection browser placeholder.','Previewing cosmetics locally can be added without changing server-owned inventory.'],
    pearls:['Black Pearls','Offline test value only.','Changing this preview does not change your real account balance.']
  };
  function showTab(name){
    var page=pages[name]||pages.home;
    menu.querySelectorAll('[data-tab]').forEach(function(button){
      button.setAttribute('aria-selected',String(button.getAttribute('data-tab')===name));
    });
    var content=menu.querySelector('#scMenuContent');
    if(name==='pearls'){
      content.innerHTML='<h3>'+page[0]+'</h3><p>'+page[1]+'</p><label class="sc-field" for="scPearlAmount">Test amount</label><input id="scPearlAmount" type="number" min="0" max="999999999" step="1" value="0" inputmode="numeric"><div class="sc-preview" id="scPearlPreview">Offline preview: 0 Black Pearls</div><div class="sc-note">'+page[2]+'</div>';
      var field=content.querySelector('#scPearlAmount');
      field.addEventListener('input',function(){
        var amount=Math.max(0,Math.min(999999999,Math.floor(Number(field.value)||0)));
        content.querySelector('#scPearlPreview').textContent='Offline preview: '+amount.toLocaleString()+' Black Pearls';
      });
    }else{
      content.innerHTML='<h3>'+page[0]+'</h3><p>'+page[1]+'</p><div class="sc-note">'+page[2]+'</div>';
    }
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

  var titleMenu=document.getElementById('titleMenu');
  function syncToTitleMenu(){
    titleMenu=document.getElementById('titleMenu');
    if(!titleMenu){menu.style.display='none';toggle.style.display='none';return;}
    var style=window.getComputedStyle(titleMenu);
    var visible=style.display!=='none'&&style.visibility!=='hidden'&&titleMenu.getClientRects().length>0;
    if(visible){
      if(menu.dataset.titleVisible!=='yes'){setOpen(true);}
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
  setInterval(syncToTitleMenu,500);
  syncToTitleMenu();
})();