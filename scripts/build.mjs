import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { marked } from 'marked';

export const engine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sites=JSON.parse(fs.readFileSync(path.join(engine,'sites.json'),'utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function record(file){
 const raw=fs.readFileSync(file,'utf8'),match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!match)throw Error(`Missing Markdown frontmatter: ${file}`);
 const meta=parse(match[1]);if(!meta.id||!['zh','en'].includes(meta.lang)||!meta.title)throw Error(`Invalid metadata: ${file}`);
 if(/<\/?[a-z][^>]*>|(?:javascript|vbscript|data):/i.test(match[2]))throw Error(`Unsafe content: ${file}`);
 return {...meta,body:match[2].trim(),html:marked.parse(match[2]),sourcePath:file.replaceAll('\\','/').split('/human-journeys/')[1]};
}
const files=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]):[];
export function loadContent(root){
 const docs=files(root).filter(f=>/\.(zh|en)\.md$/.test(f)).map(file=>({...record(file),sourcePath:path.relative(root,file).replaceAll('\\','/')})),pairs=new Map();
 for(const d of docs){const key=d.sourcePath.replace(/\.(zh|en)\.md$/,'');if(!pairs.has(key))pairs.set(key,{});pairs.get(key)[d.lang]=d;}
 for(const [key,p] of pairs){if(!p.zh||!p.en||p.zh.id!==p.en.id)throw Error(`Unpaired translation: ${key}`);for(const field of ['coordinates','place_id','route','order','url'])if(JSON.stringify(p.zh[field])!==JSON.stringify(p.en[field]))throw Error(`Translation metadata differs for ${field}: ${key}`);}
 const refs=Object.fromEntries([...pairs].filter(([k])=>k.startsWith('sources/')).map(([,v])=>[v.zh.id,v]));
 for(const d of docs){for(const id of d.sources||[])if(!refs[id])throw Error(`Missing source ${id}: ${d.sourcePath}`);}
 const stationRecords=Object.fromEntries([...pairs].filter(([k])=>k.startsWith('stations/')).map(([,v])=>[v.zh.id,v]));
 for(const s of sites)if(!stationRecords[s.id])throw Error(`Missing station ${s.id}`);
 const routes=[...pairs].filter(([k,v])=>/^routes\/[^/]+\/index$/.test(k)&&v.zh.status==='published').map(([key,v])=>{
  if(v.en.status!=='published')throw Error(`Publication mismatch: ${key}`);
  const base=key.replace(/\/index$/,''),chapters=[...pairs].filter(([k])=>k.startsWith(base+'/chapters/')).map(([,v])=>v).sort((a,b)=>a.zh.order-b.zh.order);
  chapters.forEach((p,i)=>{if(p.zh.order!==i+1||p.en.order!==i+1)throw Error('Chapter order must be consecutive');for(const n of [p.zh,p.en])if(!Array.isArray(n.coordinates)||n.coordinates.length!==2||!n.coordinates.every(Number.isFinite)||Math.abs(n.coordinates[0])>180||Math.abs(n.coordinates[1])>85)throw Error('Invalid coordinates');});
  const geometry=JSON.parse(fs.readFileSync(path.join(root,base,v.zh.geometry),'utf8'));
  if(geometry.type!=='FeatureCollection'||geometry.features.some(f=>f.geometry.type!=='LineString'||f.geometry.coordinates.length<2))throw Error('Invalid route geometry');
  return {id:v.zh.id,meta:v,chapters,geometry};
 });
 const people=[...pairs].filter(([k])=>k.startsWith('people/')).map(([,v])=>v),places=[...pairs].filter(([k])=>k.startsWith('places/')).map(([,v])=>v);
 for(const r of routes){if(r.meta.zh.person&&!people.some(x=>x.zh.id===r.meta.zh.person))throw Error(`Missing person ${r.meta.zh.person}`);for(const p of r.chapters)if(!places.some(x=>x.zh.id===p.zh.place_id))throw Error(`Missing place ${p.zh.place_id}`);}
 return {stations:sites.map(s=>({...s,text:stationRecords[s.id]})),routes,sources:Object.values(refs),people,places};
}

export function build({siteId='main',contentRoot=path.resolve(engine,'../human-journeys'),out=path.join(engine,'dist'),networkMode='github',owner='',contentRef='local-working-tree'}={}){
 const site=sites.find(s=>s.id===siteId);if(!site)throw Error(`Unknown site ${siteId}`);
 const data=loadContent(contentRoot);data.site=site;data.networkMode=networkMode;data.owner=owner;data.contentRef=contentRef;data.engineRef=process.env.ENGINE_REF||'local-working-tree';
 const buildId=crypto.createHash('sha256').update(JSON.stringify(data)).update(files(path.join(engine,'src')).map(f=>fs.readFileSync(f)).join('')).digest('hex').slice(0,16);data.buildId=buildId;
 fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(engine,'src'),path.join(out,'assets'),{recursive:true});
 fs.writeFileSync(path.join(out,'data.json'),JSON.stringify(data));fs.writeFileSync(path.join(out,'.nojekyll'),'');fs.writeFileSync(path.join(out,'CNAME'),site.domain+'\n');
 const html=(base='./',storyTitle='')=>`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#15251f"><meta name="description" content="${escape(data.stations.find(s=>s.id===siteId).text.zh.tagline)}"><title>${escape(storyTitle?storyTitle+' · ':'')}${escape(data.stations.find(s=>s.id===siteId).text.zh.title)} · 大徒步</title><script>try{const q=new URLSearchParams(location.search);let t=q.get('theme')||localStorage.getItem('datubu-theme');if(!['light','dark'].includes(t))t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;let l=q.get('lang')||localStorage.getItem('datubu-lang')||'zh';document.documentElement.lang=l==='en'?'en':'zh-CN'}catch{}</script><link rel="icon" href="${base}assets/icon.svg" type="image/svg+xml"><link rel="manifest" href="${base}manifest.webmanifest"><link rel="stylesheet" href="${base}assets/maplibre-gl.css"><link rel="stylesheet" href="${base}assets/style.css"><link rel="stylesheet" href="${base}assets/experience.css"><script defer src="${base}assets/maplibre-gl.js"></script><script type="module" src="${base}assets/client.js"></script></head><body><a class="skip" href="#app">跳至内容 / Skip to content</a><header id="header"></header><main id="app"><div class="loading">大徒步 / DATUBU<br><small>正在展开山河 · Opening the atlas…</small></div></main><nav id="bottomNav" aria-label="移动导航 / Mobile navigation"></nav><div id="notice" role="status"></div><dialog id="dialog"><div class="dialog-head"><span>DATUBU / FIELD NOTES</span><button id="closeDialog" aria-label="关闭 / Close">×</button></div><div id="dialogBody"></div></dialog><noscript><p>交互地图和语言切换需要 JavaScript。 / Interactive maps and language switching require JavaScript.</p><p><a href="${base}reading.html">阅读玄奘案例 / Read the Xuanzang story</a></p></noscript></body></html>`;
 fs.writeFileSync(path.join(out,'index.html'),html());
 for(const r of data.routes){if(!/^[a-z0-9][a-z0-9-]*$/.test(r.id))throw Error('Route IDs must be lowercase URL slugs');fs.mkdirSync(path.join(out,'story',r.id),{recursive:true});fs.writeFileSync(path.join(out,'story',r.id,'index.html'),html('../../',r.meta.zh.title));}
 fs.writeFileSync(path.join(out,'reading.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>大徒步 · 阅读 / Datubu · Reading</title><style>body{max-width:760px;margin:3rem auto;padding:0 24px;font:17px/1.9 Georgia,serif;color:#26372c}a{color:#687b3d}section{border-top:1px solid #ddd;margin-top:40px;padding-top:30px}</style><a href="./">← 大徒步 / Datubu</a>${data.routes.map(r=>['zh','en'].map(l=>`<section lang="${l}"><h1>${escape(r.meta[l].title)}</h1>${r.meta[l].html}${r.chapters.map(c=>`<h2>${escape(c[l].title)}</h2>${c[l].html}`).join('')}</section>`).join('')).join('')}</html>`);
 fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:`大徒步 · ${data.stations.find(s=>s.id===siteId).text.zh.title}`,short_name:'Datubu',start_url:'./',scope:'./',display:'standalone',background_color:'#f5f3e9',theme_color:'#15251f',icons:[{src:'assets/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]}));
 const precache=['./','index.html','reading.html','data.json','manifest.webmanifest',...data.routes.flatMap(r=>['story/'+r.id+'/','story/'+r.id+'/index.html']),...files(path.join(out,'assets')).map(f=>path.relative(out,f).replaceAll('\\','/'))];
 fs.writeFileSync(path.join(out,'sw.js'),`const CACHE='datubu-${siteId}-${buildId}';const PREFIX='datubu-${siteId}-';const FILES=${JSON.stringify(precache)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match('./'):Response.error()))))});`);
 fs.writeFileSync(path.join(out,'build-info.json'),JSON.stringify({site:siteId,domain:site.domain,contentRef,engineRef:data.engineRef,buildId,routes:data.routes.map(r=>r.id),languages:['zh','en']},null,2));
 console.log(`Built ${site.domain}: ${data.routes.length} source route, ${data.routes.reduce((n,r)=>n+r.chapters.length,0)} bilingual chapters → ${out}`);return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const configPath=process.env.SITE_CONFIG||path.join(engine,'site.config.json'),config=fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):{id:'main'};
 build({siteId:process.env.SITE_ID||config.id,contentRoot:process.env.CONTENT_DIR?path.resolve(process.env.CONTENT_DIR):path.resolve(engine,'../human-journeys'),out:process.env.OUTPUT_DIR?path.resolve(process.env.OUTPUT_DIR):path.join(engine,'dist'),networkMode:process.env.NETWORK_MODE||'github',owner:process.env.GITHUB_OWNER||'',contentRef:process.env.CONTENT_REF||'local-working-tree'});
}
