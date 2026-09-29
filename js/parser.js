'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.parser = (() => {
  const colors = { '&': ['red', '赤'], '@': ['blue', '青'], '#': ['orange', '橙'], '$': ['green', '緑'] };
  function parse(source) {
    const text = Ofuregaki.newlines.fromGame(source);
    const warnings = [];
    const pairs = new Map();
    for (const [marker, [, name]] of Object.entries(colors)) {
      const positions = [];
      for (let i = 0; i < text.length; i++) if (text[i] === marker) positions.push(i);
      for (let i = 0; i + 1 < positions.length; i += 2) pairs.set(positions[i], positions[i + 1]);
      if (positions.length % 2) warnings.push(`${name}色の指定が閉じられていません（${marker}）。通常の記号として使っている場合は、そのままで構いません。`);
    }
    const spans = [...pairs].sort((a,b) => a[0]-b[0]);
    const invalid = new Set();
    // Overlapping/nested syntax has no verified game rule. Preserve it literally rather than invent precedence.
    for (let a=0;a<spans.length;a++) for (let b=a+1;b<spans.length && spans[b][0]<spans[a][1];b++) {
      invalid.add(spans[a][0]); invalid.add(spans[b][0]);
    }
    if (invalid.size) warnings.push('色指定が重なっています。実機の挙動が未確認のため、重なった部分は記号を含めて表示しています。色指定を重ねずに使ってください。');
    for (const start of invalid) pairs.delete(start);
    function atoms(value) {
      const nodes = [];
      // Do not accept partial coordinates inside decimals, negatives, or triples.
      const pattern = /\{(\d+)\}|(?<![\d,，.\-−])\d+,\d+(?![\d,，.])/gu;
      let last = 0;
      for (const match of value.matchAll(pattern)) {
        if (match.index > last) nodes.push({type:'text',value:value.slice(last,match.index)});
        nodes.push(match[1] !== undefined ? {type:'stamp',id:match[1],value:match[0]} : {type:'coordinate',value:match[0]});
        last = match.index + match[0].length;
      }
      if (last < value.length) nodes.push({type:'text',value:value.slice(last)});
      return nodes;
    }
    const nodes = [];
    let cursor = 0;
    for (const [start,end] of [...pairs].sort((a,b)=>a[0]-b[0])) {
      if (start < cursor) continue;
      nodes.push(...atoms(text.slice(cursor,start)));
      nodes.push({type:'color',color:colors[text[start]][0],children:atoms(text.slice(start+1,end))});
      cursor = end+1;
    }
    nodes.push(...atoms(text.slice(cursor)));
    return {nodes,warnings};
  }
  return {parse, colors};
})();
