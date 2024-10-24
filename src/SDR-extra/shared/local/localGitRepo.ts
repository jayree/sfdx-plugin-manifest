/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// https://github.com/forcedotcom/source-tracking/blob/main/src/shared/local/localShadowRepo.ts
import util from 'node:util';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import git, { StatusRow, readBlob as _readBlob, listFiles as _listFiles } from 'isomorphic-git';
import { Performance } from '@oclif/core/performance';
import { Lifecycle, NamedPackageDir, SfError } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { excludeLwcLocalOnlyTest, folderContainsPath } from '@salesforce/source-tracking/lib/shared/functions.js';
import {
  HEAD,
  WORKDIR,
  IS_WINDOWS,
  ensureWindows,
  ensurePosix,
  toFilenames,
} from '@salesforce/source-tracking/lib/shared/local/functions.js';
import { getMatches } from '@salesforce/source-tracking/lib/shared/local/moveDetection.js';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import { statusMatrix } from '../../api/statusMatrix.js';
import { filenameMatchesToMap, getLogMessage } from './moveDetection.js';

export const STAGE = 3;

export type GitRepoOptions = {
  dir: string;
  packageDirs?: NamedPackageDir[];
  registry?: RegistryAccess;
};

type Warning = { filter: Array<Array<0 | 1 | 2 | 3>>; message: string };

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
  private cache!: unknown;

  private lifecycle = Lifecycle.getInstance();

  private readonly registry: RegistryAccess;

  private constructor(options: GitRepoOptions) {
    this.dir = options.dir;
    this.packageDirs = options.packageDirs?.map(packageDirToRelativePosixPath(options.dir)) ?? [];
    this.registry = options.registry ?? new RegistryAccess();
    this.cache = {};
  }

  public static getInstance(options: GitRepoOptions): GitRepo {
    if (!GitRepo.instanceMap.has(options.dir)) {
      const newInstance = new GitRepo(options);
      GitRepo.instanceMap.set(options.dir, newInstance);
    }
    return GitRepo.instanceMap.get(options.dir) as GitRepo;
  }

  public async resolveRef(ref: string): Promise<string | undefined> {
    return ref ? git.resolveRef({ fs, dir: this.dir, ref }) : undefined;
  }

  public async getConfig(p: string): Promise<string> {
    return (await git.getConfig({ fs, dir: this.dir, path: p })) as string;
  }

  // eslint-disable-next-line class-methods-use-this
  public async hashBlob(object: Buffer): Promise<string> {
    return (await git.hashBlob({ object })).oid;
  }

  public async listFiles(ref: string): Promise<string[]> {
    return ref
      ? (await _listFiles({ fs, dir: this.dir, ref, cache: this.cache })).map((p) =>
          path.join(IS_WINDOWS ? ensureWindows(p) : p),
        )
      : (await fs.readdir(this.dir, { recursive: true })).map((p) => path.join(IS_WINDOWS ? ensureWindows(p) : p));
  }

  public async readBlob(filepath: string, oid?: string): Promise<Buffer> {
    return oid
      ? Buffer.from(
          (
            await _readBlob({
              fs,
              dir: this.dir,
              oid,
              filepath: IS_WINDOWS ? ensurePosix(filepath) : filepath,
              cache: this.cache,
            })
          ).blob,
        )
      : fs.readFile(path.resolve(filepath));
  }

  public async readOid(filepath: string, oid: string): Promise<string> {
    return (
      await _readBlob({
        fs,
        dir: this.dir,
        oid,
        filepath: IS_WINDOWS ? ensurePosix(filepath) : filepath,
        cache: this.cache,
      })
    ).oid;
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
          cache: this.cache,
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

  public getAdds(): StatusRow[] {
    return this.status.filter((file) => file[HEAD] === 0 && file[WORKDIR] === 2);
  }

  public getAddFilenames(): string[] {
    return toFilenames(this.getAdds());
  }

  public getModifies(): StatusRow[] {
    return this.status.filter((file) => file[HEAD] === 1 && file[WORKDIR] === 2);
  }

  public getModifyFilenames(): string[] {
    return toFilenames(this.getModifies());
  }

  public getDeletes(): StatusRow[] {
    return this.status.filter((file) => file[HEAD] === 1 && file[WORKDIR] === 0);
  }

  public getDeleteFilenames(): string[] {
    return toFilenames(this.getDeletes());
  }

  public async getStatus(ref1: string, ref2?: string): Promise<StatusRow[]> {
    const marker = Performance.mark('@jayree/sfdx-plugin-manifest', 'localGitRepo.getStatus');
    await this.checkLocalGitAutocrlfConfig();

    try {
      this.status = await statusMatrix({
        dir: this.dir,
        cache: this.cache,
        ref1,
        ref2,
        filepaths: this.packageDirs,
        ignored: true,
        filter: fileFilter(this.packageDirs),
      });

      // isomorphic-git stores things in unix-style tree.  Convert to windows-style if necessary
      if (IS_WINDOWS) {
        this.status = this.status.map((row) => [path.normalize(row[0]), row[HEAD], row[WORKDIR], row[STAGE]]);
      }

      await this.detectMovedFiles();
      await this.emitStatusWarnings();
    } catch (e) {
      redirectToCliRepoError(e);
    }
    marker?.stop();
    return this.status;
  }

  public async emitStatusWarnings(): Promise<void> {
    const warningPatterns: Array<Array<0 | 1 | 2 | 3>> = [
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
    ];

    // prettier-ignore
    const warningMessages: Warning[] = [
      { filter: [[0, 2, 3], [1, 0, 3], [1, 2, 3], [1, 2, 0], [0, 0, 3]], message: 'The staged file with unstaged changes %s was processed.' },
      { filter: [[1, 1, 3], [1, 1, 0]], message: 'The staged file with unstaged changes %s was ignored.' },
      { filter: [[1, 2, 1], [1, 0, 1]], message: 'The unstaged file %s was processed.' },
      { filter: [[0, 2, 0]], message: 'The untracked file %s was processed.' },
    ];

    const matchesPattern = (row: StatusRow, patterns: Array<Array<0 | 1 | 2 | 3>>): boolean =>
      patterns.some((pattern) => pattern.every((val, i) => val === row[i + 1]));

    const filteredRows = this.status.filter((row) => matchesPattern(row, warningPatterns));

    if (filteredRows.length === 0) return;

    const getWarningPromises = (warnings: Warning[]): Array<Promise<void>> =>
      warnings.flatMap((warning) => {
        const filesToWarn = filteredRows
          .filter((row) => matchesPattern(row, warning.filter))
          .map((row) => (IS_WINDOWS ? ensureWindows(row[0]) : row[0]));

        return filesToWarn.map((file) => this.lifecycle.emitWarning(util.format(warning.message, file)));
      });

    await Promise.all(getWarningPromises(warningMessages));
  }

  private async detectMovedFiles(): Promise<void> {
    const matchingFiles = getMatches(this.status);
    if (!matchingFiles.added.size || !matchingFiles.deleted.size) return;

    const movedFilesMarker = Performance.mark('@jayree/sfdx-plugin-manifest', 'localGitRepo.detectMovedFiles');

    const sourceBehaviorOptionsBetaMatches = new Map();
    for (const deletedFilePath of matchingFiles.deleted) {
      const fullName = parseMetadataXml(deletedFilePath)?.fullName;
      if (fullName) {
        const addedFilePath = path.join(path.dirname(deletedFilePath), fullName, path.basename(deletedFilePath));
        if (matchingFiles.added.has(addedFilePath)) {
          matchingFiles.deleted.delete(deletedFilePath);
          matchingFiles.added.delete(addedFilePath);
          sourceBehaviorOptionsBetaMatches.set(deletedFilePath, addedFilePath);
        }
      }
    }

    const matches = await filenameMatchesToMap(this.registry)(this.dir)(matchingFiles);

    sourceBehaviorOptionsBetaMatches.forEach((key: string, value: string) => {
      matches.fullMatches.set(key, value);
    });

    if (matches.deleteOnly.size === 0 && matches.fullMatches.size === 0) return;

    await Promise.all(getLogMessage(matches).map((message) => this.lifecycle.emitWarning(message)));

    const removeFiles = [
      ...matches.fullMatches.values(),
      ...matches.fullMatches.keys(),
      ...matches.deleteOnly.values(),
    ];

    this.status = this.status.filter((file) => (removeFiles.includes(file[0]) ? false : true));
    movedFilesMarker?.stop();
  }

  private async getCommitLog(ref: string): Promise<{ oid: string; parents: string[] }> {
    try {
      const [log] = await git.log({
        fs,
        dir: this.dir,
        ref,
        depth: 1,
        cache: this.cache,
      });
      return { oid: log.oid, parents: log.commit.parent };
    } catch (error) {
      throw new Error(
        `ambiguous argument '${ref}': unknown revision or path not in the working tree.
  See more help with --help`,
      );
    }
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
