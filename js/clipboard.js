'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.clipboard = {
  async copy(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text);return true; } catch { /* Try the offline fallback. */ }
    }
    const active=document.activeElement;
    const selection=active && 'selectionStart' in active ? [active.selectionStart,active.selectionEnd] : null;
    const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');
    field.style.position='fixed';field.style.left='-9999px';field.style.top='0';document.body.append(field);field.select();
    let success=false;
    try { success=document.execCommand('copy'); } catch { /* Manual copy UI is handled by app.js. */ }
    field.remove();active?.focus({preventScroll:true});
    if(selection) active.setSelectionRange(...selection);
    return success;
  }
};
