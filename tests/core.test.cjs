// Run: node tests/core.test.cjs (no dependencies).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const memory=new Map();
const context=vm.createContext({window:{},console,Date,Math,crypto:require('node:crypto').webcrypto,localStorage:{getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,v)}});
context.window=context;
for(const name of ['js/config.js','js/newlines.js','js/parser.js','js/storage.js','data/stamps.js','data/common-templates.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context);
const O=context.Ofuregaki;
const plain=x=>JSON.parse(JSON.stringify(x));
test('all four colors, coordinates inside colors, and stamps parse together',()=>{
 const parsed=O.parser.parse('&赤& @青@ #橙# $1209,578$ {13}');
 assert.deepEqual(plain(parsed.nodes.filter(n=>n.type==='color').map(n=>n.color)),['red','blue','orange','green']);
 assert.equal(parsed.nodes.find(n=>n.color==='green').children[0].type,'coordinate');
 assert.equal(parsed.nodes.at(-1).id,'13');assert.equal(parsed.warnings.length,0);
});
test('unclosed marker warns without deleting text; crossing syntax is preserved',()=>{
 for(const marker of ['&','@','#','$']){const p=O.parser.parse(marker+'お知らせ');assert.equal(p.warnings.length,1);assert.equal(p.nodes[0].value,marker+'お知らせ');}
 const p=O.parser.parse('&赤@交差&青@');assert.equal(p.nodes.map(n=>n.value).join(''),'&赤@交差&青@');assert.equal(p.warnings.length,1);
});
test('newlines round trip without double escaping, including CRLF and empty lines',()=>{
 const input='一行\r\n\r\n二行\\n三行';const normalized='一行\n\n二行\n三行';
 assert.equal(O.newlines.fromGame(input),normalized);
 assert.equal(O.newlines.toGame(input),'一行\\n\\n二行\\n三行');
 assert.equal(O.newlines.toGame(input,'actual'),normalized);
});
test('coordinate boundaries reject partial decimals, negatives, and triples',()=>{
 for(const text of ['-1,23','1,2,3','1.2,3','1,2.3','１２,３４','12，34'])assert.equal(O.parser.parse(text).nodes.filter(n=>n.type==='coordinate').length,0,text);
 assert.equal(O.parser.parse('よど城 422,1559／1209,578').nodes.filter(n=>n.type==='coordinate').length,2);
});
test('HTML and script-like input remains a text token',()=>{
 const html='<img src=x onerror=alert(1)><script>alert(2)</script>';
 assert.deepEqual(plain(O.parser.parse(html).nodes),[{type:'text',value:html}]);
});
test('drafts and templates have independent ten-item limits; no silent eviction',()=>{
 memory.clear();
 for(let i=0;i<10;i++)O.storage.save('drafts',{name:String(i),title:'題',body:'本文'});
 const before=memory.get(O.config.storage.draftsKey);
 assert.throws(()=>O.storage.save('drafts',{name:'11',title:'題',body:'本文'}),/10件/);
 assert.equal(memory.get(O.config.storage.draftsKey),before);
 O.storage.save('templates',{name:'個人用',title:'題',body:'本文'});assert.equal(O.storage.read('templates').length,1);
 const first=O.storage.read('drafts')[0];O.storage.save('drafts',{name:first.name,title:'改訂',body:'本文'},first.id);
 assert.equal(O.storage.read('drafts').length,10);assert.equal(O.storage.read('drafts')[0].title,'改訂');
 O.storage.remove('drafts',first.id);assert.equal(O.storage.read('drafts').length,9);
});
test('corrupt data and unknown schema are never silently overwritten',()=>{
 for(const raw of ['{bad',JSON.stringify({schemaVersion:2,items:[]})]){
  memory.set(O.config.storage.draftsKey,raw);
  assert.throws(()=>O.storage.save('drafts',{name:'新',title:'題',body:'本文'}));
  assert.equal(memory.get(O.config.storage.draftsKey),raw);
 }
 memory.clear();
});
test('storage denied / quota exceeded reports failure without claiming save success',()=>{
 const original=context.localStorage.setItem;context.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
 assert.throws(()=>O.storage.save('drafts',{name:'新',title:'題',body:'本文'}),/保存できません/);
 context.localStorage.setItem=original;
});
test('stamp IDs are unique and independent of artwork; common templates are empty',()=>{
 assert.equal(O.stamps.length,56);assert.equal(new Set(O.stamps.map(s=>s.id)).size,56);
 assert.ok([13,30,46].every(id=>O.stamps.some(s=>s.id===id)));
 assert.equal(O.commonTemplates.length,0);
});
