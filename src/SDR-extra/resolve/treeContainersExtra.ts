/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { VirtualTreeContainer, VirtualDirectory, RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import { NamedPackageDir } from '@salesforce/core';
import { GitRepo } from '../utils/index.js';

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
  public static async fromGitRef(
    ref: string,
    dir: string,
    includeBufferForFiles: string[],
    packageDirs: NamedPackageDir[],
    registry: RegistryAccess,
  ): Promise<VirtualTreeContainer> {
    const localRepo = GitRepo.getInstance({ dir, packageDirs, registry });

    const paths = await localRepo.listFullPathFiles(ref);
    const oid = await localRepo.getOid(ref);
    const virtualDirectoryByFullPath = new Map<string, VirtualDirectory>();
    for await (const filepath of paths) {
      let dirPath = path.dirname(filepath);
      virtualDirectoryByFullPath.set(dirPath, {
        dirPath,
        children: Array.from(
          new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
            name: path.basename(filepath),
            data:
              parseMetadataXml(filepath) && includeBufferForFiles.includes(filepath)
                ? oid
                  ? await localRepo.readBlobAsBuffer({ oid, filepath })
                  : await fs.readFile(filepath)
                : Buffer.from(''),
          }),
        ),
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
