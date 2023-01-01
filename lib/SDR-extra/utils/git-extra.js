/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import util from 'util';
import path from 'path';
import git from 'isomorphic-git';
import fs from 'fs-extra';
import Debug from 'debug';
export const debug = Debug('sf:gitDiff:extra');
async function getCommitLog(options) {
    try {
        const [log] = await git.log({
            fs: options.fs,
            dir: options.dir,
            ref: options.ref,
            depth: 1,
        });
        return { oid: log.oid, parents: log.commit.parent };
    }
    catch (error) {
        throw new Error(`ambiguous argument '${options.ref}': unknown revision or path not in the working tree.
See more help with --help`);
    }
}
export async function resolveMultiRefString(options) {
    const a = options.ref.split('.');
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
        throw new Error(`Ambiguous ${util.format('argument%s', options.ref.length === 1 ? '' : 's')}: ${options.ref}
See more help with --help`);
    }
    if (a.length === 4) {
        ref1 = (await git.findMergeBase({
            fs: options.fs,
            dir: options.dir,
            oids: [ref2, ref1],
        }))[0];
    }
    else {
        ref1 = await resolveSingleRefString({ ref: ref1, dir: options.dir, fs: options.fs });
    }
    ref2 = await resolveSingleRefString({ ref: ref2, dir: options.dir, fs: options.fs });
    return { ref1, ref2 };
}
export async function resolveSingleRefString(options) {
    if (options.ref === undefined) {
        return '';
    }
    if (!['~', '^'].some((el) => options.ref.includes(el))) {
        return (await getCommitLog({ ref: options.ref, fs: options.fs, dir: options.dir })).oid;
    }
    const firstIndex = [options.ref.indexOf('^'), options.ref.indexOf('~')]
        .filter((a) => a >= 0)
        .reduce((a, b) => Math.min(a, b));
    let ipath = options.ref.substring(firstIndex);
    let resolvedRef = options.ref.substring(0, firstIndex);
    while (ipath.length && resolvedRef !== undefined) {
        if (ipath.startsWith('^')) {
            ipath = ipath.substring(1);
            let next = Number(ipath.substring(0, 1));
            ipath = next ? ipath.substring(1) : ipath;
            next = next ? next : 1;
            // eslint-disable-next-line no-await-in-loop
            resolvedRef = (await getCommitLog({ ref: resolvedRef, fs: options.fs, dir: options.dir })).parents[next - 1];
        }
        else if (ipath.startsWith('~')) {
            ipath = ipath.substring(1);
            let next = Number(ipath.substring(0, 1));
            ipath = next ? ipath.substring(1) : ipath;
            next = next ? next : 1;
            for (let index = 0; index <= next - 1; index++) {
                // eslint-disable-next-line no-await-in-loop
                resolvedRef = (await getCommitLog({ ref: resolvedRef, fs: options.fs, dir: options.dir })).parents[0];
            }
        }
        else {
            resolvedRef = undefined;
        }
    }
    if (resolvedRef === undefined) {
        throw new Error(`ambiguous argument '${options.ref}': unknown revision or path not in the working tree.`);
    }
    return resolvedRef;
}
export async function getFileState(commitHash1, commitHash2, dir) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return git.walk({
        fs,
        dir,
        trees: [git.TREE({ ref: commitHash1 }), git.TREE({ ref: commitHash2 })],
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
                    path: path.join(dir, ensureOSPath(filepath)),
                    status: type,
                };
            }
        },
    });
}
export async function getStatus(dir, ref) {
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
    const statusMatrix = await git.statusMatrix({ fs, dir, ref });
    const unstaged = statusMatrix
        .filter((row) => [
        [0, 2, 0],
        [0, 0, 3],
        [0, 2, 3],
        [1, 2, 1],
        [1, 0, 3],
        [1, 1, 3],
        [1, 2, 3],
        [1, 1, 0],
        [1, 2, 0],
        [1, 0, 1], // deleted, unstaged
    ].some((a) => a.every((val, index) => val === row.slice(1)[index])))
        .map((row) => path.join(dir, ensureOSPath(row[0])));
    debug({ unstaged });
    const gitlines = statusMatrix
        .filter((row) => ![
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 3],
        [0, 2, 0],
        [1, 1, 3], // modified, staged, with unstaged original file
    ].some((a) => a.every((val, index) => val === row.slice(1)[index])))
        .map((row) => ({
        path: path.join(dir, ensureOSPath(row[0])),
        status: getStatusText(row.slice(1)),
    }));
    return gitlines;
}
function ensureOSPath(fpath) {
    return fpath.split(path.posix.sep).join(path.sep);
}
function ensureGitRelPath(dir, fpath) {
    return path.relative(dir, fpath).split(path.sep).join(path.posix.sep);
}
export async function listFullPathFiles(dir, ref) {
    return (await git.listFiles({ fs, dir, ref })).map((p) => path.join(dir, ensureOSPath(p)));
}
export async function getOid(dir, ref) {
    return ref ? git.resolveRef({ fs, dir, ref }) : '';
}
export async function readBlobAsBuffer(dir, oid, filename) {
    return Buffer.from((await git.readBlob({ fs, dir, oid, filepath: ensureGitRelPath(dir, filename) })).blob);
}
//# sourceMappingURL=git-extra.js.map