'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.newlines = Object.freeze({
  // Normalize a working copy for rendering/export. Never rewrite authored editor or saved text.
  fromGame(text) { return String(text).replace(/\r\n?/g, '\n').replace(/\\n/g, '\n'); },
  toGame(text, mode = 'escaped') {
    const normalized = this.fromGame(text);
    return mode === 'actual' ? normalized : normalized.replace(/\n/g, '\\n');
  }
});
