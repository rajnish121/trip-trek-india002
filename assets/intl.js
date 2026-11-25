/* Trip Trek International: a small plane perched on the logo. One tap sends it flying and opens /international.html (coming soon). */
(function(){
  var path=location.pathname;
  if(/^\/(admin|pay|account)(\/|$)/.test(path)||/international(\.html)?$/.test(path)) return;
  var logo=document.querySelector('.nav-logo'); if(!logo) return;
  var a=logo.closest('a'); if(!a) return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEST='/international.html';

  var css=document.createElement('style');
  css.textContent=
   '.tti-perch{position:relative;display:block;}'+
   '.tti-plane{position:absolute;top:-10px;left:calc(100% - 20px);width:30px;height:30px;padding:0;border:0;background:none;cursor:pointer;z-index:101;transform:rotate(-14deg);transform-origin:50% 60%;animation:ttiBob 2.8s ease-in-out infinite;-webkit-tap-highlight-color:transparent;}'+
   '.tti-plane svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 2px rgba(4,29,68,.28));}'+
   '.tti-plane:hover,.tti-plane:focus-visible{animation-play-state:paused;transform:rotate(-14deg) scale(1.18);}'+
   '.tti-plane:focus-visible{outline:2px solid #EF3006;outline-offset:3px;border-radius:6px;}'+
   '@keyframes ttiBob{0%,100%{transform:translateY(0) rotate(-14deg);}50%{transform:translateY(-3px) rotate(-9deg);}}'+
   '.tti-bubble{position:absolute;top:calc(100% + 10px);left:0;background:#043C87;color:#fff;font:600 12.5px/1.25 Poppins,system-ui,sans-serif;padding:8px 12px;border-radius:12px;white-space:nowrap;box-shadow:0 10px 24px -10px rgba(4,29,68,.55);opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .3s,transform .3s;z-index:102;}'+
   '.tti-bubble:before{content:"";position:absolute;top:-5px;left:44px;width:10px;height:10px;background:#043C87;transform:rotate(45deg);}'+
   '.tti-bubble b{color:#FFB199;}'+
   '.tti-bubble.show{opacity:1;transform:none;pointer-events:auto;cursor:pointer;}'+
   '.tti-fx{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 40%,#0a4fa8,#022D68 70%);opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Poppins,system-ui,sans-serif;text-align:center;overflow:hidden;}'+
   '.tti-fx .big{font-size:clamp(64px,18vw,132px);font-weight:900;letter-spacing:.04em;line-height:1;}'+
   '.tti-fx .big i{font-style:normal;color:#EF3006;}'+
   '.tti-fx .sub{margin-top:12px;font-size:clamp(14px,3.6vw,22px);font-weight:600;letter-spacing:.22em;}'+
   '.tti-fx .sub span{display:inline-block;transition:opacity .35s,transform .35s;}'+
   '.tti-fx .sub span.out{opacity:0;transform:translateY(10px);}'+
   '.tti-fx .sub span.in{color:#FFB199;}'+
   '.tti-fly{position:fixed;z-index:100000;pointer-events:none;width:46px;height:46px;}'+
   '.tti-fly svg{width:100%;height:100%;display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35));}'+
   '@media(max-width:520px){.tti-bubble{font-size:11.5px;padding:7px 10px;}}'+
   '@media(prefers-reduced-motion:reduce){.tti-plane{animation:none;}}';
  document.head.appendChild(css);

  var PLANE='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M26 29 L19 6 L30 6 L47 29Z M26 35 L19 58 L30 58 L47 35Z" fill="#043C87"/><path d="M10 28 L5 17 L12 17 L18 28Z M10 36 L5 47 L12 47 L18 36Z" fill="#2A6BC5"/><path d="M5 32 Q5 27 14 27 L50 28.5 Q63 32 50 35.5 L14 37 Q5 37 5 32Z" fill="#EF3006"/><circle cx="40" cy="32" r="1.8" fill="#fff"/><circle cx="33" cy="32" r="1.8" fill="#fff"/><circle cx="26" cy="32" r="1.8" fill="#fff"/><circle cx="19" cy="32" r="1.8" fill="#fff"/></svg>';

  a.classList.add('tti-perch');
  var btn=document.createElement('button');
  btn.type='button'; btn.className='tti-plane'; btn.innerHTML=PLANE;
  btn.setAttribute('aria-label','Trip Trek International, coming soon. Tap to open');
  var bub=document.createElement('div');
  bub.className='tti-bubble'; bub.setAttribute('aria-hidden','true');
  bub.innerHTML='International trips &amp; treks? <b>Tap the plane ✈</b>';
  a.appendChild(btn); a.appendChild(bub);

  function stop(e){e.preventDefault();e.stopPropagation();}
  var hideT;
  function show(ms){bub.classList.add('show');clearTimeout(hideT);hideT=setTimeout(function(){bub.classList.remove('show');},ms||6000);}
  try{ if(!sessionStorage.getItem('ttiHint')){ sessionStorage.setItem('ttiHint','1'); setTimeout(function(){show(7000);},1400); } }catch(e){}
  btn.addEventListener('mouseenter',function(){show(4000);});
  btn.addEventListener('focus',function(){show(4000);});

  var busy=false;
  function go(e){
    stop(e); if(busy) return; busy=true;
    try{sessionStorage.setItem('ttiFly','1');}catch(x){}
    if(reduce||!btn.animate){ location.href=DEST; return; }
    bub.classList.remove('show');
    var r=btn.getBoundingClientRect(), W=innerWidth, H=innerHeight;
    var fl=document.createElement('div'); fl.className='tti-fly'; fl.innerHTML=PLANE;
    fl.style.left=r.left+'px'; fl.style.top=r.top+'px'; document.body.appendChild(fl);
    btn.style.visibility='hidden';
    // 1. take off from the logo, up and across the page
    fl.animate([
      {transform:'translate(0,0) rotate(-14deg) scale(.7)',opacity:1},
      {transform:'translate('+(W*.3)+'px,'+(H*.18)+'px) rotate(8deg) scale(1.6)',opacity:1,offset:.45},
      {transform:'translate('+(W*1.2)+'px,'+(-H*.1)+'px) rotate(-12deg) scale(3)',opacity:1}
    ],{duration:1000,easing:'cubic-bezier(.5,0,.8,.6)',fill:'forwards'});
    // 2. the page changes: Trip Trek India -> Trip Trek International
    var fx=document.createElement('div'); fx.className='tti-fx';
    fx.innerHTML='<div class="big">TT<i>I</i></div><div class="sub">TRIP TREK <span id="ttiW">INDIA</span></div>';
    document.body.appendChild(fx);
    setTimeout(function(){ fx.animate([{opacity:0},{opacity:1}],{duration:450,fill:'forwards'}); },380);
    setTimeout(function(){
      var w=document.getElementById('ttiW'); if(!w) return;
      w.classList.add('out');
      setTimeout(function(){ w.textContent='INTERNATIONAL'; w.classList.remove('out'); w.classList.add('in'); },350);
    },1000);
    // 3. a second flight crosses the new scene, then we land on the page
    setTimeout(function(){
      var f2=document.createElement('div'); f2.className='tti-fly'; f2.style.width=f2.style.height='64px'; f2.innerHTML=PLANE;
      f2.style.left='-80px'; f2.style.top=(H*.62)+'px'; fx.appendChild(f2);
      f2.animate([{transform:'translate(0,0) rotate(-6deg)'},{transform:'translate('+(W+160)+'px,'+(-H*.18)+'px) rotate(-14deg)'}],{duration:900,easing:'ease-in',fill:'forwards'});
    },1150);
    setTimeout(function(){ location.href=DEST; },2150);
  }
  btn.addEventListener('click',go);
  bub.addEventListener('click',go);
  // coming back with the browser back button must not show a stuck overlay
  addEventListener('pageshow',function(ev){ if(ev.persisted){ var f=document.querySelector('.tti-fx'); if(f) f.remove(); var fl=document.querySelector('body > .tti-fly'); if(fl) fl.remove(); btn.style.visibility=''; busy=false; } });
})();
