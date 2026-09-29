'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.renderer = (() => {
  // All user text is inserted through textContent/createTextNode, never interpreted as HTML.
  function stampElement(id) {
    const def = Ofuregaki.stamps.find(item => String(item.id) === String(id));
    const el = document.createElement('span'); el.className = 'game-stamp';
    if (!def) { el.classList.add('stamp-unknown'); el.textContent = `{${id}}`; el.title = `未登録のスタンプ ID ${id}`; return el; }
    el.title = `${def.label}（ID ${def.id}）`;
    const fallback = () => { el.replaceChildren(document.createTextNode(def.fallbackEmoji || '◉')); };
    fallback();
    // Only app-local image paths; external URLs are not requested.
    if (def.imagePath && /^assets\/stamps\/[\w\-/]+\.(png|webp|gif|jpe?g)$/i.test(def.imagePath)) {
      const img = document.createElement('img'); img.alt = def.label;
      img.addEventListener('error', fallback, {once:true});
      img.src = def.imagePath; el.replaceChildren(img);
    }
    return el;
  }
  function fragment(nodes) {
    const result = document.createDocumentFragment();
    for (const node of nodes) {
      if (node.type === 'text') result.append(document.createTextNode(node.value));
      if (node.type === 'stamp') result.append(stampElement(node.id));
      if (node.type === 'coordinate') {
        const span=document.createElement('span'); span.className='game-coordinate'; span.textContent=`📍(${node.value})`; span.title=`座標 ${node.value}`; result.append(span);
      }
      if (node.type === 'color') {
        const span=document.createElement('span'); span.className=`syntax-${node.color}`; span.append(fragment(node.children)); result.append(span);
      }
    }
    return result;
  }
  return {stampElement, render(target,nodes) { target.replaceChildren(fragment(nodes)); }};
})();
