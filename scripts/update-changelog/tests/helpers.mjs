import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const repoRoot = resolve(scriptDir, '../..');
export const versionBundle = join(scriptDir, 'dist/release-version.cjs');
export const changelogBundle = join(scriptDir, 'dist/release-changelog.cjs');
export const sdrPackage = '@salesforce/source-deploy-retrieve';

export function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'manifest-release-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

export function writePackage(dir, version, sdrVersion) {
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify({ version, dependencies: { [sdrPackage]: sdrVersion } }, null, 2)}\n`,
  );
}

export function git(dir, ...args) {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=Release test',
      '-c',
      'user.email=release@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'tag.gpgsign=false',
      '-c',
      `core.hooksPath=${join(dir, 'no-hooks')}`,
      ...args,
    ],
    { cwd: dir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

export function releaseRepo(t, version = '6.0.91', sdrVersion = '13.10.0', tag = version) {
  const dir = fixture(t);
  git(dir, 'init', '-q');
  writePackage(dir, version, sdrVersion);
  git(dir, 'add', 'package.json');
  git(dir, 'commit', '-qm', 'Previous release');
  if (tag) git(dir, 'tag', tag);
  return dir;
}

export function runNode(dir, code) {
  const result = spawnSync(process.execPath, ['--input-type=commonjs', '--eval', code], {
    cwd: dir,
    encoding: 'utf-8',
    timeout: 15000,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
  return JSON.parse(
    result.stdout
      .split('\n')
      .find((line) => line.startsWith('RESULT='))
      .slice(7),
  );
}

// Mock both services before loading the bundled clients. Unexpected requests
// fail without reaching the network, and are recorded for assertions.
export const mockFetch = `
const calls = [];
globalThis.fetch = async (input) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  calls.push(url.href);
  let data;
  if (url.hostname === 'api.github.com' && url.pathname === '/rate_limit') {
    data = { rate: { limit: 5000, remaining: 4999, reset: 0 } };
  } else if (url.pathname === '/review-dep') {
    data = { 'dist-tags': { latest: '2.0.0' }, versions: { '2.0.0': { repository: { url: 'https://github.com/review/dependency' } } } };
  } else if (url.pathname === '/repos/review/dependency/tags') {
    data = [{ name: 'v2.0.0' }, { name: 'v1.0.0' }];
  } else if (url.pathname === '/repos/review/dependency/releases/tags/v2.0.0') {
    data = { body: '### Features\\n\\n* Upstream feature from fixture' };
  } else {
    throw new Error('Unexpected request: ' + url.href);
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
};
`;

export const changelog = (version = '6.1.0') =>
  `## [${version}](https://example.invalid/compare/6.0.91...${version}) (2026-11-06)\n\n` +
  '* **deps:** bump review-dep from 1.0.0 to 2.0.0\n\n' +
  '## [6.0.91](https://example.invalid/compare/6.0.90...6.0.91) (2026-11-05)\n\n' +
  '* **deps:** bump review-dep from 1.0.0 to 2.0.0\n';
