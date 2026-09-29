export default {
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'], hmr: false },
  plugins: [{name:'static-preview',transformIndexHtml:{order:'post',handler:html=>html.replace(/<script type="module" src="\/@vite\/client"><\/script>/,'')}}]
};
