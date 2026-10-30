import fs from 'node:fs';import path from 'node:path';import {build,engine,sites} from './build.mjs';
const base=path.resolve(engine,'..'),output=path.join(base,'preview');
for(const site of sites)build({siteId:site.id,contentRoot:path.join(base,'human-journeys'),out:path.join(output,site.id),networkMode:'local'});
fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./main/"><a href="./main/">打开大徒步 / Open Datubu</a>');
console.log('Preview all sites: npm run preview → http://127.0.0.1:4180/');
