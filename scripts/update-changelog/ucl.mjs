import { preCommit } from './update-changelog.mjs';

preCommit().catch((error) => {
  console.error(`❌ Unhandled error: ${error}`);
  process.exit(1);
});
