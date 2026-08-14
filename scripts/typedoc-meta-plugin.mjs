export function load(app) {
  app.renderer.hooks.on('head.begin', (context) => {
    if (context.page.url === 'index.html') {
      return {
        tag: 'meta',
        props: {
          name: 'google-site-verification',
          content: 'YDIb4k0qK76bI3zwSgER3FDfb6njI3QwvpJVfjey1PA',
        },
        children: [],
      };
    }
    return '';
  });
}
