/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import util from 'node:util';
import path from 'node:path';
import * as os from 'node:os';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import git, { StatusRow } from 'isomorphic-git';
import { Lifecycle, NamedPackageDir, SfError } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { excludeLwcLocalOnlyTest, folderContainsPath } from '@salesforce/source-tracking/lib/shared/functions.js';
import { getMatches } from '@salesforce/source-tracking/lib/shared/local/moveDetection.js';
import { StringMap } from '@salesforce/source-tracking/lib/shared/local/types.js';
import { parseMetadataXml } from '../index.js';
import { filenameMatchesToMap } from './movedetection.js';

export type GitRepoOptions = {
  dir: string;
  packageDirs: NamedPackageDir[];
  registry: RegistryAccess;
};

const IS_WINDOWS = os.type() === 'Windows_NT';

const redirectToCliRepoError = (e: unknown): never => {
  if (e instanceof git.Errors.InternalError) {
    const error = new SfError(
      `An internal error caused this command to fail. isomorphic-git error:${os.EOL}${e.data.message}`,
      e.name,
    );
    throw error;
  }
  throw e;
};
export class GitRepo {
  private static instanceMap = new Map<string, GitRepo>();

  public dir: string;

  private packageDirs: string[];
  private status!: StatusRow[];

  private lifecycle = Lifecycle.getInstance();

  private readonly registry: RegistryAccess;

  private constructor(options: GitRepoOptions) {
    this.dir = options.dir;
    this.packageDirs = options.packageDirs.map(packageDirToRelativePosixPath(options.dir));
    this.registry = options.registry;
  }

  public static getInstance(options: GitRepoOptions): GitRepo {
    if (!GitRepo.instanceMap.has(options.dir)) {
      const newInstance = new GitRepo(options);
      GitRepo.instanceMap.set(options.dir, newInstance);
    }
    return GitRepo.instanceMap.get(options.dir) as GitRepo;
  }

  public async resolveMultiRefString(ref: string): Promise<{
    ref1: string;
    ref2: string;
  }> {
    const a = ref.split('.');
    let ref1: string;
    let ref2: string | undefined;

    if (a.length === 3 || a.length === 4) {
      ref1 = a[0];
      ref2 = a[a.length - 1];
    } else if (a.length === 1) {
      ref1 = a[0];
    } else {
      throw new Error(`Ambiguous ${util.format('argument%s', ref.length === 1 ? '' : 's')}: ${ref}
  See more help with --help`);
    }

    if (a.length === 4 && ref2) {
      ref1 = (
        await git.findMergeBase({
          fs,
          dir: this.dir,
          oids: [ref2, ref1],
        })
      )[0] as string;
    } else {
      ref1 = await this.resolveSingleRefString(ref1);
    }
    ref2 = await this.resolveSingleRefString(ref2);

    return { ref1, ref2 };
  }

  public async resolveSingleRefString(ref: string | undefined): Promise<string> {
    if (ref === undefined) {
      return '';
    }

    if (!['~', '^'].some((el) => ref.includes(el))) {
      return (await this.getCommitLog(ref)).oid;
    }

    const firstIndex = [ref.indexOf('^'), ref.indexOf('~')].filter((a) => a >= 0).reduce((a, b) => Math.min(a, b));
    let ipath = ref.substring(firstIndex);
    let resolvedRef: string | undefined = ref.substring(0, firstIndex);
    while (ipath.length && resolvedRef !== undefined) {
      if (ipath.startsWith('^')) {
        ipath = ipath.substring(1);
        let next = Number(ipath.substring(0, 1));
        ipath = next ? ipath.substring(1) : ipath;
        next = next ? next : 1;
        // eslint-disable-next-line no-await-in-loop
        resolvedRef = (await this.getCommitLog(resolvedRef)).parents[next - 1];
      } else if (ipath.startsWith('~')) {
        ipath = ipath.substring(1);
        let next = Number(ipath.substring(0, 1));
        ipath = next ? ipath.substring(1) : ipath;
        next = next ? next : 1;
        for (let index = 0; index <= next - 1; index++) {
          // eslint-disable-next-line no-await-in-loop
          resolvedRef = (await this.getCommitLog(resolvedRef)).parents[0];
        }
      } else {
        resolvedRef = undefined;
      }
    }
    if (resolvedRef === undefined) {
      throw new Error(`ambiguous argument '${ref}': unknown revision or path not in the working tree.`);
    }
    return resolvedRef;
  }

  public async getStatus(ref1: string, ref2?: string): Promise<StatusRow[]> {
    try {
      // status hasn't been initialized yet
      this.status = await this.statusMatrix({
        ref1,
        ref2,
        filepaths: this.packageDirs,
        ignore: true,
        filter: fileFilter(this.packageDirs),
      });

      await this.detectMovedFiles();
    } catch (e) {
      redirectToCliRepoError(e);
    }
    // isomorphic-git stores things in unix-style tree.  Convert to windows-style if necessary
    if (IS_WINDOWS) {
      this.status = this.status.map((row) => [path.normalize(row[0]), row[1], row[2], row[3]]);
    }
    return this.status;
  }

  public async getStatusText(
    ref1: string,
    ref2?: string,
  ): Promise<Array<{ path: string; status: string | undefined }>> {
    const getStatusAsText = (row: number[]): 'A' | 'D' | 'M' | undefined => {
      if (
        [
          [0, 2, 2], // added, staged
          [0, 2, 3], // added, staged, with unstaged changes
        ].some((a) => a.every((val, index) => val === row[index]))
      ) {
        return 'A';
      }
      if (
        [
          [1, 0, 0], // deleted, staged
          [1, 0, 1], // deleted, unstaged
          [1, 1, 0], // deleted, staged, with unstaged original file
          [1, 2, 0], // deleted, staged, with unstaged changes
          [1, 0, 3], // modified, staged, with unstaged deletion
        ].some((a) => a.every((val, index) => val === row[index]))
      ) {
        return 'D';
      }
      if (
        [
          [1, 2, 1], // modified, unstaged
          [1, 2, 2], // modified, staged
          [1, 2, 3], // modified, staged, with unstaged changes
        ].some((a) => a.every((val, index) => val === row[index]))
      ) {
        return 'M';
      }
      return undefined;
    };

    await this.checkLocalGitAutocrlfConfig();

    const statusMatrix = await this.getStatus(ref1, ref2);

    const warningMatrix = statusMatrix.filter((row) =>
      [
        [0, 2, 3], // added, staged, with unstaged changes
        [1, 0, 3], // modified, staged, with unstaged deletion
        [1, 2, 3], // modified, staged, with unstaged changes
        [1, 1, 0], // deleted, staged, with unstaged original file
        [1, 2, 0], // deleted, staged, with unstaged changes
        [0, 0, 3], // added, staged, with unstaged deletion
        [1, 1, 3], // modified, staged, with unstaged original file
        [1, 2, 1], // modified, unstaged
        [1, 0, 1], // deleted, unstaged
        [0, 2, 0], // new, untracked
      ].some((a) => a.every((val, index) => val === row.slice(1)[index])),
    );

    if (warningMatrix.length) {
      const buildWarningArray = (warnings: Array<{ filter: number[][]; message: string }>): Array<Promise<void>> => {
        const emitWarningArray: Array<Promise<void>> = [];
        warnings.forEach((warning) => {
          const filteredChanges = warningMatrix
            .filter((row) => warning.filter.some((a) => a.every((val, index) => val === row.slice(1)[index])))
            .map((row) => ensureOSPath(row[0]));

          for (const file of filteredChanges) {
            emitWarningArray.push(this.lifecycle.emitWarning(util.format(warning.message, file)));
          }
        });
        return emitWarningArray;
      };
      // prettier-ignore
      await Promise.all(buildWarningArray([
        { filter: [[0, 2, 3], [1, 0, 3], [1, 2, 3], [1, 1, 0], [1, 2, 0]], message: 'The staged file with unstaged changes %s was processed.', },
        { filter: [[0, 0, 3], [1, 1, 3]], message: 'The staged file with unstaged changes %s was ignored.', },
        { filter: [[1, 2, 1], [1, 0, 1]], message: 'The unstaged file %s was processed.', },
        { filter: [[0, 2, 0]], message: 'The untracked file %s was ignored.', },
      ]));
    }

    const gitlines = statusMatrix
      .filter(
        (row) =>
          ![
            [0, 0, 0], // undefined
            [1, 1, 1], // unmodified
            [0, 0, 3], // added, staged, with unstaged deletion
            [0, 2, 0], // new, untracked
            [1, 1, 3], // modified, staged, with unstaged original file
          ].some((a) => a.every((val, index) => val === row.slice(1)[index])),
      )
      .map((row) => ({
        path: path.join(this.dir, ensureOSPath(row[0])),
        status: getStatusAsText(row.slice(1) as number[]),
      }));

    return gitlines;
  }

  public async statusMatrix(options: {
    ref1: string;
    ref2?: string;
    filepaths?: string[];
    filter?: ((arg0: string) => boolean) | undefined;
    ignore?: boolean;
  }): Promise<StatusRow[]> {
    const filepaths = options.filepaths ?? ['.'];
    const filter = options.filter;
    const dir = this.dir;
    const shouldIgnore = options.ignore ?? false;
    return git.walk({
      fs,
      dir,
      trees: [
        git.TREE({ ref: options.ref1 }),
        options.ref2 ? git.TREE({ ref: options.ref2 }) : git.WORKDIR(),
        options.ref2 ? git.TREE({ ref: options.ref2 }) : git.STAGE(),
      ],
      // eslint-disable-next-line complexity
      async map(filepath, [head, workdir, stage]) {
        // Ignore ignored files, but only if they are not already tracked.
        if (!head && !stage && workdir) {
          if (!shouldIgnore) {
            const isIgnored = await git.isIgnored({
              fs,
              dir,
              filepath,
            });
            if (isIgnored) {
              return null;
            }
          }
        }
        // match against base paths
        if (!filepaths.some((base) => worthWalking(filepath, base))) {
          return null;
        }
        // Late filter against file names
        if (filter) {
          if (!filter(filepath)) return;
        }

        const [headType, workdirType, stageType] = await Promise.all([head?.type(), workdir?.type(), stage?.type()]);

        const isBlob = [headType, workdirType, stageType].includes('blob');

        // For now, bail on directories unless the file is also a blob in another tree
        if ((headType === 'tree' || headType === 'special') && !isBlob) return;
        if (headType === 'commit') return null;

        if ((workdirType === 'tree' || workdirType === 'special') && !isBlob) return;

        if (stageType === 'commit') return null;
        if ((stageType === 'tree' || stageType === 'special') && !isBlob) return;

        // Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
        const headOid = headType === 'blob' ? await head?.oid() : undefined;
        const stageOid = stageType === 'blob' ? await stage?.oid() : undefined;
        let workdirOid;
        if (headType !== 'blob' && workdirType === 'blob' && stageType !== 'blob') {
          // We don't actually NEED the sha. Any sha will do
          // TODO: update this logic to handle N trees instead of just 3.
          workdirOid = '42';
        } else if (workdirType === 'blob') {
          workdirOid = await workdir?.oid();
        }
        const entry = [undefined, headOid, workdirOid, stageOid];
        const result = entry.map((value) => entry.indexOf(value));
        result.shift(); // remove leading undefined entry
        return [filepath, ...result];
      },
    }) as Promise<StatusRow[]>;
  }

  public async listFullPathFiles(ref: string): Promise<string[]> {
    return ref
      ? (await git.listFiles({ fs, dir: this.dir, ref })).map((p) => path.join(this.dir, ensureOSPath(p)))
      : (await fs.readdir(this.dir, { recursive: true })).map((p) => path.join(this.dir, ensureOSPath(p)));
  }

  public async getOid(ref: string): Promise<string> {
    return ref ? git.resolveRef({ fs, dir: this.dir, ref }) : '';
  }

  public async readBlobAsBuffer(options: { oid: string; filename: string }): Promise<Buffer> {
    return Buffer.from(
      (
        await git.readBlob({
          fs,
          dir: this.dir,
          oid: options.oid,
          filepath: this.ensureGitRelPath(options.filename),
        })
      ).blob,
    );
  }

  private async detectMovedFiles(): Promise<void> {
    const matchingFiles = getMatches(this.status);
    if (!matchingFiles.added.size || !matchingFiles.deleted.size) return;

    const tmpMatches = new Map();
    for (const deletedFilePath of matchingFiles.deleted) {
      const fullName = parseMetadataXml(deletedFilePath)?.fullName;
      if (fullName) {
        const addedFilePath = path.posix.join(path.dirname(deletedFilePath), fullName, path.basename(deletedFilePath));
        if (matchingFiles.added.has(addedFilePath)) {
          matchingFiles.deleted.delete(deletedFilePath);
          matchingFiles.added.delete(addedFilePath);
          tmpMatches.set(deletedFilePath, addedFilePath);
        }
      }
    }

    const matches = await filenameMatchesToMap(IS_WINDOWS)(this.registry)(this.dir)(path.join(this.dir, '.git'))(
      matchingFiles,
    );

    tmpMatches.forEach((key: string, value: string) => {
      matches.fullMatches.set(key, value);
    });

    if (matches.deleteOnly.size === 0 && matches.fullMatches.size === 0) return;

    const getLogMessage = (m: { fullMatches: StringMap; deleteOnly: StringMap }): Array<Promise<void>> => [
      ...[...m.fullMatches.entries()].map(([add, del]) =>
        this.lifecycle.emitWarning(`The file ${del} moved to ${add} was ignored`),
      ),
      ...[...m.deleteOnly.entries()].map(([add, del]) =>
        this.lifecycle.emitWarning(`The file ${del} moved to ${add} and modified was processed`),
      ),
    ];

    await Promise.all(getLogMessage(matches));

    const removeFiles = [
      ...matches.fullMatches.values(),
      ...matches.fullMatches.keys(),
      ...matches.deleteOnly.values(),
    ];

    this.status = this.status.filter((file) => (removeFiles.includes(file[0]) ? false : true));
  }

  private async getCommitLog(ref: string): Promise<{ oid: string; parents: string[] }> {
    try {
      const [log] = await git.log({
        fs,
        dir: this.dir,
        ref,
        depth: 1,
      });
      return { oid: log.oid, parents: log.commit.parent };
    } catch (error) {
      throw new Error(
        `ambiguous argument '${ref}': unknown revision or path not in the working tree.
  See more help with --help`,
      );
    }
  }

  private ensureGitRelPath(fpath: string): string {
    return path.relative(this.dir, fpath).split(path.sep).join(path.posix.sep);
  }

  private async checkLocalGitAutocrlfConfig(): Promise<void> {
    try {
      const stdout = execSync('git config --show-origin core.autocrlf', { cwd: this.dir }).toString().trim();

      if (stdout) {
        const [origin, value] = stdout.split('\t');
        const [, ...rest] = origin.split(':');
        const file = rest.join(':') || '';
        if (file !== '.git/config') {
          await this.lifecycle.emitWarning(
            `You have currently set core.autocrlf to ${value} in ${file}. To optimize performance, please execute 'git config --local core.autocrlf ${value}'.`,
          );
        }
      }
    } catch {
      // if the command fails, autocrlf is not set
    }
  }
}

function ensureOSPath(fpath: string): string {
  return fpath.split(path.posix.sep).join(path.sep);
}

const ensurePosix = (filepath: string): string => filepath.split(path.sep).join(path.posix.sep);

const packageDirToRelativePosixPath =
  (projectPath: string) =>
  (packageDir: NamedPackageDir): string =>
    IS_WINDOWS
      ? ensurePosix(path.relative(projectPath, packageDir.fullPath))
      : path.relative(projectPath, packageDir.fullPath);

const fileFilter =
  (packageDirs: string[]) =>
  (f: string): boolean =>
    // no hidden files
    !f.includes(`${path.sep}.`) &&
    // no lwc tests
    excludeLwcLocalOnlyTest(f) &&
    // no gitignore files
    !f.endsWith('.gitignore') &&
    // isogit uses `startsWith` for filepaths so it's possible to get a false positive
    packageDirs.some(folderContainsPath(f));

const worthWalking = (filepath: string, root: string): boolean => {
  if (filepath === '.' || root == null || root.length === 0 || root === '.') {
    return true;
  }
  if (root.length >= filepath.length) {
    return root.startsWith(filepath);
  } else {
    return filepath.startsWith(root);
  }
};
