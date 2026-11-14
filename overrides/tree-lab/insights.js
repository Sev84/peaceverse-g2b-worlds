/* Local-only visualisation. No external writes, invented data, or cross-scope totals. */
const fmt=n=>n.toLocaleString(en?'en-GB':'tr-TR',{maximumFractionDigits:3});
const qualityKind=r=>/estimated|tahmin/i.test(r.quality)?'estimated':'measured';
function chart(container, rows, metric){
 container.replaceChildren();
 const entries=rows.map(r=>({r,v:calculate(r)[metric]})).filter(e=>e.v!==null&&Number.isFinite(e.v));
 if(!entries.length){const p=document.createElement('p');p.className='chart-empty';p.textContent=t('Bu filtrede hesaplanabilir veri yok.','No calculable data for this filter.');container.append(p);return}
 const max=Math.max(...entries.map(e=>Math.abs(e.v)),1);
 entries.forEach(({r,v})=>{
 const row=document.createElement('div');row.className='chart-row';
 const label=document.createElement('div');label.className='chart-label';const name=document.createElement('span');name.textContent=`${r.date} · ${r.activity}`;
 const value=document.createElement('strong');value.textContent=fmt(v)+(metric==='water'?' L':' kg CO₂e');label.append(name,value);
 const track=document.createElement('div');track.className='chart-track';track.setAttribute('aria-hidden','true');
 const bar=document.createElement('div');bar.className='chart-bar '+(metric==='carbon'?'emissions':v<0?'negative':'');bar.style.width=(Math.abs(v)/max*100)+'%';track.append(bar);
 const note=document.createElement('div');note.className='small';note.textContent=t(qualityKind(r)==='estimated'?'Tahmin':'Ölçüm beyanı',qualityKind(r)==='estimated'?'Estimate':'User-reported measurement')+' · '+r.source+(metric==='carbon'?' · '+r.factorSource:'');
 row.append(label,track,note);container.append(row);
 });
}
function renderCharts(){const rows=records.filter(r=>($('chartFilter').value==='all'||qualityKind(r)===$('chartFilter').value)&&(!$('chartMonth').value||r.date.startsWith($('chartMonth').value))).sort((a,b)=>a.date.localeCompare(b.date));$('chartSummary').textContent=t(`${rows.length} kayıt gösteriliyor. Eksik göstergeler hesaplanmadı.`,`${rows.length} records shown. Incomplete indicators were not calculated.`);chart($('waterChart'),rows,'water');chart($('emissionChart'),rows,'carbon')}
$('chartFilter').onchange=renderCharts;$('chartMonth').onchange=renderCharts;
$('trackerForm').addEventListener('submit',()=>renderCharts());renderCharts();
let shortcuts=[];try{const data=JSON.parse(localStorage.getItem('gbt-padlet')||'[]');if(Array.isArray(data))shortcuts=data}catch(e){}
function validPadlet(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='padlet.com'||u.hostname==='www.padlet.com')&&!u.username&&!u.password}catch(e){return false}}
function drawLinks(){$('padletLinks').replaceChildren();if(!shortcuts.length){const p=document.createElement('p');p.className='small';p.textContent=t('Bahar panosu henüz tanımlanmadı.','No spring board configured yet.');$('padletLinks').append(p)}shortcuts.forEach((s,i)=>{if(!validPadlet(s.url))return;const div=document.createElement('div');div.className='shortcut';const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=s.project+' · '+s.month+' ↗';const note=document.createElement('p');note.className='small';note.textContent=t('Kullanıcı ekledi; hedef bağımsız doğrulanmadı. ','User-added; destination not independently verified. ')+(s.note||'');const b=document.createElement('button');b.type='button';b.textContent=t('Yerel kısayolu kaldır','Remove local shortcut');b.onclick=()=>{shortcuts.splice(i,1);saveLinks();drawLinks()};div.append(a,b,note);$('padletLinks').append(div)})}
function saveLinks(){try{localStorage.setItem('gbt-padlet',JSON.stringify(shortcuts));return true}catch(e){return false}}
$('padletForm').onsubmit=e=>{e.preventDefault();const url=$('padletUrl').value.trim();if(!validPadlet(url)){$('padletStatus').textContent=t('Yalnız https://padlet.com pano bağlantısı kullanın.','Use an https://padlet.com board link only.');return}const s={project:$('padletProject').value,month:$('padletMonth').value,url,note:$('padletNote').value.trim()};const i=shortcuts.findIndex(x=>x.project===s.project&&x.month===s.month);if(i>=0)shortcuts[i]=s;else shortcuts.push(s);$('padletStatus').textContent=saveLinks()?t('Yalnız bu tarayıcıda kaydedildi. Padlet’e gönderi yapılmadı.','Saved only in this browser. Nothing was posted to Padlet.'):t('Kalıcı kayıt başarısız. Bağlantıyı ayrıca saklayın.','Storage failed. Save the link separately.');drawLinks()};drawLinks();
