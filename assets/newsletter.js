// Footer newsletter signup, injected above the footer on every public page.
(function(){
  var f=document.querySelector('footer'); if(!f||document.getElementById('ttiNews')) return;
  var st=document.createElement('style');
  st.textContent='#ttiNews{background:#F4F7FB;padding:38px 16px;text-align:center;font-family:Poppins,Arial,sans-serif}#ttiNews h3{margin:0 0 6px;color:#043C87;font-size:22px}#ttiNews p{margin:0 0 16px;color:#5A6B80;font-size:14px}#ttiNews form{display:flex;gap:8px;max-width:460px;margin:auto;flex-wrap:wrap}#ttiNews input[type=email]{flex:1;min-width:200px;padding:12px 14px;border:1px solid #cfd8e6;border-radius:10px;font:400 15px Poppins,Arial}#ttiNews button{padding:12px 22px;border:0;border-radius:10px;background:#EF3006;color:#fff;font:600 15px Poppins,Arial;cursor:pointer}#ttiNews button[disabled]{opacity:.6}#ttiNews .m{margin-top:10px;font-size:13px;min-height:18px}#ttiNews .hp{position:absolute;left:-9999px}';
  document.head.appendChild(st);
  var s=document.createElement('section'); s.id='ttiNews';
  s.innerHTML='<h3>Get new trips &amp; offers first</h3><p>Fresh departures, group deals and travel ideas — no spam, unsubscribe anytime.</p>'
   +'<form novalidate><input class="hp" name="website" tabindex="-1" autocomplete="off"><input type="email" name="email" placeholder="Your email" aria-label="Email address" required><button type="submit">Subscribe</button></form><div class="m" role="status"></div>';
  f.parentNode.insertBefore(s,f);
  var form=s.querySelector('form'),m=s.querySelector('.m'),btn=s.querySelector('button');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var email=form.email.value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){m.style.color='#B42318';m.textContent='Please enter a valid email.';return}
    btn.disabled=true;
    fetch('/.netlify/functions/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,website:form.website.value,source:location.pathname})})
     .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
     .then(function(x){if(!x.ok)throw new Error(x.d.error);m.style.color='#1E8E5A';m.textContent="You're in! Check your inbox for a welcome email.";form.reset()})
     .catch(function(err){m.style.color='#B42318';m.textContent=err.message||'Could not subscribe. Try again.'})
     .then(function(){btn.disabled=false});
  });
})();
