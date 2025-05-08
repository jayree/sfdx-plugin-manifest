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
// https://github.com/forcedotcom/source-deploy-retrieve/blob/main/src/resolve/treeContainers.ts
import path from 'node:path';
import { VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import { Performance } from '@oclif/core/performance';
import { GitRepo } from '../shared/local/localGitRepo.js';
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
        const marker = Performance.mark('@jayree/sfdx-plugin-manifest', 'VirtualTreeContainerExtra.fromGitRef');
        const localRepo = GitRepo.getInstance({ dir });
        const paths = await localRepo.listFiles(ref);
        const oid = await localRepo.resolveRef(ref);
        const virtualDirectoryByFullPath = new Map();
        // eslint-disable-next-line @typescript-eslint/await-thenable
        for await (const filepath of paths) {
            let dirPath = path.dirname(filepath);
            virtualDirectoryByFullPath.set(dirPath, {
                dirPath,
                children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
                    name: path.basename(filepath),
                    data: parseMetadataXml(filepath) && includeBufferForFiles.includes(filepath)
                        ? await localRepo.readBlob(filepath, oid)
                        : Buffer.from(''),
                })),
            });
            const splits = filepath.split(path.sep);
            for (let i = 0; i < splits.length - 1; i++) {
                dirPath = splits.slice(0, i + 1).join(path.sep);
                virtualDirectoryByFullPath.set(dirPath, {
                    dirPath,
                    children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add(splits[i + 1])),
                });
            }
        }
        marker?.stop();
        return new VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
    }
}
//# sourceMappingURL=treeContainersExtra.js.map