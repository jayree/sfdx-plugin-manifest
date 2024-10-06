#!/usr/bin/env node
// eslint-disable-next-line node/shebang
(async () => {
  const oclif = await import('@oclif/core');
  oclif.settings.performanceEnabled = true;
  await oclif.execute({ type: 'esm', dir: import.meta.url });
  console.log(oclif.Performance.results);
})();
