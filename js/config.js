'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.config = Object.freeze({
  version: '0.3.0',
  defaultNewlineMode: 'escaped',
  limits: { title: 10, body: 1000 },
  preview: {
    defaultProfile: 'pc',
    fontSize: 20, lineHeight: 1.5,
    profiles: {
      pc: { label: 'PC', sheetWidth: 420, bodyWidth: 360, charsPerLine: '約18' },
      portrait: { label: 'スマホ縦', sheetWidth: 420, bodyWidth: 360, charsPerLine: '約18' },
      landscape: { label: 'スマホ横', sheetWidth: 440, bodyWidth: 380, charsPerLine: '約19' }
    }
  },
  storage: { draftsKey: 'ofuregaki.v1.drafts', templatesKey: 'ofuregaki.v1.templates', limit: 10 }
});
