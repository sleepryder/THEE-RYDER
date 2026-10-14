// Static site generator: node build.mjs  ->  writes HTML into the current folder
import fs from 'node:fs';
const C=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const ROWS=JSON.parse(fs.readFileSync('data/rows.json','utf8'));
const META=JSON.parse(fs.readFileSync('data/meta.json','utf8'));
const S=C.site, P=C.projects;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const origin='https://'+S.domain;
const idOf=n=>n.match(/^(\d+)/)[1];
const img=(slug,id,small)=>`/img/${slug}/${id}${small?'-s':''}.webp`;
const LOCAL=!!process.env.LOCAL;
const OUT=process.env.OUT||'.';
const localize=(p,html)=>{
  const depth=p.split('/').length-1; const rel=depth?'../'.repeat(depth):'./';
  html=html.replace(/(href="|content=")\/(#[^"]*)?"/g,(m,pre,hash)=>pre===('href="')?`href="${rel}index.html${hash||''}"`:m);
  return html.replace(/(["'\s,]|&quot;)\/((?:work|info|contact|img|css|js)\/[^"'\s#&]*)(#[^"'\s&]*)?(?=["'\s,]|&quot;)/g,(m,pre,path,hash)=>{
    let u=path; if(u.endsWith('/')) u+='index.html';
    return pre+rel+u+(hash||'');
  });
};
const write=(p,html)=>{const full=OUT+'/'+p;fs.mkdirSync(full.replace(/[^/]*$/,'')||'.',{recursive:true});fs.writeFileSync(full,(LOCAL&&p.endsWith('.html'))?localize(p,html):html);};
const atify=t=>esc(t).replace(/(@[\w.]+)/g,'<span class="at">$1</span>');

const nav=(cur)=>`<header class="top"><a class="brand" href="/">${S.name}</a><button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button><nav class="nav" id="nav" aria-label="Main"><a href="/work/"${cur==='work'?' aria-current="page"':''}>Work</a><a href="/info/"${cur==='info'?' aria-current="page"':''}>Info</a><a href="/contact/"${cur==='contact'?' aria-current="page"':''}>Contact</a></nav></header>`;
const foot=`<footer class="foot"><span>© ${S.name}, ${S.city}</span><span class="links"><a href="${S.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${S.behance}" target="_blank" rel="noopener">Behance</a><a href="mailto:${S.email}">${S.email}</a></span></footer>`;
const page=({path,title,desc,cur,body,og,cls='',extraHead='',scripts=''})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${origin}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${S.name}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${origin}${path}">
${og?`<meta property="og:image" content="${origin}${og}"><meta name="twitter:card" content="summary_large_image">`:''}
<meta name="theme-color" content="${cls==='home'?'#000000':'#ffffff'}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500&display=swap">
<link rel="stylesheet" href="/css/site.css">
${extraHead}
</head>
<body class="${cls}">
<a class="skip" href="#main">Skip to content</a>
${body}
<script src="/js/site.js" defer></script>
${scripts}
</body>
</html>`;

// ---------- gallery
const ratio=(slug,id)=>{const m=META[slug][id];return m[0]/m[1];};
const rowHtml=(slug,title,row)=>`<div class="row">${row.map((n,i)=>{const id=idOf(n),r=ratio(slug,id),m=META[slug][id];
 return `<figure class="ph${row.length===1?' solo':''}" style="--r:${r.toFixed(4)}" data-full="${img(slug,id)}"><img src="${img(slug,id,true)}" srcset="${img(slug,id,true)} ${m[2]}w, ${img(slug,id)} ${m[0]}w" sizes="(max-width:700px) 100vw, ${row.length>1?Math.round(100/row.length)+'vw':'100vw'}" width="${m[0]}" height="${m[1]}" alt="${esc(title)}, photograph ${parseInt(id,10)}" loading="lazy" decoding="async"></figure>`;}).join('')}</div>`;
const galleryHtml=(slug,title,sec)=>`<div class="gallery" data-gallery>${sec.rows.map(r=>rowHtml(slug,title,r)).join('')}</div>`;
const count=sec=>sec.rows.reduce((s,r)=>s+r.length,0);

// ---------- credits
const creditCol=col=>{
 let inner='';
 if(col.lines) inner=col.lines.map(l=>`<p>${atify(l)}</p>`).join('');
 else inner=col.groups.map(g=>col.roles?`<div class="g"><span class="role">${esc(g[0])}</span>${g.slice(1).map(l=>`<span>${atify(l)}</span>`).join('')}</div>`:`<div class="g">${g.map(l=>`<span>${atify(l)}</span>`).join('')}</div>`).join('');
 return `<div><h3>${esc(col.h)}</h3>${inner}</div>`;
};
const creditsHtml=cr=>cr&&cr.length?`<section class="credits" aria-labelledby="cr"><h2 id="cr">Credits</h2><div class="cols" style="--c:${Math.min(cr.length,3)}">${cr.map(creditCol).join('')}</div></section>`:'';
const metaHtml=m=>`<dl class="meta">${m.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

// ---------- project pages
P.forEach((p,i)=>{
 const next=P[(i+1)%P.length];
 const path=`/work/${p.slug}/`;
 const og=img(p.slug,p.cover);
 const intro=!p.meta?'':`<div class="p-intro${p.statement?'':' no-statement'}">${metaHtml(p.meta)}${p.statement?`<p class="statement">${esc(p.statement)}</p>`:''}</div>`;
 const title=`${p.title} | ${S.name}`;
 let body;
 const crumbs=`<div class="crumbs"><a href="/work/">← Work</a><span class="num">${p.num} / ${String(P.length).padStart(2,'0')}</span><span class="cat label">${p.category}</span></div>`;
 const nextTile=`<section class="next" aria-label="Next project"><span class="label">Next project</span><a class="tile" href="/work/${next.slug}/"><img src="${img(next.slug,next.cover)}" alt="" loading="lazy"><span>${next.num}&nbsp;&nbsp;${esc(next.title)} →</span></a></section>`;
 if(p.slug==='university-research'){
  const secs=ROWS[p.slug];
  const works=p.works.map((w,k)=>`<section class="uwork" id="${w.title.toLowerCase().replace(/[^a-z]+/g,'-')}"><div class="uh"><span class="n">${w.n}</span><h2>${esc(w.title)}</h2><span class="y">${esc(w.year)}</span></div>${galleryHtml(p.slug,w.title,secs[k])}<div class="p-intro">${metaHtml(w.meta)}<div class="statement">${w.statement.map(t=>`<p>${esc(t)}</p>`).join('')}</div></div></section>`).join('');
  body=`${nav('work')}<main id="main">${crumbs}<h1 class="p-title" style="--s:${p.size}">${esc(p.title)}</h1><div class="uni-intro"><p>${esc(p.intro)}</p></div>${works}${nextTile}</main>${foot}`;
 } else if(p.slug==='archive'){
  const secs=ROWS[p.slug];
  const per=secs.map(s=>`<div class="period"><div class="rule"><div class="row-h"><h2>${esc(s.title)}</h2><span class="label">${s.meta}  /  ${count(s)} PHOTOGRAPHS</span></div></div></div>${galleryHtml(p.slug,p.title,s)}`).join('');
  body=`${nav('work')}<main id="main">${crumbs}<h1 class="p-title" style="--s:${p.size}">${esc(p.title)}</h1>${intro}${per}${creditsHtml(p.credits)}${nextTile}</main>${foot}`;
 } else {
  body=`${nav('work')}<main id="main">${crumbs}<h1 class="p-title" style="--s:${p.size}">${esc(p.title)}</h1>${intro}${galleryHtml(p.slug,p.title,ROWS[p.slug][0])}${creditsHtml(p.credits)}${nextTile}</main>${foot}`;
 }
 const desc=p.statement?p.statement.slice(0,155).replace(/\s+\S*$/,'')+'.':(p.intro?p.intro.slice(0,155).replace(/\s+\S*$/,'')+'.':`${p.title}, ${p.category.toLowerCase()} by ${S.name}.`);
 write(`work/${p.slug}/index.html`,page({path,title,desc,cur:'work',body,og}));
});

// ---------- work catalogue
{
 const photo=P.filter(p=>p.category==='Photography');
 const tiles=photo.map(p=>`<a class="cat-item" href="/work/${p.slug}/"><div class="im"><img src="${img(p.slug,p.cover,true)}" style="object-position:${p.coverPos}" alt="${esc(p.title)}" loading="lazy"></div><div class="cap"><span class="n">${p.num}</span><span class="t">${esc(p.title)}</span><span class="d">${esc(p.tile)}</span></div></a>`).join('')+
 `<a class="cat-item sheet" href="#sheet"><div class="im"><b>Contact sheet</b><span>Every frame, numbered</span></div></a>`;
 const uni=P.find(p=>p.slug==='university-research');
 const research=`<div class="list"><a href="/work/${uni.slug}/"><span class="num">${uni.num}</span><span class="ttl">${esc(uni.title)}</span><span class="dsc">${esc(uni.tile)}</span><span class="end">→</span></a></div>`;
 const btn=(d,label)=>d[3]?`<a class="chip blue end" href="${d[3]}" target="_blank" rel="noopener">${label}</a>`:`<span class="chip soon end">In progress</span>`;
 const design=`<div class="list">${C.work.design.map(d=>`<div class="li"><span class="num">${d[0]}</span><span class="ttl">${esc(d[1])}</span><span class="dsc">${esc(d[2])}</span>${btn(d,'View on Behance →')}</div>`).join('')}</div>`;
 const film=`<div class="list">${C.work.film.map(d=>`<div class="li"><span class="num">${d[0]}</span><span class="ttl">${esc(d[1])}</span><span class="dsc">${esc(d[2])}</span><a class="chip blue end" href="${d[3]||'#'}" target="_blank" rel="noopener">${d[4]}</a></div>`).join('')}</div>`;
 // contact sheet: 42 frames interleaved across photography projects
 const pools=photo.map(p=>{const ids=[];ROWS[p.slug].forEach(s=>s.rows.forEach(r=>r.forEach(n=>{const id=idOf(n);if(!ids.includes(id))ids.push(id);})));return {p,ids};});
 const picks=[];let k=0;while(picks.length<42){for(const pool of pools){if(picks.length>=42)break;const idx=Math.floor(k*pool.ids.length/6)%pool.ids.length;const id=pool.ids[(idx+Math.floor(k/1))%pool.ids.length];if(!picks.some(x=>x.p===pool.p&&x.id===id))picks.push({p:pool.p,id});}k++;if(k>200)break;}
 const sheet=picks.slice(0,42).map((x,i)=>`<a href="/work/${x.p.slug}/"><img src="${img(x.p.slug,x.id,true)}" alt="${esc(x.p.title)}, frame ${i+1}" loading="lazy"><i>${i+1}</i></a>`).join('');
 const body=`${nav('work')}<main id="main"><h1 class="page-title h-xl page-head">Work</h1><div class="work-lead"><div><p>${esc(C.work.lead)}</p><div class="chips"><a class="chip" href="#photography">Photography</a><a class="chip" href="/work/archive/">Archive</a><a class="chip" href="#research">Research</a><a class="chip" href="#design">Design</a><a class="chip" href="#film">Film</a></div></div></div>
<div class="sec" id="photography"><h2>Photography</h2><span class="sec-actions"><a class="chip" href="/work/archive/">Browse the archive, 2020 to now →</a><a class="chip blue" href="${S.instagram}" target="_blank" rel="noopener">View more on Instagram →</a></span></div><div class="cat-grid">${tiles}</div>
<div class="sec" id="research"><h2>Research</h2></div>${research}
<div class="sec" id="design"><h2>Design</h2></div>${design}
<div class="sec" id="film"><h2>Film</h2></div>${film}
<div class="sec" id="sheet"><h2>Contact sheet</h2></div><div class="sheet-wrap">${sheet}</div></main>${foot}`;
 write('work/index.html',page({path:'/work/',title:`Work | ${S.name}`,desc:'Selected photography, research and design by Thee Ryder, gathered as one catalogue.',cur:'work',body,og:img('i-am-not-but-i-am','165')}));
}

// ---------- info
{
 const I=C.info;
 const tl=JSON.parse(fs.readFileSync('data/timeline.json','utf8'));
 const edu=I.education.map(e=>`<div class="irow"><span class="d">${esc(e[0])}</span><div><div class="a">${esc(e[1])}</div><div class="b">${esc(e[2])}</div></div></div>`).join('');
 const ex=I.exhibitions.map(e=>`<div class="irow"><span class="d">${esc(e[0])}</span><div><div class="a">${esc(e[1])}</div><div class="b">${esc(e[2])}</div></div></div>`).join('');
 const pub=I.publications.map(e=>`<div class="irow pub"><span class="d">${esc(e[0])}</span><div><div class="a">${esc(e[1])}</div></div></div>`).join('');
 const sk=I.skills.map(e=>`<div class="irow pub"><span class="d">${esc(e[0])}</span><div><div class="a">${esc(e[1])}</div></div></div>`).join('');
 const lg=I.languages.map(e=>`<div class="irow pub"><span class="d">${esc(e[0])}</span><div><div class="a">${esc(e[1])}</div></div></div>`).join('');
 const body=`${nav('info')}<main id="main"><h1 class="page-title h-xl page-head">Info</h1>
<div class="info-top"><div class="about">${I.about.map(t=>`<p>${esc(t)}</p>`).join('')}</div><aside class="else"><span class="label">Elsewhere</span><a href="${S.instagram}" target="_blank" rel="noopener">Instagram ${S.instagramHandle}</a><a href="${S.behance}" target="_blank" rel="noopener">Behance</a><a href="mailto:${S.email}">${S.email}</a></aside></div>
<section class="tl-sec" aria-labelledby="tl-h"><div class="tl-head"><div><span class="label">Timeline</span><h2 id="tl-h">Seven years, seven strings</h2></div><span class="hint"><i></i><span class="d">Interactive. Hover a year, pluck a string.</span><span class="m">Interactive. Tap a string.</span></span></div>
<div class="tl" id="tl" data-tl='${esc(JSON.stringify(tl)).replace(/&quot;/g,'&quot;')}'></div><noscript><p class="label" style="margin-top:20px">Timeline: study 2019 to 2026, photography from 2021, music video 2022 to 2023, art direction 2025 to 2026, design from 2025.</p></noscript></section>
<section class="block" id="education"><h2>Education and study abroad</h2><div>${edu}</div></section>
<section class="block" id="exhibitions"><h2>Exhibitions and workshops</h2><div>${ex}</div></section>
<section class="block" id="publications"><h2>Publications and fairs</h2><div>${pub}</div></section>
<section class="block" id="clients"><h2>Selected clients</h2><p class="clients">${esc(I.clients)}</p></section>
<section class="block" id="skills"><h2>Skills and tools</h2><div>${sk}</div></section>
<section class="block" id="languages"><h2>Languages</h2><div>${lg}</div></section></main>${foot}`;
 const ld={"@context":"https://schema.org","@type":"Person","name":"Valeriia Eriomenco-Yeromenko","alternateName":"Thee Ryder","url":origin,"jobTitle":"Photographer and visual artist","address":{"@type":"PostalAddress","addressLocality":"Bratislava","addressCountry":"SK"},"sameAs":[S.instagram,S.behance],"email":S.email};
 write('info/index.html',page({path:'/info/',title:`Info | ${S.name}`,desc:'Thee Ryder is a fashion photographer and visual artist based in Bratislava. Bio, timeline, education, exhibitions and publications.',cur:'info',body,og:img('i-am-not-but-i-am','165'),extraHead:`<script type="application/ld+json">${JSON.stringify(ld)}</script>`,scripts:'<script src="/js/timeline.js" defer></script>'}));
}

// ---------- contact
{
 const body=`${nav('contact')}<main id="main" class="contact"><h1 class="page-title h-xl page-head">Contact</h1><div class="wrap"><h2>Available for commissions worldwide.</h2><p class="sub">Based in Bratislava. Replies within two working days.</p><a class="big-mail" href="mailto:${S.email}">${S.email}</a>
<div class="clist"><a href="${S.instagram}" target="_blank" rel="noopener"><span class="label">Instagram</span><span>${S.instagramHandle}</span><span>→</span></a><a href="${S.behance}" target="_blank" rel="noopener"><span class="label">Behance</span><span>Design cases</span><span>→</span></a><a href="/"><span class="label">Website</span><span>${S.domain}</span><span>→</span></a></div></div></main>${foot}`;
 write('contact/index.html',page({path:'/contact/',title:`Contact | ${S.name}`,desc:'Thee Ryder is available for commissions worldwide. Based in Bratislava, replies within two working days.',cur:'contact',body}));
}

// ---------- home
{
 const ph=P.filter(p=>p.category==='Photography').length;
 const body=`<div class="hero-bg"><img src="${img('i-am-not-but-i-am','165')}" alt="" fetchpriority="high"></div>${nav('')}<main id="main" class="home-main"><div><h1>Photography, art direction and moving image.</h1></div><div><p class="lede">Thee Ryder is a multidisciplinary artist based in Bratislava. Fashion, editorial and research-based work, from concept to final delivery.</p><span class="pill">Available for commissions worldwide</span>
<nav class="index" aria-label="Sections"><a href="/work/#photography"><span class="n">01</span><span class="k">${ph} projects</span><span class="t">Photography</span></a><a href="/work/#research"><span class="n">02</span><span class="k">3 projects</span><span class="t">Research</span></a><a href="/work/#design"><span class="n">03</span><span class="k">On Behance</span><span class="t">Design</span></a><a href="/info/"><span class="n">04</span><span class="k">About and timeline</span><span class="t">Info</span></a></nav></div></main>`;
 write('index.html',page({path:'/',title:`${S.name} | Photography, art direction and moving image`,desc:'Thee Ryder is a multidisciplinary artist based in Bratislava. Fashion, editorial and research-based work, from concept to final delivery.',cur:'',body,cls:'home',og:img('i-am-not-but-i-am','165')}));
}

// ---------- 404, sitemap, robots, CNAME
write('404.html',page({path:'/404.html',title:`Not found | ${S.name}`,desc:'Page not found.',cur:'',body:`${nav('')}<main id="main"><h1 class="page-title h-xl page-head">404</h1><div class="wrap"><p class="sub" style="margin-top:32px;color:var(--gray)">This page does not exist. <a href="/work/" style="color:var(--ink);border-bottom:1px solid">Go to Work</a>.</p></div></main>${foot}`}));
const urls=['/','/work/','/info/','/contact/',...P.map(p=>`/work/${p.slug}/`)];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${origin}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
write('CNAME',S.domain+'\n');
write('.nojekyll','');
console.log('built',urls.length,'pages');
