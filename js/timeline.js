(function(){
  var root=document.getElementById('tl');if(!root)return;
  var D=JSON.parse(root.getAttribute('data-tl'));
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch=window.matchMedia('(hover:none)').matches;
  var NS='http://www.w3.org/2000/svg';
  var rowsEl=[],card,raf=null;
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
  function lab(){return root.clientWidth<700?84:Math.round(root.clientWidth*0.1765);}
  function build(){
    root.innerHTML='';rowsEl=[];
    var L=lab();root.style.setProperty('--lab',L+'px');
    var years=document.createElement('div');years.className='tl-years';years.style.gridTemplateColumns='repeat('+D.years.length+',1fr)';
    D.years.forEach(function(y){var b=document.createElement('button');b.type='button';b.textContent=y;b.setAttribute('aria-label','Highlight '+y);b.addEventListener('pointerenter',function(){hi(y)});b.addEventListener('pointerleave',function(){hi(null)});b.addEventListener('focus',function(){hi(y)});b.addEventListener('blur',function(){hi(null)});years.appendChild(b);});
    root.appendChild(years);
    var grid=document.createElement('div');grid.className='tl-grid';
    D.years.forEach(function(y,i){var g=document.createElement('i');g.style.left=(i/D.years.length*100)+'%';g.dataset.y=y;grid.appendChild(g);});
    root.appendChild(grid);
    D.rows.forEach(function(r){
      var row=document.createElement('div');row.className='trow';
      var nm=document.createElement('span');nm.className='nm';nm.textContent=r.name;row.appendChild(nm);
      var W=root.clientWidth-L;
      var svg=el('svg',{viewBox:'0 0 '+W+' 66',width:W,height:66,role:'group','aria-label':r.name},null);
      row.appendChild(svg);root.appendChild(row);
      var st={r:r,svg:svg,W:W,cy:0,vy:0,target:0,active:false,px:W/2,parts:[]};
      draw(st);
      rowsEl.push(st);
      bindRow(st);
    });
    card=document.createElement('a');card.className='tl-card';card.setAttribute('aria-hidden','true');root.appendChild(card);
  }
  function X(st,t){return (t-D.start)/(D.end-D.start)*st.W;}
  // quadratic string: M0,33 Q px,33+2cy W,33 ; y at x via param search
  function yAt(st,x){
    var W=st.W,px=Math.max(1,Math.min(W-1,st.px));
    var lo=0,hi=1,t=0.5;
    for(var i=0;i<18;i++){t=(lo+hi)/2;var xt=2*(1-t)*t*px+t*t*W;if(xt<x)lo=t;else hi=t;}
    return 33+2*st.cy*2*t*(1-t)/1;
  }
  function seg(st,a,b){
    var xa=Math.max(0,a),xb=Math.min(st.W,b),n=Math.max(4,Math.round((xb-xa)/8)),d='';
    for(var i=0;i<=n;i++){var x=xa+(xb-xa)*i/n;d+=(i?'L':'M')+x.toFixed(1)+' '+yAt(st,x).toFixed(2)+' ';}
    return d;
  }
  function draw(st){
    var s=st.svg;while(s.firstChild)s.removeChild(s.firstChild);
    el('path',{class:'base',d:seg(st,0,st.W)},s);
    (st.r.segs||[]).forEach(function(g){
      var xa=X(st,g.a),xb=X(st,g.b);
      var grp=el('g',{class:'hit','data-a':g.a,'data-b':g.b},s);
      var A=el('a',{href:g.href,tabindex:0,'aria-label':g.title+', '+g.dates},grp);
      el('path',{class:'bar',d:seg(st,xa,xb)},A);
      el('circle',{class:'dot',cx:xa,cy:yAt(st,xa),r:4},A);
      if(g.arrow){var tx=el('text',{class:'arrow',x:st.W-14,y:yAt(st,st.W-14)+5},A);tx.textContent='→';}else el('circle',{class:'dot',cx:xb,cy:yAt(st,xb),r:4},A);
      var tx2=el('text',{x:xa,y:yAt(st,xa)-18},A);tx2.textContent=g.label;
      el('rect',{x:xa-6,y:12,width:Math.max(12,xb-xa+12),height:42,fill:'transparent'},A);
      A.addEventListener('pointerenter',function(e){if(!touch)showCard(st,g,e)});
      A.addEventListener('focus',function(e){showCard(st,g,e,true)});
      A.addEventListener('pointerleave',hideCard);A.addEventListener('blur',hideCard);
      if(touch){A.addEventListener('click',function(e){if(!card.classList.contains('on')||card._g!==g){e.preventDefault();showCard(st,g,e);}});}
    });
    (st.r.dots||[]).forEach(function(g){
      var x=X(st,g.t),grp=el('g',{class:'hit','data-a':g.t,'data-b':g.t},s);
      var A=el('a',{href:g.href,tabindex:0,'aria-label':g.title+', '+g.dates},grp);
      el('circle',{class:'show',cx:x,cy:yAt(st,x),r:5},A);
      el('circle',{cx:x,cy:yAt(st,x),r:14,fill:'transparent'},A);
      A.addEventListener('pointerenter',function(e){if(!touch)showCard(st,g,e)});
      A.addEventListener('focus',function(e){showCard(st,g,e,true)});
      A.addEventListener('pointerleave',hideCard);A.addEventListener('blur',hideCard);
      if(touch){A.addEventListener('click',function(e){if(!card.classList.contains('on')||card._g!==g){e.preventDefault();showCard(st,g,e);}});}
    });
  }
  function bindRow(st){
    var s=st.svg;
    s.addEventListener('pointermove',function(e){
      var r=s.getBoundingClientRect();var y=e.clientY-r.top-33;
      st.px=e.clientX-r.left;
      if(Math.abs(y)<28){st.active=true;st.target=Math.max(-24,Math.min(24,y))/2;}else{st.active=false;st.target=0;}
      if(reduce){st.cy=0;return;}
      kick();
    });
    s.addEventListener('pointerleave',function(){st.active=false;st.target=0;kick();hideCard();});
  }
  function kick(){if(!raf)raf=requestAnimationFrame(loop);}
  function loop(){
    var busy=false;
    rowsEl.forEach(function(st){
      st.vy+=(st.target-st.cy)*0.12;st.vy*=0.88;st.cy+=st.vy;
      if(Math.abs(st.vy)>0.02||Math.abs(st.cy-st.target)>0.02){busy=true;draw(st);}
      else if(st.cy!==st.target){st.cy=st.target;draw(st);}
    });
    raf=busy?requestAnimationFrame(loop):null;
  }
  function showCard(st,g,e,fromFocus){
    card._g=g;card.href=g.href;card.innerHTML='<b></b><span></span><p></p><em>Open →</em>';
    card.querySelector('b').textContent=g.title;card.querySelector('span').textContent=g.dates;card.querySelector('p').textContent=g.line;
    var rr=root.getBoundingClientRect(),sr=st.svg.getBoundingClientRect();
    var cx=fromFocus?(sr.left+sr.width/2):e.clientX;
    var left=Math.max(0,Math.min(root.clientWidth-262,cx-rr.left+14));
    card.style.left=left+'px';card.style.top=(sr.top-rr.top+44)+'px';
    card.classList.add('on');card.removeAttribute('aria-hidden');
  }
  function hideCard(){if(touch)return;card.classList.remove('on');card.setAttribute('aria-hidden','true');}
  document.addEventListener('pointerdown',function(e){if(touch&&card&&!card.contains(e.target)&&!e.target.closest('.trow')){card.classList.remove('on');}});
  function hi(y){
    var grid=root.querySelectorAll('.tl-grid i');
    [].forEach.call(grid,function(g){g.classList.toggle('on',y&&+g.dataset.y===y);});
    root.classList.toggle('dim',!!y);
    [].forEach.call(root.querySelectorAll('.hit'),function(h){
      var a=+h.getAttribute('data-a'),b=+h.getAttribute('data-b');
      var on=y&&b>=y&&a<y+1;h.style.opacity=on?1:'';h.classList.toggle('hit',true);
      h.querySelectorAll('.bar,.dot,.show').forEach(function(n){n.style.opacity=!y?'':(on?'1':'0.2');});
    });
    [].forEach.call(root.querySelectorAll('.tl-years button'),function(b){b.classList.toggle('on',y&&+b.textContent===y);});
  }
  build();
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(build,150);});
})();
