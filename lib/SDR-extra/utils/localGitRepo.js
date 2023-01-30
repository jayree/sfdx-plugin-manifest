/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import util from 'node:util';
import path from 'node:path';
import git from 'isomorphic-git';
import { Lifecycle } from '@salesforce/core';
import fs from 'graceful-fs';
export class GitRepo {
    constructor(options) {
        this.gitDir = options.gitDir;
        this.packageDirs = options.packageDirs;
    }
    static getInstance(options) {
        if (!GitRepo.instanceMap.has(options.gitDir)) {
            const newInstance = new GitRepo(options);
            GitRepo.instanceMap.set(options.gitDir, newInstance);
        }
        return GitRepo.instanceMap.get(options.gitDir);
    }
    async resolveMultiRefString(ref) {
        const a = ref.split('.');
        let ref1;
        let ref2;
        if (a.length === 3 || a.length === 4) {
            ref1 = a[0];
            ref2 = a[a.length - 1];
        }
        else if (a.length === 1) {
            ref1 = a[0];
            ref2 = undefined;
        }
        else {
            throw new Error(`Ambiguous ${util.format('argument%s', ref.length === 1 ? '' : 's')}: ${ref}
  See more help with --help`);
        }
        if (a.length === 4) {
            ref1 = (await git.findMergeBase({
                fs,
                dir: this.gitDir,
                oids: [ref2, ref1],
            }))[0];
        }
        else {
            ref1 = await this.resolveSingleRefString(ref1);
        }
        ref2 = await this.resolveSingleRefString(ref2);
        return { ref1, ref2 };
    }
    async resolveSingleRefString(ref) {
        if (ref === undefined) {
            return '';
        }
        if (!['~', '^'].some((el) => ref.includes(el))) {
            return (await this.getCommitLog(ref)).oid;
        }
        const firstIndex = [ref.indexOf('^'), ref.indexOf('~')].filter((a) => a >= 0).reduce((a, b) => Math.min(a, b));
        let ipath = ref.substring(firstIndex);
        let resolvedRef = ref.substring(0, firstIndex);
        while (ipath.length && resolvedRef !== undefined) {
            if (ipath.startsWith('^')) {
                ipath = ipath.substring(1);
                let next = Number(ipath.substring(0, 1));
                ipath = next ? ipath.substring(1) : ipath;
                next = next ? next : 1;
                // eslint-disable-next-line no-await-in-loop
                resolvedRef = (await this.getCommitLog(resolvedRef)).parents[next - 1];
            }
            else if (ipath.startsWith('~')) {
                ipath = ipath.substring(1);
                let next = Number(ipath.substring(0, 1));
                ipath = next ? ipath.substring(1) : ipath;
                next = next ? next : 1;
                for (let index = 0; index <= next - 1; index++) {
                    // eslint-disable-next-line no-await-in-loop
                    resolvedRef = (await this.getCommitLog(resolvedRef)).parents[0];
                }
            }
            else {
                resolvedRef = undefined;
            }
        }
        if (resolvedRef === undefined) {
            throw new Error(`ambiguous argument '${ref}': unknown revision or path not in the working tree.`);
        }
        return resolvedRef;
    }
    async getStatus(ref) {
        const getStatusText = (row) => {
            if ([
                [0, 2, 2],
                [0, 2, 3], // added, staged, with unstaged changes
            ].some((a) => a.every((val, index) => val === row[index]))) {
                return 'A';
            }
            if ([
                [1, 0, 0],
                [1, 0, 1],
                [1, 1, 0],
                [1, 2, 0],
                [1, 0, 3], // modified, staged, with unstaged deletion
            ].some((a) => a.every((val, index) => val === row[index]))) {
                return 'D';
            }
            if ([
                [1, 2, 1],
                [1, 2, 2],
                [1, 2, 3], // modified, staged, with unstaged changes
            ].some((a) => a.every((val, index) => val === row[index]))) {
                return 'M';
            }
        };
        const statusMatrix = await git.statusMatrix({
            fs,
            dir: this.gitDir,
            ref,
            filter: (f) => this.packageDirs ? this.packageDirs.some((fDir) => f.startsWith(this.ensureGitRelPath(fDir))) : true,
        });
        const warningMatrix = statusMatrix.filter((row) => [
            [0, 2, 3],
            [1, 0, 3],
            [1, 2, 3],
            [1, 1, 0],
            [1, 2, 0],
            [0, 0, 3],
            [1, 1, 3],
            [1, 2, 1],
            [1, 0, 1],
            [0, 2, 0], // new, untracked
        ].some((a) => a.every((val, index) => val === row.slice(1)[index])));
        if (warningMatrix.length) {
            const buildWarningArray = (warnings) => {
                const LifecycleInstance = Lifecycle.getInstance();
                const emitWarningArray = [];
                warnings.forEach((warning) => {
                    const filteredChanges = warningMatrix
                        .filter((row) => warning.filter.some((a) => a.every((val, index) => val === row.slice(1)[index])))
                        .map((row) => path.join(this.gitDir, ensureOSPath(row[0])));
                    for (const file of filteredChanges) {
                        emitWarningArray.push(LifecycleInstance.emitWarning(util.format(warning.message, file)));
                    }
                });
                return emitWarningArray;
            };
            // prettier-ignore
            await Promise.all(buildWarningArray([
                { filter: [[0, 2, 3], [1, 0, 3], [1, 2, 3], [1, 1, 0], [1, 2, 0]], message: 'The staged file with unstaged changes "%s" was processed.', },
                { filter: [[0, 0, 3], [1, 1, 3]], message: 'The staged file with unstaged changes "%s" was ignored.', },
                { filter: [[1, 2, 1], [1, 0, 1]], message: 'The unstaged file "%s" was processed.', },
                { filter: [[0, 2, 0]], message: 'The untracked file "%s" was ignored.', },
            ]));
        }
        const gitlines = statusMatrix
            .filter((row) => ![
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 3],
            [0, 2, 0],
            [1, 1, 3], // modified, staged, with unstaged original file
        ].some((a) => a.every((val, index) => val === row.slice(1)[index])))
            .map((row) => ({
            path: path.join(this.gitDir, ensureOSPath(row[0])),
            status: getStatusText(row.slice(1)),
        }));
        return gitlines;
    }
    async getFileState(options) {
        const gitDir = this.gitDir;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return git.walk({
            fs,
            dir: this.gitDir,
            trees: [git.TREE({ ref: options.ref1 }), git.TREE({ ref: options.ref2 })],
            async map(filepath, [A, B]) {
                if (filepath === '.' || (await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
                    return;
                }
                const Aoid = await A?.oid();
                const Boid = await B?.oid();
                let type = 'EQ';
                if (Aoid !== Boid) {
                    type = 'M';
                }
                if (Aoid === undefined) {
                    type = 'A';
                }
                if (Boid === undefined) {
                    type = 'D';
                }
                if (type !== 'EQ') {
                    return {
                        path: path.join(gitDir, ensureOSPath(filepath)),
                        status: type,
                    };
                }
            },
        });
    }
    async listFullPathFiles(ref) {
        return (await git.listFiles({ fs, dir: this.gitDir, ref })).map((p) => path.join(this.gitDir, ensureOSPath(p)));
    }
    async getOid(ref) {
        return ref ? git.resolveRef({ fs, dir: this.gitDir, ref }) : '';
    }
    async readBlobAsBuffer(options) {
        return Buffer.from((await git.readBlob({
            fs,
            dir: this.gitDir,
            oid: options.oid,
            filepath: this.ensureGitRelPath(options.filename),
        })).blob);
    }
    async getCommitLog(ref) {
        try {
            const [log] = await git.log({
                fs,
                dir: this.gitDir,
                ref,
                depth: 1,
            });
            return { oid: log.oid, parents: log.commit.parent };
        }
        catch (error) {
            throw new Error(`ambiguous argument '${ref}': unknown revision or path not in the working tree.
  See more help with --help`);
        }
    }
    ensureGitRelPath(fpath) {
        return path.relative(this.gitDir, fpath).split(path.sep).join(path.posix.sep);
    }
}
GitRepo.instanceMap = new Map();
function ensureOSPath(fpath) {
    return fpath.split(path.posix.sep).join(path.sep);
}
//# sourceMappingURL=localGitRepo.js.map