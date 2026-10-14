(function(){
  // menu
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
  if(btn&&nav){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');document.body.classList.toggle('menu-open',o);btn.setAttribute('aria-expanded',o);btn.textContent=o?'Close':'Menu';});
    nav.addEventListener('click',function(e){if(e.target.tagName==='A'){nav.classList.remove('open');document.body.classList.remove('menu-open');}});}

  // mobile gallery reflow: justified rows, same idea as the 350px design
  var mq=window.matchMedia('(max-width:700px)');
  var galleries=[].slice.call(document.querySelectorAll('[data-gallery]'));
  galleries.forEach(function(g){g._orig=g.innerHTML;});
  function reflow(g){
    var figs=[].slice.call(g._frag.querySelectorAll('.ph'));
    var W=g.clientWidth-parseFloat(getComputedStyle(g).paddingLeft)-parseFloat(getComputedStyle(g).paddingRight);
    var GAP=12,TARGET=W*0.743,WIDE=1.9;
    var items=figs.map(function(f){return {f:f,a:parseFloat(f.style.getPropertyValue('--r'))};});
    var rows=[],i=0;
    function hFor(a){var s=0;a.forEach(function(x){s+=x.a});return (W-GAP*(a.length-1))/s;}
    while(i<items.length){
      if(items[i].a>=WIDE){rows.push([items[i]]);i++;continue;}
      var cur=[];
      while(i<items.length&&items[i].a<WIDE){cur.push(items[i]);i++;if(hFor(cur)<=TARGET)break;}
      rows.push(cur);
    }
    g.innerHTML='';
    rows.forEach(function(r,ri){
      var row=document.createElement('div');row.className='row';
      var full=hFor(r)<=TARGET||ri<rows.length-1||r.length>1&&hFor(r)<=TARGET;
      r.forEach(function(x){x.f.classList.toggle('solo',r.length===1);x.f.style.flex='';row.appendChild(x.f);});
      if(!(hFor(r)<=TARGET)&&ri===rows.length-1&&r.length>1){ // short last row: cap height, keep left aligned
        var h=TARGET;r.forEach(function(x){x.f.style.flex='0 0 '+(h*x.a)+'px';});
      }
      g.appendChild(row);
    });
  }
  function apply(){
    galleries.forEach(function(g){
      var tmp=document.createElement('div');tmp.innerHTML=g._orig;g._frag=tmp;
      if(mq.matches){reflow(g);}else{g.innerHTML=g._orig;}
    });
    bindLightbox();
  }

  // lightbox
  var lb,lbImg,lbCount,list=[],cur=0;
  function buildLb(){
    lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Image viewer');
    lb.innerHTML='<img alt=""><button class="x" aria-label="Close">Close</button><button class="p" aria-label="Previous">←</button><button class="n" aria-label="Next">→</button><span class="c"></span>';
    document.body.appendChild(lb);lbImg=lb.querySelector('img');lbCount=lb.querySelector('.c');
    lb.querySelector('.x').onclick=close;lb.querySelector('.p').onclick=function(){go(-1)};lb.querySelector('.n').onclick=function(){go(1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close();});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1);});
  }
  function show(i){cur=(i+list.length)%list.length;var f=list[cur];lbImg.src=f.dataset.full;lbImg.alt=f.querySelector('img').alt;lbCount.textContent=(cur+1)+' / '+list.length;}
  function open(f,scope){if(!lb)buildLb();list=[].slice.call(document.querySelectorAll('.ph'));show(list.indexOf(f));lb.classList.add('on');document.body.style.overflow='hidden';}
  function close(){lb.classList.remove('on');document.body.style.overflow='';}
  function go(d){show(cur+d);}
  function bindLightbox(){[].forEach.call(document.querySelectorAll('.ph'),function(f){if(f._b)return;f._b=1;f.tabIndex=0;f.setAttribute('role','button');f.addEventListener('click',function(){open(f);});f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(f);}});});}
  apply();
  var last=mq.matches,t;
  window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){if(mq.matches){apply();}else if(last){apply();}last=mq.matches;},150);});
})();
