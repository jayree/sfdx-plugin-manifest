/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import {
  ComponentSet,
  RegistryAccess,
  MetadataResolver,
  SourceComponent,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { SfProject, SfError } from '@salesforce/core';
import fs from 'fs-extra';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import equal from 'fast-deep-equal';
import Debug from 'debug';
import { resolveMultiRefString, resolveSingleRefString, getFileState, getStatus } from '../utils/git-extra.js';
import { VirtualTreeContainerExtra } from './treeContainersExtra.js';

export const debug = Debug('sf:gitDiff:resolver');

const registryAccess = new RegistryAccess();

/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export class GitDiffResolver {
  private ref1VirtualTreeContainer: VirtualTreeContainerExtra;
  private ref2VirtualTreeContainer: VirtualTreeContainerExtra;
  private ref1Resolver: MetadataResolver;
  private ref2Resolver: MetadataResolver;

  private static async getFileStatus(
    ref1: string,
    ref2: string,
    dir: string,
    resolveSourcePaths: string[]
  ): Promise<Array<{ path: string; status: string }>> {
    let files: Array<{ path: string; status: string }>;

    if (ref2) {
      files = (await getFileState(ref1, ref2, dir)).filter((l) => resolveSourcePaths.some((f) => l.path.startsWith(f)));
    } else {
      files = await getStatus(dir, ref1);
      files = files.filter((l) => resolveSourcePaths.some((f) => l.path.startsWith(f)));
    }

    files = files.filter((file) => {
      if (file.status === 'D') {
        for (const sourcePath of resolveSourcePaths) {
          const defaultFolder = path.join(sourcePath, 'main', 'default');
          const filePath = file.path.replace(file.path.startsWith(defaultFolder) ? defaultFolder : sourcePath, '');
          const target = files.find((t) => t.path.endsWith(filePath) && t.status === 'A');
          if (target) {
            return false;
          }
        }
      }
      return true;
    });
    return files;
  }

  public async resolve(ref1: string, ref2: string, fsPaths: string[]): Promise<ComponentSet> {
    const proj = await SfProject.resolve();

    if (ref2 === undefined) {
      const { ref1: r1, ref2: r2 } = await resolveMultiRefString({ ref: ref1, dir: proj.getPath(), fs });
      ref1 = r1;
      ref2 = r2;
    } else {
      const [r1, r2] = await Promise.all([
        resolveSingleRefString({ ref: ref1, dir: proj.getPath(), fs }),
        resolveSingleRefString({ ref: ref2, dir: proj.getPath(), fs }),
      ]);
      ref1 = r1;
      ref2 = r2;
    }

    debug({ ref1, ref2 });

    const fileStatus = await GitDiffResolver.getFileStatus(ref1, ref2, proj.getPath(), fsPaths);
    debug({ fileStatus });

    const [ref1VirtualTreeContainer, ref2VirtualTreeContainer] = await Promise.all([
      VirtualTreeContainerExtra.fromGitRef(
        ref1,
        proj.getPath(),
        fileStatus.filter((l) => l.status === 'M').map((l) => l.path)
      ),
      VirtualTreeContainerExtra.fromGitRef(
        ref2,
        proj.getPath(),
        fileStatus.filter((l) => l.status === 'M').map((l) => l.path)
      ),
    ]);

    this.ref1VirtualTreeContainer = ref1VirtualTreeContainer;

    this.ref2VirtualTreeContainer = ref2VirtualTreeContainer;

    fsPaths = fsPaths.map((filepath) => {
      filepath = path.resolve(filepath);
      if (!this.ref1VirtualTreeContainer.exists(filepath) && !this.ref2VirtualTreeContainer.exists(filepath)) {
        throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
      }
      return filepath;
    });

    debug({ fsPaths });

    this.ref1Resolver = new MetadataResolver(registryAccess, this.ref1VirtualTreeContainer);
    this.ref2Resolver = new MetadataResolver(registryAccess, this.ref2VirtualTreeContainer);

    return this.getComponentSet(fileStatus, fsPaths);
  }

  private async getComponentSet(
    gitLines: Array<{ path: string; status: string }>,
    fsPaths: string[]
  ): Promise<ComponentSet> {
    const results = new ComponentSet(undefined, registryAccess);

    const childComponentPromises: Array<
      Promise<{
        path: string;
        status: number;
        toManifest?: SourceComponent[];
        toDestructiveChanges?: SourceComponent[];
      }>
    > = [];

    for (const [, { status, path: fpath }] of gitLines.entries()) {
      if (!fsPaths || fsPaths.some((fsPath) => path.resolve(fpath).startsWith(fsPath))) {
        if (status === 'D') {
          for (const c of this.ref1Resolver.getComponentsFromPath(fpath)) {
            // if the component supports partial delete AND there are files that are not deleted,
            // set the component for deploy, not for delete.
            if (!!c.type.supportsPartialDelete && c.content && this.ref2VirtualTreeContainer.exists(c.content)) {
              // all bundle types have a directory name
              try {
                this.ref2Resolver
                  .getComponentsFromPath(path.resolve(c.content))
                  .filter(
                    (input: SourceComponent | undefined): input is SourceComponent => input instanceof SourceComponent
                  )
                  .map((nonDeletedComponent) => {
                    results.add(nonDeletedComponent);
                  });
              } catch (e) {
                debug(`unable to find component at ${c.content}.  That's ok if it was supposed to be deleted`);
              }
            } else {
              results.add(c, DestructiveChangesType.POST);
            }
          }
        } else if (status === 'A') {
          for (const c of this.ref2Resolver.getComponentsFromPath(fpath)) {
            results.add(c);
          }
        } else {
          childComponentPromises.push(this.getChildComponentStatus(fpath));
        }
      }
    }

    for await (const check of childComponentPromises) {
      if (check.status === 0) {
        for (const c of this.ref2Resolver.getComponentsFromPath(check.path)) {
          results.add(c);
        }
      } else if (check.status === -1) {
        // unchanged file
      } else {
        for (const c of check.toDestructiveChanges) {
          results.add(c, DestructiveChangesType.POST);
        }
        for (const c of check.toManifest) {
          results.add(c);
        }
      }
    }

    debug({
      forceIgnoredPaths: {
        ref1: Array.from(this.ref1Resolver.forceIgnoredPaths),
        ref2: Array.from(this.ref2Resolver.forceIgnoredPaths),
      },
    });

    return results;
  }

  private async getChildComponentStatus(fpath: string): Promise<{
    path: string;
    status: number;
    toManifest?: SourceComponent[];
    toDestructiveChanges?: SourceComponent[];
  }> {
    if (!parseMetadataXml(fpath)) {
      return { path: fpath, status: 0 };
    }

    const [ref2Component] = this.ref2Resolver.getComponentsFromPath(fpath); // git path only conaints files
    const [ref1Component] = this.ref1Resolver.getComponentsFromPath(fpath); // git path only conaints files

    if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
      return { path: fpath, status: -1 };
    }

    if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
      return { path: fpath, status: 0 };
    }

    const getUniqueIdentifier = (component: SourceComponent): string =>
      `${component.type.name}#${component[component.type.uniqueIdElement] as string}`;

    const ref2ChildUniqueIdArray = ref2Component
      .getChildren()
      .map((childComponent) => getUniqueIdentifier(childComponent));
    const ref1ChildUniqueIdArray = ref1Component
      .getChildren()
      .map((childComponent) => getUniqueIdentifier(childComponent));

    const childComponentsNotInRef2 = ref1Component
      .getChildren()
      .filter((childComponent) => !ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // deleted
    const childComponentsNotInRef1 = ref2Component
      .getChildren()
      .filter((childComponent) => !ref1ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // added
    const childComponentsInRef1AndRef2 = ref1Component
      .getChildren()
      .filter((childComponent) => ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // modified?

    for await (const childComponentRef1 of childComponentsInRef1AndRef2) {
      const [childComponentRef2] = ref2Component
        .getChildren()
        .filter((childComponent) => getUniqueIdentifier(childComponentRef1) === getUniqueIdentifier(childComponent));
      if (!equal(await childComponentRef1.parseXml(), await childComponentRef2.parseXml())) {
        childComponentsNotInRef1.push(childComponentRef2); // modified! -> add to added
      }
    }

    return {
      path: fpath,
      status: 1 + childComponentsNotInRef2.length + childComponentsNotInRef1.length,
      toManifest: childComponentsNotInRef1,
      toDestructiveChanges: childComponentsNotInRef2,
    };
  }
}
