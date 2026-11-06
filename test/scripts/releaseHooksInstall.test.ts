/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'mocha';

describe('release-hook install configuration', () => {
  it('preserves the release-hook tests when sf-install standardizes package.json repeatedly', () => {
    const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
    const require = createRequire(import.meta.url);
    const standardizePath = join(
      dirname(require.resolve('@salesforce/dev-scripts/package.json')),
      'utils',
      'standardize-pjson.js',
    );
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'manifest-install-test-'));

    try {
      for (const file of ['package.json', '.sfdevrc.json', 'tsconfig.json']) {
        copyFileSync(join(repoRoot, file), join(fixtureRoot, file));
      }
      mkdirSync(join(fixtureRoot, 'bin'));
      copyFileSync(join(repoRoot, 'bin', 'dev.js'), join(fixtureRoot, 'bin', 'dev.js'));
      const packagePath = join(fixtureRoot, 'package.json');
      const before = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(before) as { wireit: { test: { dependencies: string[] } } };
      assert.ok(packageJson.wireit.test.dependencies.includes('test:release-hooks'));

      for (let run = 0; run < 2; run++) {
        const result = spawnSync(
          process.execPath,
          ['--eval', `require(${JSON.stringify(standardizePath)})(${JSON.stringify(fixtureRoot)});`],
          { cwd: fixtureRoot, encoding: 'utf-8', timeout: 5000 },
        );
        assert.equal(result.status, 0, result.stderr || result.stdout);
        assert.equal(readFileSync(packagePath, 'utf-8'), before);
      }
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
