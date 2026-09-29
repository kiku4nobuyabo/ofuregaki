'use strict';
(() => {
  const O=Ofuregaki;
  const $=id=>document.getElementById(id);
  const title=$('title-input'), body=$('body-input');
  const mode=$('newline-mode');
  mode.value=O.config.defaultNewlineMode;
  const previewStyle=document.documentElement.style;
  previewStyle.setProperty('--preview-font-size',`${O.config.preview.fontSize}px`);
  previewStyle.setProperty('--preview-line-height',O.config.preview.lineHeight);
  let currentKind='drafts', linkedRecord=null;
  let savedSnapshot=JSON.stringify({title:'',body:''});
  let selectedRange={start:0,end:0};
  let toastTimer;
  let confirming=false;
  function values(){return {title:title.value,body:body.value};}
  function isDirty(){return JSON.stringify(values()) !== savedSnapshot;}
  function rememberSelection(){selectedRange={start:body.selectionStart,end:body.selectionEnd};}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
  function showStorageError(message){$('storage-error').textContent=message;$('storage-error').hidden=!message;}
  function fitPreview(){
    const stage=$('preview-stage'), sheet=$('game-sheet');
    const width=O.config.preview.sheetWidth;
    const scale=Math.min(1,(stage.clientWidth-24)/width);
    sheet.style.transform=`scale(${scale})`;
    // Compensate transformed visual height so mobile does not acquire a large blank gap.
    sheet.style.marginBottom=`${sheet.offsetHeight*(scale-1)}px`;
  }
  function refresh(){
    const parsed=O.parser.parse(body.value);
    $('preview-title').textContent=title.value || '御触書のタイトル';
    const target=$('preview-body');
    target.classList.toggle('empty',!body.value);
    if(body.value) O.renderer.render(target,parsed.nodes);
    else target.textContent='本文を入力すると、\nここに仕上がりが表示されます。';
    const warningBox=$('warnings');warningBox.replaceChildren();
    for(const message of parsed.warnings){const p=document.createElement('p');p.textContent=message;warningBox.append(p);}
    warningBox.hidden=!parsed.warnings.length;
    const ids=[...body.value.matchAll(/\{(\d+)\}/g)].map(match=>match[1]);
    const unknown=[...new Set(ids.filter(id=>!O.stamps.some(stamp=>String(stamp.id)===id)))];
    if(unknown.length){const p=document.createElement('p');p.textContent=`未登録のスタンプ ${unknown.map(id=>`{${id}}`).join('、')} はIDで表示します。コピーする文字列は変えません。`;warningBox.append(p);warningBox.hidden=false;}
    $('character-count').textContent=`${Array.from(body.value).length}文字（記号を含む）`;
    $('copy-output').value=O.newlines.toGame(body.value,mode.value);
    $('edit-state').textContent=isDirty() ? '未保存の変更あり' : (body.value || title.value ? '保存済み' : '未保存');
    requestAnimationFrame(fitPreview);
  }
  function normalizeBody(){
    const before=body.value;
    const normalized=O.newlines.fromGame(before);
    if(before!==normalized){
      const start=O.newlines.fromGame(before.slice(0,body.selectionStart)).length;
      const end=O.newlines.fromGame(before.slice(0,body.selectionEnd)).length;
      body.value=normalized;body.setSelectionRange(start,end);
    }
    rememberSelection();refresh();
  }
  body.addEventListener('input',event=>{if(!event.isComposing) normalizeBody();});
  body.addEventListener('compositionend',normalizeBody);
  title.addEventListener('input',refresh);
  mode.addEventListener('change',refresh);
  for(const event of ['select','keyup','click','pointerup','blur']) body.addEventListener(event,rememberSelection);
  document.addEventListener('selectionchange',()=>{if(document.activeElement===body) rememberSelection();});
  function replaceSelection(text,selectionInside=null){
    const start=Math.min(selectedRange.start,body.value.length),end=Math.min(selectedRange.end,body.value.length);
    // execCommand preserves native undo history in browsers which support it. setRangeText is the fallback.
    body.focus({preventScroll:true});body.setSelectionRange(start,end);
    let inserted=false;
    try {inserted=document.execCommand('insertText',false,text);} catch { /* use the range API */ }
    if(!inserted) body.setRangeText(text,start,end,'end');
    if(selectionInside) body.setSelectionRange(start+selectionInside[0],start+selectionInside[1]);
    rememberSelection();refresh();
  }
  for(const button of document.querySelectorAll('[data-color]')){
    button.addEventListener('mousedown',event=>event.preventDefault());
    button.addEventListener('click',()=>{
      const marker=button.dataset.color;
      const start=selectedRange.start,end=selectedRange.end;
      let selected=body.value.slice(start,end);
      // Recolor one whole wrapped span, or a span selected just inside its markers.
      if(selected.length>=2 && O.parser.colors[selected[0]] && selected.at(-1)===selected[0]) selected=selected.slice(1,-1);
      else if(start>0 && O.parser.colors[body.value[start-1]] && body.value[end]===body.value[start-1]) selectedRange={start:start-1,end:end+1};
      replaceSelection(`${marker}${selected}${marker}`,[1,1+selected.length]);
      if(!selected) toast('記号の間に、色をつけたい文字を入力してください。');
    });
  }
  function openDialog(id){$(id).showModal();}
  for(const button of document.querySelectorAll('[data-close]')) button.addEventListener('click',()=>button.closest('dialog').close());
  $('help-open').addEventListener('click',()=>openDialog('help-dialog'));
  $('coordinate-open').addEventListener('click',()=>openDialog('coordinate-dialog'));
  $('coordinate-form').addEventListener('submit',event=>{
    event.preventDefault();
    const x=$('coordinate-x').value.trim(),y=$('coordinate-y').value.trim();
    if(!/^\d+$/.test(x)||!/^\d+$/.test(y)) return;
    const name=$('coordinate-name').value.trim();
    $('coordinate-dialog').close();
    replaceSelection(`${name ? name+' ' : ''}${x},${y}`);
    $('coordinate-form').reset();
  });
  for(const def of O.stamps){
    const button=document.createElement('button');button.type='button';button.className='stamp-option';
    button.setAttribute('aria-label',`${def.label}、ID ${def.id}`);button.dataset.id=def.id;
    button.append(O.renderer.stampElement(def.id));
    const label=document.createElement('small');label.textContent=`{${def.id}}`;button.append(label);
    button.addEventListener('click',()=>{$('stamp-dialog').close();replaceSelection(`{${def.id}}`);});
    $('stamp-palette').append(button);
  }
  $('stamp-open').addEventListener('click',()=>openDialog('stamp-dialog'));
  async function copy(part){
    const text=part==='title' ? title.value : O.newlines.toGame(body.value,mode.value);
    if(!text){toast(`${part==='title'?'タイトル':'本文'}を入力してください。`);return;}
    const ok=await O.clipboard.copy(text);
    if(ok) toast(`${part==='title'?'タイトル':'ゲーム貼付用の本文'}をコピーしました。`);
    else {$('manual-copy-text').value=text;openDialog('manual-copy-dialog');$('manual-copy-text').focus();$('manual-copy-text').select();}
  }
  $('copy-body').addEventListener('click',()=>copy('body'));
  $('copy-title').addEventListener('click',()=>copy('title'));
  function confirmAction(message,label){
    if(confirming) return Promise.resolve(false);
    confirming=true;
    return new Promise(resolve=>{
      $('confirm-message').textContent=message;$('confirm-ok').textContent=label;
      const dialog=$('confirm-dialog');dialog.returnValue='cancel';
      const close=()=>{confirming=false;resolve(dialog.returnValue==='ok');};
      dialog.addEventListener('close',close,{once:true});dialog.showModal();$('confirm-cancel').focus();
    });
  }
  $('confirm-ok').addEventListener('click',()=>$('confirm-dialog').close('ok'));
  $('confirm-cancel').addEventListener('click',()=>$('confirm-dialog').close('cancel'));
  function listRecords(kind){return kind==='common' ? O.commonTemplates : O.storage.read(kind);}
  async function loadRecord(record,kind){
    if((title.value || body.value) && !(await confirmAction('現在の編集内容を、この原稿に置き換えます。残したい内容は先に保存してください。','読み込む')))return;
    title.value=record.title;body.value=O.newlines.fromGame(record.body);
    linkedRecord=kind==='common'?null:{kind,id:record.id,name:record.name};
    $('save-name').value=record.name;
    // Common templates have no personal saved copy; warn on leaving until explicitly saved.
    savedSnapshot=kind==='common'?JSON.stringify({title:'',body:''}):JSON.stringify(values());
    selectedRange={start:body.value.length,end:body.value.length};refresh();toast('編集欄へ読み込みました。');
  }
  function renderSaved(){
    showStorageError('');
    for(const [kind,id] of [['drafts','draft-count'],['templates','template-count']]){
      try {$(id).textContent=`${O.storage.read(kind).length}/10`;}catch(error){$(id).textContent='読込不可';showStorageError(error.message);}
    }
    const isCommon=currentKind==='common';$('save-form').hidden=isCommon;
    $('save-button').textContent=currentKind==='templates'?'マイテンプレを保存':'下書きを保存';
    $('save-name').placeholder=currentKind==='templates'?'テンプレートの名前':'保存名（例：10/10 開幕のお知らせ）';
    const target=$('saved-list');target.replaceChildren();
    let records;
    try{records=listRecords(currentKind);}catch(error){showStorageError(error.message);return;}
    if(!records.length){const p=document.createElement('p');p.className='empty-list';p.textContent=isCommon?'現在、共通テンプレートは登録されていません。':currentKind==='drafts'?'保存した下書きがここに並びます。':'よく使う原稿を、自分用のひな型として保存できます。';target.append(p);}
    for(const record of records){
      const kind=currentKind;
      const row=document.createElement('div');row.className='saved-item';
      const info=document.createElement('div');info.className='saved-info';
      const name=document.createElement('strong');name.textContent=record.name;
      const date=document.createElement('small');date.textContent=isCommon?'一門共通テンプレート':new Date(record.savedAt).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      info.append(name,date);row.append(info);
      const actions=document.createElement('div');actions.className='saved-actions';
      const load=document.createElement('button');load.type='button';load.textContent='読込';load.setAttribute('aria-label',`${record.name}を読み込む`);load.addEventListener('click',()=>loadRecord(record,kind));actions.append(load);
      if(!isCommon){
        const remove=document.createElement('button');remove.type='button';remove.className='delete';remove.textContent='削除';remove.setAttribute('aria-label',`${record.name}を削除`);
        remove.addEventListener('click',async()=>{
          if(!(await confirmAction(`「${record.name}」を削除します。この操作は元に戻せません。`,'削除する')))return;
          try{O.storage.remove(kind,record.id);if(linkedRecord?.id===record.id && linkedRecord.kind===kind){linkedRecord=null;savedSnapshot=JSON.stringify({title:'',body:''});refresh();}renderSaved();toast('削除しました。');}catch(error){showStorageError(error.message);}
        });actions.append(remove);
      }
      row.append(actions);target.append(row);
    }
  }
  const tabs=[...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab){currentKind=tab.dataset.kind;for(const item of tabs){item.setAttribute('aria-selected',String(item===tab));item.tabIndex=item===tab?0:-1;}$('saved-panel').setAttribute('aria-labelledby',tab.id);renderSaved();}
  for(const tab of tabs){
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
      let index=tabs.indexOf(tab);
      index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      selectTab(tabs[index]);tabs[index].focus();
    });
  }
  $('save-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const kind=currentKind, snapshot=values();
    const name=$('save-name').value.trim();
    if(!name){toast('保存名を入力してください。');$('save-name').focus();return;}
    if(!snapshot.title && !snapshot.body){toast('タイトルか本文を入力してください。');return;}
    const existing=linkedRecord?.kind===kind && linkedRecord.name===name ? linkedRecord : null;
    if(existing && !(await confirmAction(`「${name}」を現在の原稿で上書きします。別の原稿として残す場合は、保存名を変更してください。`,'上書き保存')))return;
    try{
      const record=O.storage.save(kind,{name,...snapshot},existing?.id || null);
      linkedRecord={kind,id:record.id,name};savedSnapshot=JSON.stringify(snapshot);
      renderSaved();refresh();toast(kind==='templates'?'マイテンプレを保存しました。':'下書きを保存しました。');
    }catch(error){showStorageError(error.message);toast(error.message);}
  });
  $('new-document').addEventListener('click',async()=>{
    if((title.value || body.value) && !(await confirmAction('現在の編集内容を消して、新しい御触書を書きます。残したい内容は先に保存してください。','新しく書く')))return;
    title.value='';body.value='';$('save-name').value='';linkedRecord=null;savedSnapshot=JSON.stringify(values());selectedRange={start:0,end:0};refresh();title.focus();
  });
  window.addEventListener('beforeunload',event=>{if(isDirty()){event.preventDefault();event.returnValue='';}});
  window.addEventListener('storage',event=>{if([O.config.storage.draftsKey,O.config.storage.templatesKey].includes(event.key)) renderSaved();});
  if('ResizeObserver' in window) new ResizeObserver(fitPreview).observe($('preview-stage'));
  window.addEventListener('resize',fitPreview);
  refresh();renderSaved();
})();
