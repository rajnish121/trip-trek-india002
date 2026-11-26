// Peak-season pricing on trip pages: +\u20b92,000 per person for departures from 20 Dec 2026 to 2 Jan 2027.
// Keep PEAK in step with "peak" in netlify/functions/trek-data.json (the server applies the real price).
(function(){
  var PEAK={from:'2026-12-20',to:'2027-01-02',add:2000};
  var share=document.getElementById('f_share'); if(!share) return;
  var inr=function(n){return '\u20b9'+n.toLocaleString('en-IN');};
  var inPeak=function(v){return !!v&&v>=PEAK.from&&v<=PEAK.to;};
  // remember the base prices
  Array.prototype.forEach.call(share.options,function(o){ o.setAttribute('data-base',o.getAttribute('data-price')); o.setAttribute('data-label',o.textContent); });
  // note under the pricing heading
  var lede=document.querySelector('#pricing .lede');
  if(lede&&!document.getElementById('peakNote')){
    var n=document.createElement('p'); n.id='peakNote'; n.className='lede';
    n.style.cssText='margin-top:8px;font-weight:600;color:#EF3006';
    n.textContent='Peak season: departures from 20 Dec 2026 to 2 Jan 2027 cost '+inr(PEAK.add)+' more per person.';
    var after=document.getElementById('depNote')||lede; after.parentNode.insertBefore(n,after.nextSibling);
  }
  function apply(){
    var f=document.getElementById('f_date'); var v=f?f.value:'';
    var pk=inPeak(v);
    Array.prototype.forEach.call(share.options,function(o){
      var base=parseInt(o.getAttribute('data-base'),10);
      o.setAttribute('data-price',pk?base+PEAK.add:base);
      o.textContent=o.getAttribute('data-label').replace(/\u20b9[\d,]+/,inr(pk?base+PEAK.add:base));
    });
    var hint=document.getElementById('peakHint');
    if(!hint&&f){ hint=document.createElement('div'); hint.id='peakHint'; hint.style.cssText='font-size:13px;font-weight:600;color:#EF3006;margin-top:6px;'; f.parentNode.appendChild(hint); }
    if(hint) hint.textContent=pk?'Peak-season date: +'+inr(PEAK.add)+' per person is included in the price below.':'';
    share.dispatchEvent(new Event('change'));
  }
  // mark peak dates in the dropdown (runs after departures.js builds it)
  function mark(){
    var f=document.getElementById('f_date'); if(!f||f.tagName!=='SELECT') return;
    Array.prototype.forEach.call(f.options,function(o){ if(inPeak(o.value)&&o.textContent.indexOf('Peak')<0) o.textContent+=' (Peak, +'+inr(PEAK.add)+')'; });
  }
  document.addEventListener('change',function(e){ if(e.target&&e.target.id==='f_date') apply(); });
  document.addEventListener('input',function(e){ if(e.target&&e.target.id==='f_date') apply(); });
  mark(); setTimeout(mark,300); apply();
})();
