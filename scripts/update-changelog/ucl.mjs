import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const { updateChangelog } = require('./dist/release-changelog.cjs');
const { values } = parseArgs({ options: { all: { type: 'boolean', default: false } } });

updateChangelog({ all: values.all }).catch((error) => {
  console.error(`❌ Unhandled error: ${error}`);
  process.exit(1);
});
