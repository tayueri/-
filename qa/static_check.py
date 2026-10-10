from pathlib import Path
from html.parser import HTMLParser
from zipfile import ZipFile
import hashlib,json,re
ROOT=Path(__file__).resolve().parent.parent
checks=[]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.stack=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs);self.rows.append({'tag':tag,'attrs':d})
  if 'id' in d:self.ids.append(d['id'])
  if tag not in ['meta','link','img','input','br','hr','source']:self.stack.append(tag)
 def handle_endtag(self,tag):
  assert self.stack and self.stack[-1]==tag,(tag,self.stack[-6:]);self.stack.pop()
for name in ['index.html','outing.html']:
 page=Page();page.feed((ROOT/name).read_text());assert not page.stack;assert len(set(page.ids))==len(page.ids)
 checks.append(f'{name}: balanced HTML / unique IDs')
 for row in page.rows:
  a=row['attrs']
  for key in ['src','href']:
   value=a.get(key)
   if not value:continue
   assert not re.match(r'^(https?:|//|tel:|mailto:)',value),value
   if value.startswith('#'):assert value[1:] in page.ids,value
   else:assert (ROOT/value.split('?',1)[0]).is_file(),value
  for key in ['aria-labelledby','aria-describedby','aria-controls']:
   if a.get(key):assert all(x in page.ids for x in a[key].split()),(key,a[key])
  if a.get('data-topic'):assert a['data-topic'] in page.ids
  for key in ['id','class']:
   assert not re.search(r'\b(?:adOverlay|ad-card|ad-content|ad-cta|ad-click-area)\b',a.get(key,'')),(key,a)
 (ROOT/'qa'/f'{name}.json').write_text(json.dumps(page.rows,ensure_ascii=False))
 checks.append(f'{name}: local references / anchors / ARIA / neutral names')
js=(ROOT/'script.js').read_text();assert js==(ROOT/'script-js.txt').read_text()
assert not re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\b|https?://',js)
assert 'checkL3' not in js and 'isMostlyVisible' not in js and 'addEventListener("scroll"' not in js
checks.append('No external JS communication; script-js.txt synchronized; no scroll completion')
css=(ROOT/'style.css').read_text();assert css.count('{')==css.count('}')
assert '@import' not in css and 'http://' not in css and 'https://' not in css
assert '.feedback-overlay{z-index:200}' in css
checks.append('CSS balanced; no remote resources; explanations above full-screen layers')
assert 'width:44px;height:44px' in css and 'width:48px;height:48px' in css
checks.append('Original 44px / 48px close targets retained (actual geometry unverified)')
prior=ROOT.parent/'audit-source'/'LEVEL1-BETA-02.zip'
if prior.exists():
 with ZipFile(prior) as z:
  prefix=z.namelist()[0].split('/')[0]+'/'
  for asset in sorted((ROOT/'assets').glob('*')):
   assert hashlib.sha256(asset.read_bytes()).digest()==hashlib.sha256(z.read(prefix+'assets/'+asset.name)).digest(),asset.name
  checks.append('All 5 image assets byte-identical to saved Beta 02')
  old=z.read(prefix+'outing.html').decode()
  new=(ROOT/'outing.html').read_text()
  for a,b in [('  <!-- L1-5:','  <!-- L1-6:'),('  <!-- L1-6:','  <div id="feedbackLayer"')]:
   assert old[old.index(a):old.index(b)]==new[new.index(a):new.index(b)]
  checks.append('L1-5 / L1-6 approved campaign markup unchanged')
print('\n'.join('PASS '+x for x in checks))
print('Browser render, horizontal overflow, iPhone Safari and AdGuard: UNVERIFIED')
