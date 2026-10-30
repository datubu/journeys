import path from 'node:path';import {loadContent,engine} from './build.mjs';
const d=loadContent(process.argv[2]?path.resolve(process.argv[2]):path.resolve(engine,'../human-journeys'));
console.log(`Content valid: ${d.stations.length} stations, ${d.routes.length} published route, ${d.routes.reduce((n,r)=>n+r.chapters.length,0)} paired chapters, ${d.places.length} paired places, ${d.sources.length} paired sources.`);
