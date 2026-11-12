// Live Google reviews (home page). Renders nothing unless the Google keys are set in Netlify.
(function(){
  var anchor=document.getElementById('contactcta'); if(!anchor) return;
  fetch('/.netlify/functions/google-reviews').then(function(r){return r.json()}).then(function(d){
    if(!d||!d.configured||!d.reviews||!d.reviews.length) return;
    var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var stars=function(n){return '<span style="color:#F5A623;letter-spacing:2px" aria-label="'+n+' out of 5">'+'★★★★★'.slice(0,Math.round(n))+'<span style="color:#d5dbe5">'+'★★★★★'.slice(Math.round(n))+'</span></span>'};
    var css=document.createElement('style');
    css.textContent='#gReviews{padding:64px 16px;background:#fff;font-family:Poppins,Arial,sans-serif}#gReviews .in{max-width:1100px;margin:auto}#gReviews h2{margin:0;color:#043C87;font-size:30px;text-align:center}#gReviews .sum{text-align:center;color:#5A6B80;margin:8px 0 26px;font-size:15px}#gReviews .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}#gReviews .rv{border:1px solid #E3E8EF;border-radius:14px;padding:18px;background:#fff;box-shadow:0 4px 16px rgba(4,60,135,.05);display:flex;flex-direction:column}#gReviews .rv p{font-size:14px;line-height:1.6;color:#13243C;margin:10px 0 14px;flex:1;display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;overflow:hidden}#gReviews .au{display:flex;align-items:center;gap:10px;font-size:13px;color:#5A6B80}#gReviews .au img{width:34px;height:34px;border-radius:50%}#gReviews .au b{color:#13243C;display:block}#gReviews .acts{text-align:center;margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}#gReviews .acts a{padding:11px 20px;border-radius:10px;font:600 14px Poppins,Arial;text-decoration:none}#gReviews .g{font-size:12px;color:#5A6B80;text-align:center;margin-top:14px}';
    document.head.appendChild(css);
    var sec=document.createElement('section'); sec.id='gReviews';
    sec.innerHTML='<div class="in"><h2>What travellers say on Google</h2><div class="sum">'+(d.rating?stars(d.rating)+' <b>'+Number(d.rating).toFixed(1)+'</b> · '+esc(d.count)+' Google reviews':'')+'</div><div class="grid">'
     +d.reviews.map(function(r){return '<div class="rv">'+stars(r.rating)+'<p>“'+esc(r.text)+'”</p><div class="au">'+(r.photo?'<img src="'+esc(r.photo)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'')+'<div><b>'+esc(r.author||'Google user')+'</b>'+esc(r.when||'')+'</div></div></div>'}).join('')
     +'</div><div class="acts">'+(d.mapsUri?'<a href="'+esc(d.mapsUri)+'" target="_blank" rel="noopener" style="background:#043C87;color:#fff">See all reviews on Google</a>':'')+(d.writeUrl?'<a href="'+esc(d.writeUrl)+'" target="_blank" rel="noopener" style="background:#fff;color:#043C87;border:1px solid #cfd8e6">Write a review</a>':'')+'</div><div class="g">Reviews from Google</div></div>';
    anchor.parentNode.insertBefore(sec,anchor);
  }).catch(function(){});
})();
