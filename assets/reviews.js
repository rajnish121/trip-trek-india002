// Traveller reviews on trip pages. Shows only reviews that real customers submitted
// and the team approved. If a trip has none yet, nothing is added to the page.
(function(){
  var slug=location.pathname.split('/').filter(Boolean)[0]; if(!slug) return;
  var anchor=document.getElementById('pricing')||document.getElementById('booking'); if(!anchor||document.getElementById('reviews')) return;
  fetch('/.netlify/functions/reviews?trek='+encodeURIComponent(slug)).then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d||!d.count) return;
    var esc=function(t){var e=document.createElement('div');e.textContent=t==null?'':t;return e.innerHTML};
    var star=function(n){var s='';for(var i=1;i<=5;i++)s+='<span style="color:'+(i<=n?'#F5A623':'#D5DBE5')+'">★</span>';return s};
    var st=document.createElement('style');
    st.textContent='#reviews{background:#fff;padding:72px 0}#reviews .rv-sum{text-align:center;margin-top:18px;font-size:16px;color:#13243C}#reviews .rv-sum b{font-size:22px;color:#043C87}'
     +'#reviews .rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px;margin-top:34px}'
     +'#reviews .rv{background:#F4F7FB;border:1px solid #E3E8EF;border-radius:14px;padding:20px 22px}#reviews .rv-st{font-size:17px;letter-spacing:1px}'
     +'#reviews .rv p{margin:10px 0 14px;font-size:14.5px;line-height:1.65;color:#13243C}#reviews .rv-by{font-size:13px;color:#5A6B80}#reviews .rv-by b{color:#043C87}'
     +'#reviews .rv-more{display:block;margin:26px auto 0;padding:11px 24px;border:1.5px solid #043C87;background:#fff;color:#043C87;border-radius:999px;font:600 14px Poppins,Arial;cursor:pointer}'
     +'#reviews .rv-note{text-align:center;margin-top:18px;font-size:12.5px;color:#5A6B80}';
    document.head.appendChild(st);
    var sec=document.createElement('section'); sec.id='reviews';
    var cards=d.reviews.map(function(r,i){
      var m=r.date?new Date(r.date+'T00:00:00').toLocaleDateString('en-IN',{month:'short',year:'numeric'}):'';
      return '<div class="rv"'+(i>5?' style="display:none" data-more="1"':'')+'><div class="rv-st" aria-label="'+r.rating+' out of 5 stars">'+star(r.rating)+'</div><p>&ldquo;'+esc(r.text)+'&rdquo;</p><div class="rv-by"><b>'+esc(r.name)+'</b>'+(m?' · '+m:'')+'</div></div>';
    }).join('');
    sec.innerHTML='<div class="wrap"><span class="tag">TRAVELLER REVIEWS</span><h2 class="h2">What Travellers Say</h2><div class="h2-rule"></div>'
      +'<div class="rv-sum"><b>'+d.average.toFixed(1)+'</b> <span style="color:#F5A623">★</span> from '+d.count+' review'+(d.count>1?'s':'')+'</div>'
      +'<div class="rv-grid">'+cards+'</div>'+(d.count>6?'<button class="rv-more" type="button">Show more reviews</button>':'')
      +'<p class="rv-note">Reviews are written by travellers who booked with Trip Trek India and are published after our team checks them.</p></div>';
    anchor.parentNode.insertBefore(sec,anchor);
    var mb=sec.querySelector('.rv-more'); if(mb) mb.onclick=function(){[].forEach.call(sec.querySelectorAll('[data-more]'),function(x){x.style.display=''});mb.remove()};
  }).catch(function(){});
})();
