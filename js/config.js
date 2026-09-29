'use strict';
window.Ofuregaki = window.Ofuregaki || {};
Ofuregaki.config = Object.freeze({
  version: '0.1.0',
  defaultNewlineMode: 'escaped',
  // Video: about 18 full-width characters per line; narrow screens scale the whole sheet.
  preview: { sheetWidth: 420, fontSize: 20, lineHeight: 1.5 },
  storage: { draftsKey: 'ofuregaki.v1.drafts', templatesKey: 'ofuregaki.v1.templates', limit: 10 }
});
