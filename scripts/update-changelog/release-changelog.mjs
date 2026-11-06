import fs from 'node:fs';
import semver from 'semver';
import { updateChangelog } from './update-changelog.mjs';

export { updateChangelog };

export async function preCommit({ version }) {
  if (!semver.valid(version)) throw new Error(`Invalid release version: ${version}`);
  // The workflow does not generate a changelog file for prereleases. Leave the
  // previous stable release's notes untouched in that case.
  if (semver.prerelease(version)) return;

  const content = fs.readFileSync('CHANGELOG.md', 'utf-8');
  const heading = content.match(/^#{1,3} \[?(\d+\.\d+\.\d+(?:-[\w.-]+)?)/m);
  if (heading?.[1] !== version) throw new Error(`CHANGELOG.md does not start with release ${version}`);

  await updateChangelog();
}
