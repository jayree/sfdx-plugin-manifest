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
// https://github.com/forcedotcom/source-deploy-retrieve/blob/main/src/resolve/treeContainers.ts
import { sep } from 'node:path';
import { VirtualTreeContainer, VirtualDirectory, VirtualFile } from '@salesforce/source-deploy-retrieve';
import { isString } from '@salesforce/ts-types';
import { GitRepo } from '../shared/local/localGitRepo.js';

export class VirtualTreeContainerExtra extends VirtualTreeContainer {
  /**
   * Designed for recreating virtual files from file paths and their buffer content
   * This was created to support use of MetadataResolver with git diff results where the modified files and their content can be provided but the files don't actually exist on the filesystem
   *
   * @param paths full paths to files
   * @param fileBufferByPath map of file paths to their buffer content
   * @returns VirtualTreeContainer
   */
  public static fromFilePathsWithBlobs(paths: string[], fileBufferByPath: Map<string, Buffer>): VirtualTreeContainer {
    const childrenByDir = new Map<string, Set<string>>();
    for (const filename of paths) {
      if (!isString(filename)) {
        continue;
      }
      const splits = filename.split(sep);
      for (let i = 0; i < splits.length - 1; i++) {
        // slice+join preserves the leading separator for absolute paths
        // e.g. ['', 'home'].join('/') === '/home'
        const dirPath = splits.slice(0, i + 1).join(sep);
        let childSet = childrenByDir.get(dirPath);
        if (!childSet) {
          childSet = new Set<string>();
          childrenByDir.set(dirPath, childSet);
        }
        childSet.add(splits[i + 1]);
      }
    }

    const virtualFs: VirtualDirectory[] = Array.from(childrenByDir.entries()).map(([dirPath, set]) => ({
      dirPath,
      children: Array.from(set).map((childName): VirtualFile | string => {
        const fullPath = [dirPath, childName].filter(Boolean).join(sep);
        const buffer = fileBufferByPath.get(fullPath);

        return buffer
          ? {
              name: childName,
              data: buffer,
            }
          : childName;
      }),
    }));

    return new VirtualTreeContainer(virtualFs);
  }

  /**
   * Designed for recreating virtual files from a git ref
   * This was created to support use of MetadataResolver with git diff results where the modified files and their content can be provided but the files don't actually exist on the filesystem
   *
   * @param ref git ref
   * @param dir git dir
   * @param includeBufferForFiles full paths to modified files
   * @returns VirtualTreeContainer
   */
  public static async fromGitRef(
    ref: string,
    dir: string,
    includeBufferForFiles: string[],
  ): Promise<VirtualTreeContainer> {
    const localRepo = GitRepo.getInstance({ dir });
    const paths = await localRepo.listFiles(ref);
    const oid = await localRepo.resolveRef(ref);

    const fileBufferByPath = new Map(
      await Promise.all(
        includeBufferForFiles.map(async (filePath) => [filePath, await localRepo.readBlob(filePath, oid)] as const),
      ),
    );

    return VirtualTreeContainerExtra.fromFilePathsWithBlobs(paths, fileBufferByPath);
  }
}
