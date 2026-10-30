"""Prepared publisher. No network mutation occurs without --upload or --bind-domains."""
from pathlib import Path
import argparse,base64,json,os,re,subprocess,time,urllib.request,urllib.error

BASE=Path(__file__).resolve().parents[2]
SITES=json.loads((BASE/'journeys/sites.json').read_text(encoding='utf-8'))
REPOS=['human-journeys']+[s['repo'] for s in SITES]
parser=argparse.ArgumentParser()
parser.add_argument('--plan',action='store_true')
parser.add_argument('--owner')
parser.add_argument('--upload',action='store_true')
parser.add_argument('--bind-domains',action='store_true',help='Use only after DNS preparation; configures Pages hostnames, not DNS.')
args=parser.parse_args()
if not args.upload and not args.bind_domains:
 for repo in REPOS:
  s=next((x for x in SITES if x['repo']==repo),None)
  print(f'{repo:20s} {s["domain"] if s else "content source"}')
 print('Plan only. No upload, Pages setting, DNS or remote mutation performed.')
 raise SystemExit()
if not args.owner or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]*',args.owner):parser.error('--owner is required')
TOKEN=os.environ.get('GITHUB_TOKEN')
if not TOKEN:parser.error('Set GITHUB_TOKEN in the process environment; it is never written to a file.')
OWNER=args.owner
def api(method,endpoint,payload=None):
 body=json.dumps(payload).encode() if payload is not None else None
 req=urllib.request.Request('https://api.github.com'+endpoint,data=body,method=method,headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'datubu-publisher','Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=40) as response:
   raw=response.read();return response.status,json.loads(raw) if raw else {}
 except urllib.error.HTTPError as e:
  try:message=json.loads(e.read()).get('message','Request failed')
  except:message='Request failed'
  return e.code,{'message':message}
def require(status,result,expected=(200,201,202,204)):
 if status not in expected:raise RuntimeError(f'GitHub HTTP {status}: {result.get("message","Request failed")}')
status,user=api('GET','/user');require(status,user)
if OWNER.lower()!=user['login'].lower():
 status,org=api('GET','/orgs/'+OWNER);require(status,org)

git_env=os.environ.copy()
git_env.update({'GIT_TERMINAL_PROMPT':'0','GCM_INTERACTIVE':'never','GIT_CONFIG_COUNT':'2','GIT_CONFIG_KEY_0':'http.https://github.com/.extraheader','GIT_CONFIG_VALUE_0':'AUTHORIZATION: basic '+base64.b64encode(('x-access-token:'+TOKEN).encode()).decode(),'GIT_CONFIG_KEY_1':'credential.helper','GIT_CONFIG_VALUE_1':''})
def git(repo,*cmd,capture=True):
 result=subprocess.run(['git',*cmd],cwd=BASE/repo,env=git_env,text=True,capture_output=capture)
 if result.returncode:raise RuntimeError(f'Git operation failed in {repo}; inspect local repository state. Token and authentication output are not printed.')
 return result.stdout.strip() if capture else ''

if args.upload:
 # Preflight every local and remote before creating anything.
 for repo in REPOS:
  git(repo,'rev-parse','--verify','HEAD')
  if git(repo,'status','--porcelain'):raise RuntimeError(f'Uncommitted files in {repo}')
  status,remote=api('GET',f'/repos/{OWNER}/{repo}')
  if status==200:
   branch_status,_=api('GET',f'/repos/{OWNER}/{repo}/branches/main')
   if branch_status==200:
    # Permit a resumable same-commit upload, otherwise stop before overwriting.
    remote_head=api('GET',f'/repos/{OWNER}/{repo}/git/ref/heads/main')[1].get('object',{}).get('sha')
    if remote_head!=git(repo,'rev-parse','HEAD'):raise RuntimeError(f'{OWNER}/{repo} is non-empty with different history; no overwrite attempted.')
  elif status!=404:require(status,remote)
 for repo in REPOS:
  status,remote=api('GET',f'/repos/{OWNER}/{repo}')
  if status==404:
   endpoint='/user/repos' if OWNER.lower()==user['login'].lower() else '/orgs/'+OWNER+'/repos'
   status,remote=api('POST',endpoint,{'name':repo,'private':False,'auto_init':False,'description':'Datubu human journeys: '+repo});require(status,remote)
  url=f'https://github.com/{OWNER}/{repo}.git'
  remotes=git(repo,'remote').splitlines()
  if 'origin' in remotes:
   if git(repo,'remote','get-url','origin')!=url:raise RuntimeError(f'Unexpected origin in {repo}')
  else:git(repo,'remote','add','origin',url)
  git(repo,'push','-u','origin','main')
  print(f'Uploaded {OWNER}/{repo}')
 for s in SITES:
  endpoint=f'/repos/{OWNER}/{s["repo"]}/pages'
  status,state=api('GET',endpoint)
  if status==404:status,state=api('POST',endpoint,{'build_type':'workflow'});require(status,state)
  else:
   require(status,state)
   if state.get('build_type')!='workflow':raise RuntimeError(f'Existing branch-based Pages configuration in {s["repo"]}; review before changing.')
  status,result=api('POST',f'/repos/{OWNER}/{s["repo"]}/actions/workflows/deploy.yml/dispatches',{'ref':'main'});require(status,result)
  print(f'Queued Pages build: {s["repo"]}')
 print('Workflows queued. Verify Actions results and published URLs before reporting deployment complete. Custom domains are not bound by --upload.')

if args.bind_domains:
 for s in SITES:
  status,result=api('PUT',f'/repos/{OWNER}/{s["repo"]}/pages',{'cname':s['domain']});require(status,result)
  print(f'Configured Pages hostname {s["domain"]}; DNS and certificate readiness must still be verified.')
 print('After DNS and HTTPS are ready on every site, set CUSTOM_DOMAINS_ACTIVE=true and rebuild. No DNS changes were made.')
