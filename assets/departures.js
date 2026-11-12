// Departure dates on trip pages: every trip leaves on a Friday, except those marked data-departure="any".
(function(){
  var box=document.getElementById('dateField'), inp=document.getElementById('f_date'); if(!box||!inp) return;
  var LEAD=2, mode=box.getAttribute('data-departure')==='any'?'any':'friday';
  var ist=new Date(Date.now()+5.5*3600*1000), y=ist.getUTCFullYear(), m=ist.getUTCMonth(), d=ist.getUTCDate();
  var base=new Date(Date.UTC(y,m,d)); // today (IST) as a UTC date
  var iso=function(dt){return dt.toISOString().slice(0,10)};
  var min=new Date(base); min.setUTCDate(min.getUTCDate()+LEAD);
  var lab=box.querySelector('label');
  if(mode==='any'){
    inp.min=iso(min); if(lab) lab.textContent='Departure date (any day you choose)';
  }else{
    var sel=document.createElement('select'); sel.id='f_date'; sel.setAttribute('aria-label','Departure date');
    var o=document.createElement('option'); o.value=''; o.textContent='Select a Friday'; sel.appendChild(o);
    var c=new Date(min); while(c.getUTCDay()!==5) c.setUTCDate(c.getUTCDate()+1);
    for(var i=0;i<12;i++){ var op=document.createElement('option'); op.value=iso(c);
      op.textContent=c.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}); sel.appendChild(op); c.setUTCDate(c.getUTCDate()+7); }
    inp.parentNode.replaceChild(sel,inp);
    if(lab) lab.textContent='Departure date (every Friday)';
  }
  var lede=document.querySelector('#pricing .lede');
  if(lede&&!document.getElementById('depNote')){
    var n=document.createElement('p'); n.id='depNote'; n.className='lede'; n.style.cssText='margin-top:10px;font-weight:600;color:#043C87';
    n.textContent=mode==='any'?'Departures: any day. Pick the date that suits you when you book.':'Departures: every Friday. Pick your Friday when you book.';
    lede.parentNode.insertBefore(n,lede.nextSibling);
  }
})();
