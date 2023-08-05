/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { VirtualTreeContainer, VirtualDirectory } from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import fs from 'graceful-fs';
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
    gitDir: string,
    includeBufferForFiles: string[],
  ): Promise<VirtualTreeContainer> {
    const localRepo = GitRepo.getInstance({ gitDir });

    const paths = await localRepo.listFullPathFiles(ref);
    const oid = await localRepo.getOid(ref);
    const virtualDirectoryByFullPath = new Map<string, VirtualDirectory>();
    for await (const filename of paths) {
      let dirPath = path.dirname(filename);
      virtualDirectoryByFullPath.set(dirPath, {
        dirPath,
        children: Array.from(
          new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
            name: path.basename(filename),
            data:
              parseMetadataXml(filename) && includeBufferForFiles.includes(filename)
                ? oid
                  ? await localRepo.readBlobAsBuffer({ oid, filename })
                  : await fs.promises.readFile(filename)
                : Buffer.from(''),
          }),
        ),
      });
      const splits = filename.split(path.sep);
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
