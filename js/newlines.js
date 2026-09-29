'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.newlines = Object.freeze({
  // Keep the editor/storage representation as actual LF. Accept game-formatted pastes.
  fromGame(text) { return String(text).replace(/\r\n?/g, '\n').replace(/\\n/g, '\n'); },
  toGame(text, mode = 'escaped') {
    const normalized = this.fromGame(text);
    return mode === 'actual' ? normalized : normalized.replace(/\n/g, '\\n');
  }
});
