import {sites} from './build.mjs';
const token=process.env.PAGES_DISPATCH_TOKEN,owner=process.env.GITHUB_OWNER,sha=process.env.CONTENT_REF;
if(!token){console.log('No cross-repository dispatch credential configured. Content validation passed; website builds can be started manually with workflow_dispatch.');process.exit(0);}
if(!owner||!/^[0-9a-f]{40}$/.test(sha||''))throw Error('A GitHub owner and a complete content commit SHA are required.');
for(const site of sites){const response=await fetch(`https://api.github.com/repos/${owner}/${site.repo}/dispatches`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({event_type:'content-updated',client_payload:{content_sha:sha}})});if(!response.ok)throw Error(`Dispatch failed for ${site.repo}: HTTP ${response.status}`);console.log(`Queued ${site.repo}`);}
