/*
 * Copyright 2025, jayree
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
// https://github.com/isomorphic-git/isomorphic-git/blob/main/src/api/statusMatrix.js
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { STAGE } from 'isomorphic-git';
import { TREE } from 'isomorphic-git';
import { WORKDIR } from 'isomorphic-git';
import { walk as _walk } from 'isomorphic-git';
import { isIgnored as _isIgnored, StatusRow } from 'isomorphic-git';
import { worthWalking } from '../utils/worthWalking.js';

/**
 * Efficiently get the status of multiple files at once.
 *
 * The returned `StatusMatrix` is admittedly not the easiest format to read.
 * However it conveys a large amount of information in dense format that should make it easy to create reports about the current state of the repository;
 * without having to do multiple, time-consuming isomorphic-git calls.
 * My hope is that the speed and flexibility of the function will make up for the learning curve of interpreting the return value.
 *
 * ```js live
 * // get the status of all the files in 'src'
 * let status = await git.statusMatrix({
 *   fs,
 *   dir: '/tutorial',
 *   filter: f => f.startsWith('src/')
 * })
 * console.log(status)
 * ```
 *
 * ```js live
 * // get the status of all the JSON and Markdown files
 * let status = await git.statusMatrix({
 *   fs,
 *   dir: '/tutorial',
 *   filter: f => f.endsWith('.json') || f.endsWith('.md')
 * })
 * console.log(status)
 * ```
 *
 * The result is returned as a 2D array.
 * The outer array represents the files and/or blobs in the repo, in alphabetical order.
 * The inner arrays describe the status of the file:
 * the first value is the filepath, and the next three are integers
 * representing the HEAD status, WORKDIR status, and STAGE status of the entry.
 *
 * ```js
 * // example StatusMatrix
 * [
 *   ["a.txt", 0, 2, 0], // new, untracked
 *   ["b.txt", 0, 2, 2], // added, staged
 *   ["c.txt", 0, 2, 3], // added, staged, with unstaged changes
 *   ["d.txt", 1, 1, 1], // unmodified
 *   ["e.txt", 1, 2, 1], // modified, unstaged
 *   ["f.txt", 1, 2, 2], // modified, staged
 *   ["g.txt", 1, 2, 3], // modified, staged, with unstaged changes
 *   ["h.txt", 1, 0, 1], // deleted, unstaged
 *   ["i.txt", 1, 0, 0], // deleted, staged
 *   ["j.txt", 1, 2, 0], // deleted, staged, with unstaged-modified changes (new file of the same name)
 *   ["k.txt", 1, 1, 0], // deleted, staged, with unstaged changes (new file of the same name)
 * ]
 * ```
 *
 * - The HEAD status is either absent (0) or present (1).
 * - The WORKDIR status is either absent (0), identical to HEAD (1), or different from HEAD (2).
 * - The STAGE status is either absent (0), identical to HEAD (1), identical to WORKDIR (2), or different from WORKDIR (3).
 *
 * ```ts
 * type Filename      = string
 * type HeadStatus    = 0 | 1
 * type WorkdirStatus = 0 | 1 | 2
 * type StageStatus   = 0 | 1 | 2 | 3
 *
 * type StatusRow     = [Filename, HeadStatus, WorkdirStatus, StageStatus]
 *
 * type StatusMatrix  = StatusRow[]
 * ```
 *
 * > Think of the natural progression of file modifications as being from HEAD (previous) -> WORKDIR (current) -> STAGE (next).
 * > Then HEAD is "version 1", WORKDIR is "version 2", and STAGE is "version 3".
 * > Then, imagine a "version 0" which is before the file was created.
 * > Then the status value in each column corresponds to the oldest version of the file it is identical to.
 * > (For a file to be identical to "version 0" means the file is deleted.)
 *
 * Here are some examples of queries you can answer using the result:
 *
 * #### Q: What files have been deleted?
 * ```js
 * const FILE = 0, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] === 0)
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have unstaged changes?
 * ```js
 * const FILE = 0, WORKDIR = 2, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] !== row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have been modified since the last commit?
 * ```js
 * const FILE = 0, HEAD = 1, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] !== row[WORKDIR])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files will NOT be changed if I commit right now?
 * ```js
 * const FILE = 0, HEAD = 1, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] === row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * For reference, here are all possible combinations:
 *
 * | HEAD | WORKDIR | STAGE | `git status --short` equivalent |
 * | ---- | ------- | ----- | ------------------------------- |
 * | 0    | 0       | 0     | ``                              |
 * | 0    | 0       | 3     | `AD`                            |
 * | 0    | 2       | 0     | `??`                            |
 * | 0    | 2       | 2     | `A `                            |
 * | 0    | 2       | 3     | `AM`                            |
 * | 1    | 0       | 0     | `D `                            |
 * | 1    | 0       | 1     | ` D`                            |
 * | 1    | 0       | 3     | `MD`                            |
 * | 1    | 1       | 0     | `D ` + `??`                     |
 * | 1    | 1       | 1     | ``                              |
 * | 1    | 1       | 3     | `MM`                            |
 * | 1    | 2       | 0     | `D ` + `??`                     |
 * | 1    | 2       | 1     | ` M`                            |
 * | 1    | 2       | 2     | `M `                            |
 * | 1    | 2       | 3     | `MM`                            |
 *
 * @param {object} args
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref1 = 'HEAD'] - Optionally specify a different commit to compare against the workdir and stage instead of the HEAD
 * @param {string} [args.ref2 = 'STAGE'] - Optionally specify a different commit to compare against the <ref1> commit instead of the workdir and stage
 * @param {string[]} [args.filepaths = ['.']] - Limit the query to the given files and directories
 * @param {function(string): boolean} [args.filter] - Filter the results to only those whose filepath matches a function.
 * @param {object} [args.cache] - a [cache](cache.md) object
 * @param {boolean} [args.ignored = false] - include ignored files in the result
 *
 * @returns {Promise<Array<StatusRow>>} Resolves with a status matrix, described below.
 * @see StatusRow
 */
export async function statusMatrix({
  dir,
  gitdir = join(dir, '.git'),
  ref1 = 'HEAD',
  ref2,
  filepaths = ['.'],
  filter,
  cache = {},
  ignored: shouldIgnore = false,
}: {
  dir: string;
  gitdir?: string;
  ref1: string;
  ref2?: string;
  filepaths?: string[];
  filter?: ((arg0: string) => boolean) | undefined;
  cache: object;
  ignored?: boolean;
}): Promise<StatusRow[]> {
  return _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: ref1 }), ref2 ? TREE({ ref: ref2 }) : WORKDIR(), ref2 ? TREE({ ref: ref2 }) : STAGE()],
    // eslint-disable-next-line complexity
    async map(filepath, [head, workdir, stage]) {
      // Ignore ignored files, but only if they are not already tracked.
      if (!head && !stage && workdir) {
        if (!shouldIgnore) {
          const isIgnored = await _isIgnored({
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
