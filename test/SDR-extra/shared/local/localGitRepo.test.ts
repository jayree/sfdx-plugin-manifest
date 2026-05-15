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
import fs, { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import git, { StatusRow } from 'isomorphic-git';
import { describe, it } from 'mocha';
import { GitRepo } from '../../../../src/SDR-extra/shared/local/localGitRepo.js';

const rows: StatusRow[] = [
  ['force-app/main/default/classes/Added.cls', 0, 2, 0],
  ['force-app/main/default/classes/Modified.cls', 1, 2, 1],
  ['force-app/main/default/classes/Deleted.cls', 1, 0, 1],
  ['force-app/main/default/classes/Unchanged.cls', 1, 1, 1],
];

const writeApexClass = async (filepath: string, body: string): Promise<void> => {
  await mkdir(join(filepath, '..'), { recursive: true });
  await writeFile(filepath, body);
};

const initGitRepo = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-local-repo-'));
  await git.init({ fs, dir });
  return dir;
};

const commitFile = async (dir: string, filepath: string, body: string, message: string): Promise<string> => {
  await writeApexClass(join(dir, filepath), body);
  await git.add({ fs, dir, filepath });
  return git.commit({
    fs,
    dir,
    author: { name: 'Unit Test', email: 'unit@example.com' },
    message,
  });
};

describe('GitRepo', () => {
  it('reuses one instance per directory', () => {
    const dir = join(tmpdir(), 'sfdx-plugin-manifest-local-repo-instance');

    assert.equal(GitRepo.getInstance({ dir }), GitRepo.getInstance({ dir }));
  });

  it('returns an empty ref for undefined single refs', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-empty-ref') });

    assert.equal(await repo.resolveSingleRefString(undefined), '');
  });

  it('hashes blob content', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-hash') });

    assert.equal(await repo.hashBlob(Buffer.from('hello')), 'b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0');
  });

  it('classifies added, modified, and deleted status rows', () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-status') });
    Object.assign(repo, { status: rows });

    assert.deepEqual(repo.getAdds(), [rows[0]]);
    assert.deepEqual(repo.getAddFilenames(), ['force-app/main/default/classes/Added.cls']);
    assert.deepEqual(repo.getModifies(), [rows[1]]);
    assert.deepEqual(repo.getModifyFilenames(), ['force-app/main/default/classes/Modified.cls']);
    assert.deepEqual(repo.getDeletes(), [rows[2]]);
    assert.deepEqual(repo.getDeleteFilenames(), ['force-app/main/default/classes/Deleted.cls']);
  });

  it('lists and reads working tree files when no git ref is provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-local-repo-'));
    const filepath = join(dir, 'metadata.txt');
    await writeFile(filepath, 'metadata');
    const repo = GitRepo.getInstance({ dir });

    assert.deepEqual(await repo.listFiles(''), [filepath]);
    assert.deepEqual(await repo.readBlob(filepath), await readFile(filepath));
  });

  it('throws on ambiguous multi-ref strings', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-ambiguous') });

    await assert.rejects(
      async () => repo.resolveMultiRefString('main..HEAD..extra'),
      /Ambiguous arguments: main\.\.HEAD\.\.extra/,
    );
  });

  it('emits warnings for status rows that need user attention', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-warnings') });
    const warnings: string[] = [];
    Object.assign(repo, {
      status: [
        ['force-app/main/default/classes/Staged.cls', 0, 2, 3],
        ['force-app/main/default/classes/Untracked.cls', 0, 2, 0],
      ] satisfies StatusRow[],
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    await repo.emitStatusWarnings();

    assert.deepEqual(warnings, [
      'The staged file with unstaged changes force-app/main/default/classes/Staged.cls was processed.',
      'The untracked file force-app/main/default/classes/Untracked.cls was processed.',
    ]);
  });

  it('returns without warnings when no status rows need user attention', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-no-warnings') });
    const warnings: string[] = [];
    Object.assign(repo, {
      status: [['force-app/main/default/classes/Unchanged.cls', 1, 1, 1]] satisfies StatusRow[],
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    await repo.emitStatusWarnings();

    assert.deepEqual(warnings, []);
  });

  it('emits ignored and unstaged status warnings', async () => {
    const repo = GitRepo.getInstance({ dir: join(tmpdir(), 'sfdx-plugin-manifest-local-repo-more-warnings') });
    const warnings: string[] = [];
    Object.assign(repo, {
      status: [
        ['force-app/main/default/classes/StagedIgnored.cls', 1, 1, 3],
        ['force-app/main/default/classes/Unstaged.cls', 1, 0, 1],
      ] satisfies StatusRow[],
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    await repo.emitStatusWarnings();

    assert.deepEqual(warnings, [
      'The staged file with unstaged changes force-app/main/default/classes/StagedIgnored.cls was ignored.',
      'The unstaged file force-app/main/default/classes/Unstaged.cls was processed.',
    ]);
  });

  it('resolves refs with parent operators from commit history', async () => {
    const dir = await initGitRepo();
    const firstCommit = await commitFile(
      dir,
      'force-app/main/default/classes/First.cls',
      'public class First {}',
      'first commit',
    );
    const secondCommit = await commitFile(
      dir,
      'force-app/main/default/classes/Second.cls',
      'public class Second {}',
      'second commit',
    );
    const repo = GitRepo.getInstance({ dir });

    assert.equal(await repo.resolveSingleRefString('HEAD'), secondCommit);
    assert.equal(await repo.resolveSingleRefString('HEAD~1'), firstCommit);
    assert.equal(await repo.resolveSingleRefString('HEAD^'), firstCommit);
  });

  it('resolves refs with explicit parent and ancestor counts', async () => {
    const dir = await initGitRepo();
    const firstCommit = await commitFile(
      dir,
      'force-app/main/default/classes/First.cls',
      'public class First {}',
      'first commit',
    );
    await commitFile(dir, 'force-app/main/default/classes/Second.cls', 'public class Second {}', 'second commit');
    await commitFile(dir, 'force-app/main/default/classes/Third.cls', 'public class Third {}', 'third commit');
    const repo = GitRepo.getInstance({ dir });

    assert.equal(await repo.resolveSingleRefString('HEAD~2'), firstCommit);
    await assert.rejects(
      async () => repo.resolveSingleRefString('HEAD^2'),
      /ambiguous argument 'HEAD\^2': unknown revision or path not in the working tree\./,
    );
  });

  it('throws a helpful error when a ref cannot be resolved', async () => {
    const dir = await initGitRepo();
    const repo = GitRepo.getInstance({ dir });

    await assert.rejects(
      async () => repo.resolveSingleRefString('missing-ref'),
      /ambiguous argument 'missing-ref': unknown revision or path not in the working tree\./,
    );
  });

  it('filters getStatus results to package source files', async () => {
    const dir = await initGitRepo();
    await commitFile(dir, 'force-app/main/default/classes/Tracked.cls', 'public class Tracked {}', 'initial commit');
    await writeApexClass(
      join(dir, 'force-app', 'main', 'default', 'classes', 'Tracked.cls'),
      'public class Tracked2 {}',
    );
    await writeFile(join(dir, 'force-app', '.hidden'), 'hidden');
    await mkdir(join(dir, 'force-app', 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(dir, 'force-app', 'node_modules', 'pkg', 'ignored.js'), 'ignored');
    await mkdir(join(dir, 'force-app', 'main', 'default', 'lwc', 'cmp', '__tests__'), { recursive: true });
    await writeFile(join(dir, 'force-app', 'main', 'default', 'lwc', 'cmp', '__tests__', 'cmp.test.js'), 'ignored');
    await writeFile(join(dir, 'force-app', '.gitignore'), 'ignored');
    await writeFile(join(dir, 'outside.txt'), 'outside');
    const repo = GitRepo.getInstance({
      dir,
      packageDirs: [{ name: 'force-app', path: 'force-app', fullPath: join(dir, 'force-app') }],
    });

    const status = await repo.getStatus('HEAD');

    assert.deepEqual(status, [[join(dir, 'force-app', 'main', 'default', 'classes', 'Tracked.cls'), 1, 2, 1]]);
  });

  it('removes files detected as moved and emits the move warning', async () => {
    const dir = await initGitRepo();
    const oldPath = join(dir, 'force-app', 'main', 'default', 'classes', 'MyClass.cls');
    const newPath = join(dir, 'force-app', 'other', 'default', 'classes', 'MyClass.cls');
    const body = 'public class MyClass {}';
    await commitFile(dir, 'force-app/main/default/classes/MyClass.cls', body, 'initial commit');
    await git.setConfig({ fs, dir, path: 'core.autocrlf', value: 'input' });
    await rm(oldPath);
    await writeApexClass(newPath, body);
    const warnings: string[] = [];
    const repo = GitRepo.getInstance({
      dir,
      packageDirs: [{ name: 'force-app', path: 'force-app', fullPath: join(dir, 'force-app') }],
    });
    Object.assign(repo, {
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    const status = await repo.getStatus('HEAD');

    assert.deepEqual(status, []);
    assert.deepEqual(warnings, [`The file ${oldPath} moved to ${newPath} was ignored.`]);
  });

  it('removes source behavior option beta metadata xml moves', async () => {
    const dir = await initGitRepo();
    const oldPath = join(dir, 'force-app', 'main', 'default', 'objects', 'Account.object-meta.xml');
    const newPath = join(dir, 'force-app', 'main', 'default', 'objects', 'Account', 'Account.object-meta.xml');
    const metadataXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">',
      '    <label>Account</label>',
      '</CustomObject>',
    ].join('\n');
    await commitFile(dir, 'force-app/main/default/objects/Account.object-meta.xml', metadataXml, 'initial commit');
    await git.setConfig({ fs, dir, path: 'core.autocrlf', value: 'input' });
    await rm(oldPath);
    await writeApexClass(newPath, metadataXml);
    const warnings: string[] = [];
    const repo = GitRepo.getInstance({
      dir,
      packageDirs: [{ name: 'force-app', path: 'force-app', fullPath: join(dir, 'force-app') }],
    });
    Object.assign(repo, {
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    const status = await repo.getStatus('HEAD');

    assert.deepEqual(status, []);
    assert.deepEqual(warnings, [`The file ${oldPath} moved to ${newPath} was ignored.`]);
  });

  it('warns when core.autocrlf is configured outside the local git config', async () => {
    const dir = await initGitRepo();
    const globalConfig = join(dir, 'global.gitconfig');
    const previousGlobalConfig = process.env.GIT_CONFIG_GLOBAL;
    const warnings: string[] = [];
    await writeFile(globalConfig, '[core]\n\tautocrlf = true\n');
    process.env.GIT_CONFIG_GLOBAL = globalConfig;
    const repo = GitRepo.getInstance({ dir });
    Object.assign(repo, {
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    try {
      await (repo as unknown as { checkLocalGitAutocrlfConfig: () => Promise<void> }).checkLocalGitAutocrlfConfig();
    } finally {
      if (previousGlobalConfig === undefined) {
        delete process.env.GIT_CONFIG_GLOBAL;
      } else {
        process.env.GIT_CONFIG_GLOBAL = previousGlobalConfig;
      }
    }

    assert.deepEqual(warnings, [
      `You have currently set core.autocrlf to true in ${globalConfig}. To optimize performance, please execute 'git config --local core.autocrlf true'.`,
    ]);
  });

  it('does not warn when core.autocrlf is configured locally', async () => {
    const dir = await initGitRepo();
    const warnings: string[] = [];
    await git.setConfig({ fs, dir, path: 'core.autocrlf', value: 'input' });
    const repo = GitRepo.getInstance({ dir });
    Object.assign(repo, {
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    await (repo as unknown as { checkLocalGitAutocrlfConfig: () => Promise<void> }).checkLocalGitAutocrlfConfig();

    assert.deepEqual(warnings, []);
  });

  it('does not warn when core.autocrlf is not configured', async () => {
    const dir = await initGitRepo();
    const previousGlobalConfig = process.env.GIT_CONFIG_GLOBAL;
    const warnings: string[] = [];
    const repo = GitRepo.getInstance({ dir });
    Object.assign(repo, {
      lifecycle: {
        emitWarning: async (message: string): Promise<void> => {
          warnings.push(message);
        },
      },
    });

    try {
      process.env.GIT_CONFIG_GLOBAL = join(dir, 'missing-global.gitconfig');
      await (repo as unknown as { checkLocalGitAutocrlfConfig: () => Promise<void> }).checkLocalGitAutocrlfConfig();
    } finally {
      if (previousGlobalConfig === undefined) {
        delete process.env.GIT_CONFIG_GLOBAL;
      } else {
        process.env.GIT_CONFIG_GLOBAL = previousGlobalConfig;
      }
    }

    assert.deepEqual(warnings, []);
  });
});
