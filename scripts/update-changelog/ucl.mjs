import { preCommit } from './dist/update-changelog.cjs';

preCommit().catch((error) => {
  console.error(`❌ Unhandled error: ${error}`);
  process.exit(1);
});
