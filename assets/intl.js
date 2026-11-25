/* Trip Trek International: an airliner perched on the logo. One tap launches a full-screen cinematic flight
   (sunrise sky, cloud fly-through, contrails) that turns TTI into Trip Trek International and lands on /international.html */
(function(){
  var path=location.pathname;
  if(/^\/(admin|pay|account)(\/|$)/.test(path)||/international(\.html)?$/.test(path)) return;
  var logo=document.querySelector('.nav-logo'); if(!logo) return;
  var a=logo.closest('a'); if(!a) return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEST='/international.html', PLANE='/assets/plane.svg';
  var img=new Image(); img.src=PLANE;

  var css=document.createElement('style');
  css.textContent=
   '.tti-perch{position:relative;display:block;}'+
   '.tti-plane{position:absolute;top:-13px;left:calc(100% - 26px);width:84px;padding:0;border:0;background:none;cursor:pointer;z-index:101;transform:rotate(-8deg);transform-origin:20% 70%;animation:ttiBob 3s ease-in-out infinite;-webkit-tap-highlight-color:transparent;}'+
   '.tti-plane img{width:100%;height:auto;display:block;filter:drop-shadow(0 5px 5px rgba(4,29,68,.35));pointer-events:none;}'+
   '.tti-plane:before{content:"";position:absolute;left:30%;top:30%;width:40%;height:40%;border-radius:50%;box-shadow:0 0 0 0 rgba(239,48,6,.55);animation:ttiPing 2.2s ease-out infinite;}'+
   '.tti-plane:hover,.tti-plane:focus-visible{animation-play-state:paused;transform:rotate(-14deg) scale(1.15);}'+
   '.tti-plane:focus-visible{outline:2px solid #EF3006;outline-offset:3px;border-radius:6px;}'+
   '@keyframes ttiBob{0%,100%{transform:translate(0,0) rotate(-8deg);}50%{transform:translate(4px,-4px) rotate(-12deg);}}'+
   '@keyframes ttiPing{0%{box-shadow:0 0 0 0 rgba(239,48,6,.5);}80%,100%{box-shadow:0 0 0 22px rgba(239,48,6,0);}}'+
   '.tti-bubble{position:absolute;top:calc(100% + 12px);left:0;background:linear-gradient(135deg,#043C87,#0a4fa8);color:#fff;font:600 13.5px/1.3 Poppins,system-ui,sans-serif;padding:10px 15px;border-radius:14px;white-space:nowrap;box-shadow:0 14px 30px -10px rgba(4,29,68,.6);opacity:0;transform:translateY(-6px) scale(.96);pointer-events:none;transition:opacity .35s,transform .35s;z-index:102;}'+
   '.tti-bubble:before{content:"";position:absolute;top:-5px;left:66px;width:11px;height:11px;background:#043C87;transform:rotate(45deg);}'+
   '.tti-bubble b{color:#FFB199;}'+
   '.tti-bubble.show{opacity:1;transform:none;pointer-events:auto;cursor:pointer;}'+
   '.tti-stage{position:fixed;inset:0;z-index:99999;overflow:hidden;background:transparent;touch-action:none;font-family:Poppins,system-ui,sans-serif;color:#fff;}'+
   '.tti-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}'+
   '.tti-txt{position:absolute;left:0;right:0;top:11%;text-align:center;pointer-events:none;opacity:0;}'+
   '.tti-txt .big{font-size:clamp(70px,19vw,150px);font-weight:900;letter-spacing:.05em;line-height:1;text-shadow:0 10px 40px rgba(2,29,80,.55);}'+
   '.tti-txt .big span{display:inline-block;transform:translateY(60px) scale(.6);opacity:0;}'+
   '.tti-txt .big i{font-style:normal;color:#EF3006;}'+
   '.tti-txt .sub{margin-top:10px;font-size:clamp(13px,3.4vw,24px);font-weight:700;letter-spacing:.3em;text-shadow:0 4px 18px rgba(2,29,80,.6);}'+
   '.tti-txt .sub u{text-decoration:none;display:inline-block;transition:opacity .3s,transform .4s,filter .4s;}'+
   '.tti-txt .sub u.out{opacity:0;transform:translateY(-14px) rotateX(70deg);filter:blur(4px);}'+
   '.tti-txt .sub u.in{color:#FFD2B8;}'+
   '.tti-skip{position:absolute;right:16px;bottom:14px;font-size:12px;font-weight:600;letter-spacing:.08em;opacity:.7;pointer-events:none;}'+
   '@media(max-width:520px){.tti-bubble{font-size:12px;padding:8px 11px;}.tti-plane{width:70px;}.tti-bubble:before{left:52px;}}'+
   '@media(prefers-reduced-motion:reduce){.tti-plane{animation:none;}.tti-plane:before{animation:none;}}';
  document.head.appendChild(css);

  a.classList.add('tti-perch');
  var btn=document.createElement('button');
  btn.type='button'; btn.className='tti-plane';
  btn.innerHTML='<img src="'+PLANE+'" alt="" width="600" height="190">';
  btn.setAttribute('aria-label','Trip Trek International, coming soon. Tap to open');
  var bub=document.createElement('div');
  bub.className='tti-bubble'; bub.setAttribute('aria-hidden','true');
  bub.innerHTML='✈ International trips &amp; treks? <b>Tap the plane</b>';
  a.appendChild(btn); a.appendChild(bub);

  var hideT;
  function show(ms){bub.classList.add('show');clearTimeout(hideT);hideT=setTimeout(function(){bub.classList.remove('show');},ms||6500);}
  try{ if(!sessionStorage.getItem('ttiHint')){ sessionStorage.setItem('ttiHint','1'); setTimeout(function(){show(8000);},1200); } }catch(e){}
  btn.addEventListener('mouseenter',function(){show(4500);});
  btn.addEventListener('focus',function(){show(4500);});

  /* ---------- the flight ---------- */
  function ease(x){return x<0?0:x>1?1:x*x*(3-2*x);}
  function easeIn(x){x=x<0?0:x>1?1:x;return x*x*x;}
  function rnd(s){s=Math.sin(s*127.1+311.7)*43758.5453;return s-Math.floor(s);}

  function sprite(w,h,seed){ // a soft cumulus puff, pre-rendered once
    var c=document.createElement('canvas'); c.width=w; c.height=h; var g=c.getContext('2d');
    for(var i=0;i<22;i++){
      var x=w*(.12+.76*rnd(seed+i)), y=h*(.35+.3*rnd(seed+i*3.3)), r=h*(.22+.34*rnd(seed+i*7.1))*(1-Math.abs(x/w-.5)*.9);
      var gr=g.createRadialGradient(x,y-r*.2,r*.1,x,y,r);
      gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.6,'rgba(244,248,255,.55)'); gr.addColorStop(1,'rgba(230,240,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    }
    var sh=g.createLinearGradient(0,h*.4,0,h); sh.addColorStop(0,'rgba(120,150,200,0)'); sh.addColorStop(1,'rgba(120,150,200,.35)');
    g.globalCompositeOperation='source-atop'; g.fillStyle=sh; g.fillRect(0,0,w,h);
    return c;
  }

  var busy=false;
  function launch(e){
    if(e){e.preventDefault();e.stopPropagation();}
    if(busy) return; busy=true;
    try{sessionStorage.setItem('ttiFly','1');}catch(x){}
    if(reduce){ location.href=DEST; return; }
    bub.classList.remove('show');
    var pf=document.createElement('link'); pf.rel='prefetch'; pf.href=DEST; document.head.appendChild(pf);

    var r=btn.getBoundingClientRect(), sx0=r.left+r.width*.5, sy0=r.top+r.height*.5, sw0=r.width;
    btn.style.visibility='hidden';
    var dpr=Math.min(window.devicePixelRatio||1,2), W=innerWidth, H=innerHeight;
    var stage=document.createElement('div'); stage.className='tti-stage';
    var cv=document.createElement('canvas'); cv.width=W*dpr; cv.height=H*dpr; stage.appendChild(cv);
    var tx=document.createElement('div'); tx.className='tti-txt';
    tx.innerHTML='<div class="big"><span>T</span><span>T</span><span><i>I</i></span></div><div class="sub">TRIP TREK <u id="ttiW">INDIA</u></div>';
    stage.appendChild(tx);
    var sk=document.createElement('div'); sk.className='tti-skip'; sk.textContent='TAP TO SKIP'; stage.appendChild(sk);
    document.body.appendChild(stage);
    var g=cv.getContext('2d'); g.scale(dpr,dpr);

    var sprites=[sprite(520,200,1),sprite(640,230,9),sprite(420,170,17),sprite(760,260,31),sprite(560,210,47)];
    var layers=[ // far -> near
      {n:9, sp:90,  y0:.60,y1:.72, sc:.55,al:.55, b:.0},
      {n:7, sp:220, y0:.50,y1:.86, sc:.85,al:.6, b:.3},
      {n:6, sp:520, y0:.04,y1:.96, sc:1.2,al:.7,b:.6},
      {n:3, sp:1100,y0:-.05,y1:1.05,sc:2.2,al:.7, b:1}
    ];
    layers.forEach(function(L,li){
      L.c=[]; for(var i=0;i<L.n;i++){ var s=sprites[(i+li)%sprites.length];
        L.c.push({x:rnd(li*50+i)*(W+700)-350, y:(L.y0+(L.y1-L.y0)*rnd(li*70+i*2.1))*H, s:s, k:L.sc*(.8+.5*rnd(li*9+i))*Math.min(1,.3+W/1000) }); } });
    var streaks=[]; for(var i=0;i<46;i++) streaks.push({x:rnd(i)*W*1.4, y:rnd(i*5.5)*H, l:90+rnd(i*2)*320, v:1400+rnd(i*3)*2200});
    var trail=[]; var t0=performance.now(), last=t0, done=false, navAt=null, word=false;
    var DUR=5600;
    function skip(){ if(done) return; done=true; location.href=DEST; }
    stage.addEventListener('click',skip);

    function planePose(t){
      // 0..1500 climbs out of the logo, 1500..3900 cruises, 3900.. banks away to the upper right
      var pw=Math.min(W*.86,860), cx=W*.44, cy=H*.58;
      var p=ease(t/1500), q=easeIn((t-3700)/1500), bob=Math.sin(t/430)*7;
      var x=sx0+(cx-sx0)*p, y=sy0+(cy-sy0)*p+bob*p, w=sw0+(pw-sw0)*p, rot=(-.14+.1*p)*(1-p)+Math.sin(t/700)*.03*p-.05*p;
      x+=q*W*1.1; y-=q*H*.7; w*=1+q*.5; rot-=q*.45;
      return {x:x,y:y,w:w,rot:rot,p:p,q:q};
    }

    function frame(now){
      if(done) return;
      var t=now-t0, dt=Math.min(.05,(now-last)/1000); last=now;
      var ph=planePose(t);
      var speed=1+ease((t-600)/2200)*1.6+ph.q*2;     // clouds accelerate as the plane gains speed
      var fade=ease(t/650);                            // sky fades in over the page
      g.clearRect(0,0,W,H);
      // sky + sunrise
      g.globalAlpha=fade;
      var sky=g.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#071d4d'); sky.addColorStop(.38,'#1f5cb8'); sky.addColorStop(.7,'#f08a6a'); sky.addColorStop(.88,'#ffc58a'); sky.addColorStop(1,'#ffe6bd');
      g.fillStyle=sky; g.fillRect(0,0,W,H);
      var sxn=W*.82, syn=H*.7, pulse=.85+.15*Math.sin(t/260);
      var sun=g.createRadialGradient(sxn,syn,0,sxn,syn,Math.max(W,H)*.75);
      sun.addColorStop(0,'rgba(255,248,214,'+(.95*pulse)+')'); sun.addColorStop(.12,'rgba(255,214,150,.65)'); sun.addColorStop(.45,'rgba(255,140,90,.18)'); sun.addColorStop(1,'rgba(255,140,90,0)');
      g.fillStyle=sun; g.fillRect(0,0,W,H);
      // stars fading near the top
      g.fillStyle='#fff';
      for(var i=0;i<40;i++){ g.globalAlpha=fade*(.15+.5*rnd(i))*(.6+.4*Math.sin(t/300+i)); g.fillRect(rnd(i*4)*W, rnd(i*9)*H*.4, 1.6,1.6); }
      g.globalAlpha=fade;
      // clouds: far layers behind the plane, near layers in front
      function drawLayer(L){
        for(var i=0;i<L.c.length;i++){ var c=L.c[i];
          c.x-=L.sp*speed*dt; var cw=c.s.width*c.k; if(c.x<-cw) c.x=W+rnd(t+i)*300;
          g.globalAlpha=fade*L.al; g.drawImage(c.s,c.x,c.y-c.s.height*c.k*.5,cw,c.s.height*c.k);
        }
      }
      drawLayer(layers[0]); drawLayer(layers[1]);
      // contrail (screen-space points that drift back with the clouds)
      var ex=ph.x-ph.w*.17, ey=ph.y+ph.w*.036; // behind the engines
      if(t>500 && ph.q<.95){ trail.push({x:ex,y:ey,a:1}); }
      for(var i=trail.length-1;i>=0;i--){ var pt=trail[i]; pt.x-=layers[2].sp*speed*dt*1.05; pt.a-=dt*.42; if(pt.a<=0) trail.splice(i,1); }
      g.lineCap='round';
      for(var i=1;i<trail.length;i++){ var A=trail[i-1],B=trail[i];
        g.strokeStyle='rgba(255,255,255,'+(Math.max(0,B.a)*.55)+')'; g.lineWidth=2+(1-B.a)*18;
        g.beginPath(); g.moveTo(A.x,A.y); g.lineTo(B.x,B.y); g.stroke(); }
      // the plane
      if(img.complete&&img.naturalWidth){
        var h=ph.w*190/600, shake=ph.p>.9&&ph.q<.1?Math.sin(t/37)*1.2:0;
        g.save(); g.globalAlpha=1; g.translate(ph.x+shake,ph.y); g.rotate(ph.rot);
        // glow + shadow
        g.shadowColor='rgba(255,170,100,.55)'; g.shadowBlur=ph.w*.08; g.shadowOffsetY=ph.w*.015;
        g.drawImage(img,-ph.w/2,-h/2,ph.w,h);
        g.restore();
      }
      drawLayer(layers[2]);
      // near clouds + speed streaks give the sense of speed
      g.globalAlpha=1;
      for(var i=0;i<streaks.length;i++){ var s=streaks[i]; s.x-=s.v*speed*dt; if(s.x<-s.l){ s.x=W+rnd(t+i)*400; s.y=rnd(t*.7+i)*H; }
        g.strokeStyle='rgba(255,255,255,'+(.08+.16*Math.min(1,(speed-1)/2))*fade+')'; g.lineWidth=1.4; g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x+s.l*(.5+speed*.25),s.y); g.stroke(); }
      drawLayer(layers[3]);
      // lens flare
      var fa=fade*(.18+.12*Math.sin(t/330));
      var fx=[ [.15,.5,.09],[.35,.3,.05],[.6,.12,.14],[.9,-.2,.07] ];
      for(var i=0;i<fx.length;i++){ var px=sxn+(W/2-sxn)*(1+fx[i][0]*.9)*.9*fx[i][0]*2, py=syn+(H*.35-syn)*fx[i][0]*2, rr=Math.min(W,H)*fx[i][2];
        var fg=g.createRadialGradient(px,py,0,px,py,rr); fg.addColorStop(0,'rgba(255,230,190,'+fa+')'); fg.addColorStop(1,'rgba(255,230,190,0)'); g.globalAlpha=1; g.fillStyle=fg; g.beginPath(); g.arc(px,py,rr,0,7); g.fill(); }
      // vignette
      var vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.8); vg.addColorStop(0,'rgba(2,20,60,0)'); vg.addColorStop(1,'rgba(2,20,60,.45)');
      g.globalAlpha=fade; g.fillStyle=vg; g.fillRect(0,0,W,H);
      // title: letters rise one by one, then India -> International
      var tl=ease((t-2300)/500); tx.style.opacity=tl;
      var sp=tx.querySelectorAll('.big span');
      for(var i=0;i<sp.length;i++){ var k=ease((t-2300-i*180)/520); sp[i].style.opacity=k; sp[i].style.transform='translateY('+(60*(1-k))+'px) scale('+(.6+.4*k)+')'; }
      if(!word&&t>3500){ word=true; var w=document.getElementById('ttiW'); w.classList.add('out'); setTimeout(function(){ w.textContent='INTERNATIONAL'; w.classList.remove('out'); w.classList.add('in'); },320); }
      // white-out and land
      var fl=ease((t-4900)/650);
      if(fl>0){ g.globalAlpha=fl; g.fillStyle='#eef5ff'; g.fillRect(0,0,W,H); tx.style.opacity=Math.max(0,tl*(1-fl)); }
      if(t>=DUR){ skip(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(function(n){ last=n; t0=n; frame(n); });
  }
  btn.addEventListener('click',launch);
  bub.addEventListener('click',launch);
  addEventListener('pageshow',function(ev){ if(ev.persisted){ var s=document.querySelector('.tti-stage'); if(s) s.remove(); btn.style.visibility=''; busy=false; } });
})();
