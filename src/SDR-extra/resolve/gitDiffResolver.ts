/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import {
  ComponentSet,
  RegistryAccess,
  MetadataResolver,
  SourceComponent,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { SfProject, SfError, Lifecycle, Logger, NamedPackageDir } from '@salesforce/core';
import equal from 'fast-deep-equal';
import { getString } from '@salesforce/ts-types';
import { GitRepo } from '../utils/localGitRepo.js';
import { VirtualTreeContainerExtra, parseMetadataXml } from './index.js';

const logger = Logger.childFromRoot('gitDiff:resolver');

/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export class GitDiffResolver {
  private ref2VirtualTreeContainer!: VirtualTreeContainerExtra;
  private ref1Resolver!: MetadataResolver;
  private ref2Resolver!: MetadataResolver;
  private dir: string;
  private uniquePackageDirectories: NamedPackageDir[];
  private localRepo: GitRepo;
  private registry: RegistryAccess;

  /**
   * @param dir SFDX project directory
   */
  public constructor(project: SfProject, registry?: RegistryAccess) {
    this.dir = project.getPath();
    this.registry = registry ?? new RegistryAccess();
    this.uniquePackageDirectories = project.getUniquePackageDirectories();
    this.localRepo = GitRepo.getInstance({
      dir: this.dir,
      packageDirs: this.uniquePackageDirectories,
      registry: this.registry,
    });
  }

  public async resolve(ref1: string, ref2: string | undefined, fsPaths: string[] | undefined): Promise<ComponentSet> {
    if (ref2 === undefined) {
      const { ref1: r1, ref2: r2 } = await this.localRepo.resolveMultiRefString(ref1);
      ref1 = r1;
      ref2 = r2;
    } else {
      const [r1, r2] = await Promise.all([
        this.localRepo.resolveSingleRefString(ref1),
        this.localRepo.resolveSingleRefString(ref2),
      ]);
      ref1 = r1;
      ref2 = r2;
    }

    logger.debug({ ref1, ref2 });

    await this.localRepo.getStatus(ref1, ref2);

    const [ref1VirtualTreeContainer, ref2VirtualTreeContainer] = await Promise.all([
      VirtualTreeContainerExtra.fromGitRef(
        ref1,
        this.dir,
        this.localRepo.getModifyFilenames(),
        this.uniquePackageDirectories,
        this.registry,
      ),
      VirtualTreeContainerExtra.fromGitRef(
        ref2,
        this.dir,
        this.localRepo.getModifyFilenames(),
        this.uniquePackageDirectories,
        this.registry,
      ),
    ]);

    if (fsPaths) {
      fsPaths.map((filepath) => {
        filepath = path.resolve(filepath);
        if (!ref1VirtualTreeContainer.exists(filepath) && !ref2VirtualTreeContainer.exists(filepath)) {
          throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
        }
      });
    }

    this.ref2VirtualTreeContainer = ref2VirtualTreeContainer;
    this.ref1Resolver = new MetadataResolver(this.registry, ref1VirtualTreeContainer);
    this.ref2Resolver = new MetadataResolver(this.registry, this.ref2VirtualTreeContainer);

    return this.getComponentSet();
  }

  // eslint-disable-next-line complexity
  private async getComponentSet(): Promise<ComponentSet> {
    const results = new ComponentSet(undefined, this.registry);

    const childComponentPromises: Array<
      Promise<{
        path: string;
        status: number;
        toManifest?: SourceComponent[];
        toDestructiveChanges?: SourceComponent[];
      }>
    > = [];

    this.localRepo.getDeleteFilenames().forEach((fpath) => {
      for (const c of this.ref1Resolver.getComponentsFromPath(fpath)) {
        // if the component supports partial delete AND there are files that are not deleted,
        // set the component for deploy, not for delete.
        // https://github.com/forcedotcom/source-tracking/blob/5cb32bef2e5860c0f8fc2afa3ea65432fe511a99/src/shared/localComponentSetArray.ts#L81
        if (
          (!!c.type.supportsPartialDelete || c.type.name === 'CustomObjectTranslation') &&
          c.content &&
          this.ref2VirtualTreeContainer.exists(c.content)
        ) {
          // all bundle types have a directory name
          try {
            this.ref2Resolver
              .getComponentsFromPath(path.resolve(c.content))
              .filter(
                (input: SourceComponent | undefined): input is SourceComponent => input instanceof SourceComponent,
              )
              .map((nonDeletedComponent) => {
                results.add(nonDeletedComponent);
              });
          } catch (e) {
            logger.debug(`unable to find component at ${c.content}.  That's ok if it was supposed to be deleted`);
          }
        } else {
          results.add(c, DestructiveChangesType.POST);
        }
      }
    });

    this.localRepo.getAddFilenames().forEach((fpath) => {
      for (const c of this.ref2Resolver.getComponentsFromPath(fpath)) {
        results.add(c);
      }
    });

    this.localRepo.getModifyFilenames().forEach((fpath) => {
      childComponentPromises.push(this.getChildComponentStatus(fpath));
    });

    for await (const check of childComponentPromises) {
      if (check.status === 0) {
        for (const c of this.ref2Resolver.getComponentsFromPath(check.path)) {
          results.add(c);
        }
      } else if (check.status === -1) {
        // unchanged file
      } else if (check.status === -2) {
        // forceignored file
      } else {
        if (check.toDestructiveChanges) {
          for (const c of check.toDestructiveChanges) {
            results.add(c, DestructiveChangesType.POST);
          }
        }
        if (check.toManifest) {
          for (const c of check.toManifest) {
            results.add(c);
          }
        }
      }
    }

    const forceIgnored = Array.from(
      new Set([...this.ref1Resolver.forceIgnoredPaths, ...this.ref2Resolver.forceIgnoredPaths]),
    );

    const lifecycle = Lifecycle.getInstance();
    for await (const file of forceIgnored) {
      await lifecycle.emitWarning(`The forceignored file ${path.relative(this.dir, file)} was ignored.`);
    }

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

    if (this.ref1Resolver.forceIgnoredPaths.has(fpath) || this.ref2Resolver.forceIgnoredPaths.has(fpath)) {
      return { path: fpath, status: -2 };
    }

    if (equal(await ref1Component.parseXml(fpath), await ref2Component.parseXml(fpath))) {
      return { path: fpath, status: -1 };
    }

    if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
      return { path: fpath, status: 0 };
    }

    const getUniqueIdentifier = (component: SourceComponent): string =>
      `${component.type.name}#${getString(component, component.type.uniqueIdElement as string) as string}`;

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
