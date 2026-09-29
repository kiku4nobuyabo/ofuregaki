'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.storage = (() => {
  const config = Ofuregaki.config.storage;
  const keyFor = kind => {
    if (kind === 'drafts') return config.draftsKey;
    if (kind === 'templates') return config.templatesKey;
    throw new Error('保存先が正しくありません。');
  };
  function read(kind) {
    let raw;
    try { raw = localStorage.getItem(keyFor(kind)); }
    catch { throw new Error('このブラウザでは保存データを読み込めません。ブラウザの保存設定を確認してください。'); }
    if (raw === null) return [];
    let data;
    try { data=JSON.parse(raw); } catch { throw new Error('保存データを読み込めません。既存データの保護のため、上書き・削除を停止しています。'); }
    const valid = data && data.schemaVersion === 1 && Array.isArray(data.items) && data.items.every(item =>
      item && ['id','name','title','body','savedAt'].every(field => typeof item[field] === 'string') && !Number.isNaN(Date.parse(item.savedAt))) &&
      new Set(data.items.map(item => item.id)).size === data.items.length;
    if (!valid) throw new Error('保存データの形式が異なるため読み込めません。既存データを保護するため、上書き・削除を停止しています。');
    return data.items;
  }
  function write(kind,items) {
    try { localStorage.setItem(keyFor(kind),JSON.stringify({schemaVersion:1,items})); }
    catch { throw new Error('保存できませんでした。ブラウザの保存容量や設定を確認してください。原稿は編集欄に残っています。'); }
  }
  function save(kind,values,id=null) {
    const items=read(kind);
    const index=id === null ? -1 : items.findIndex(item=>item.id===id);
    if (id !== null && index < 0) throw new Error('保存先が別のタブで削除された可能性があります。別の保存名で保存し直してください。');
    if (index < 0 && items.length >= config.limit) throw new Error('保存できるのは10件までです。既存の下書き・マイテンプレから、この保存先の不要なものを削除してください。');
    const record={id:id || (globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`),name:values.name,title:values.title,body:values.body,savedAt:new Date().toISOString()};
    if(index<0) items.unshift(record); else items[index]=record;
    write(kind,items); return record;
  }
  function remove(kind,id) { const items=read(kind);write(kind,items.filter(item=>item.id!==id)); }
  return {read,save,remove};
})();
