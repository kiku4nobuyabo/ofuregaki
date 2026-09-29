'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.discord = (() => {
  function fromSource(source) {
    const parsed=Ofuregaki.parser.parse(source);
    function nodeText(node) {
      if(node.type==='color') return node.children.map(nodeText).join('');
      if(node.type==='stamp') {
        const stamp=Ofuregaki.stamps.find(def=>String(def.id)===String(node.id));
        return stamp ? stamp.fallbackEmoji : node.value;
      }
      return node.value || '';
    }
    return parsed.nodes.map(nodeText).join('');
  }
  return {fromSource};
})();
