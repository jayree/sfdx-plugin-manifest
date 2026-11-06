import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import semver from 'semver';

const SDR_PACKAGE = '@salesforce/source-deploy-retrieve';

function getPreviousRelease(candidateVersion) {
  const tags = execFileSync('git', ['tag', '--merged', 'HEAD', '--list'], { encoding: 'utf-8' })
    .split('\n')
    .map((tag) => ({ tag, version: semver.valid(tag.replace(/^v/, '')) }))
    .filter(({ version }) => version && semver.lt(version, candidateVersion))
    .sort((left, right) => semver.rcompare(left.version, right.version));

  for (const { tag } of tags) {
    try {
      const release = JSON.parse(execFileSync('git', ['show', `${tag}:package.json`], { encoding: 'utf-8' }));
      if (semver.valid(release.version) && semver.valid(release.dependencies?.[SDR_PACKAGE])) return release;
    } catch (error) {
      console.warn(`Could not read package.json from release tag ${tag}: ${error.message}`);
    }
  }
}

function getSdrReleaseType(previousVersion, currentVersion) {
  if (!semver.gt(currentVersion, previousVersion)) return null;
  const previous = semver.parse(previousVersion);
  const current = semver.parse(currentVersion);
  if (current.major > previous.major) return 'major';
  if (current.minor > previous.minor) return 'minor';
  return 'patch';
}

// This hook runs before the Action writes package.json and generates its tag,
// changelog and outputs, so all of them use the same final version.
export function preVersionGeneration(candidateVersion) {
  if (!semver.valid(candidateVersion)) throw new Error(`Invalid candidate version: ${candidateVersion}`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const currentSdrVersion = packageJson.dependencies?.[SDR_PACKAGE];
  if (!semver.valid(currentSdrVersion)) throw new Error(`Invalid ${SDR_PACKAGE} version: ${currentSdrVersion}`);

  const previousRelease = getPreviousRelease(candidateVersion);
  if (!previousRelease) {
    console.warn('No previous package release found; keeping the Conventional Commits version.');
    return candidateVersion;
  }

  const previousSdrVersion = previousRelease.dependencies[SDR_PACKAGE];
  const releaseType = getSdrReleaseType(previousSdrVersion, currentSdrVersion);
  if (!releaseType) return candidateVersion;

  const requiredVersion = semver.inc(previousRelease.version, releaseType);
  if (!requiredVersion) throw new Error(`Could not calculate ${releaseType} release from ${previousRelease.version}`);
  const prerelease = semver.prerelease(candidateVersion);
  const adjustedVersion = `${requiredVersion}${prerelease ? `-${prerelease.join('.')}` : ''}`;
  if (semver.gte(candidateVersion, adjustedVersion)) return candidateVersion;

  console.log(
    `SDR changed from ${previousSdrVersion} to ${currentSdrVersion} (${releaseType}); release version raised to ${adjustedVersion}`,
  );
  return adjustedVersion;
}
