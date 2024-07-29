/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import { readBlob as _readBlob, listFiles as _listFiles, resolveRef } from 'isomorphic-git';
import { ensureWindows, IS_WINDOWS } from '@salesforce/source-tracking/lib/shared/local/functions.js';
import { dirToRelativePosixPath } from '../utils/functions.js';
export { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
export class VirtualTreeContainerExtra extends VirtualTreeContainer {
    /**
     * Designed for recreating virtual files from a git ref
     * To support use of MetadataResolver to also resolve metadata xmls file names can be provided
     *
     * @param ref git ref
     * @param dir git dir
     * @param includeBufferForFiles full paths to modified files
     * @returns VirtualTreeContainer
     */
    static async fromGitRef(ref, dir, includeBufferForFiles) {
        const paths = await listFiles(dir, ref);
        const oid = ref ? await resolveRef({ fs, dir, ref }) : '';
        const virtualDirectoryByFullPath = new Map();
        for await (const filepath of paths) {
            let dirPath = path.dirname(filepath);
            virtualDirectoryByFullPath.set(dirPath, {
                dirPath,
                children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
                    name: path.basename(filepath),
                    data: parseMetadataXml(filepath) && includeBufferForFiles.includes(filepath)
                        ? await readBlob(dir, filepath, oid)
                        : Buffer.from(''),
                })),
            });
            const splits = filepath.split(path.sep);
            for (let i = 1; i < splits.length - 1; i++) {
                dirPath = splits.slice(0, i + 1).join(path.sep);
                virtualDirectoryByFullPath.set(dirPath, {
                    dirPath,
                    children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add(splits[i + 1])),
                });
            }
        }
        return new VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
    }
}
async function listFiles(dir, ref) {
    return ref
        ? (await _listFiles({ fs, dir, ref })).map((p) => path.join(dir, IS_WINDOWS ? ensureWindows(p) : p))
        : (await fs.readdir(dir, { recursive: true })).map((p) => path.join(dir, IS_WINDOWS ? ensureWindows(p) : p));
}
async function readBlob(dir, filepath, oid) {
    return oid
        ? Buffer.from((await _readBlob({
            fs,
            dir,
            oid,
            filepath: dirToRelativePosixPath(dir, filepath),
        })).blob)
        : fs.readFile(filepath);
}
//# sourceMappingURL=treeContainersExtra.js.map