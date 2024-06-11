/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import {
  ComponentSet,
  OptionalTreeRegistryOptions,
  TreeContainer,
  RegistryAccess,
  SourceComponent,
} from '@salesforce/source-deploy-retrieve';
import { SfProject, Lifecycle, Logger } from '@salesforce/core';
import fs from 'graceful-fs';
import { GitDiffResolver } from '../resolve/index.js';

const logger = Logger.childFromRoot('gitDiff:ComponentSetExtra');

export type FromGitDiffOptions = {
  /**
   * Git ref to resolve components against
   */
  ref: string | string[];
  /**
   * File paths or directory paths to resolve components against
   */
  fsPaths?: string[];
} & OptionalTreeRegistryOptions;

export class ComponentSetExtra extends ComponentSet {
  /**
   * Resolve metadata components from git diff <ref> HEAD.
   *
   * @param ref Git ref to resolve components against HEAD
   * @returns ComponentSet of source resolved components
   */
  public static fromGitDiff(ref: string): Promise<ComponentSet>;
  /**
   * Resolve metadata components from git diff <ref1> <ref2>.
   *
   * @param refs Git refs to resolve components against
   * @returns ComponentSet of source resolved components
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  public static fromGitDiff(refs: string[]): Promise<ComponentSet>;
  /**
   * Resolve metadata components from git diff.
   * Customize the resolution process using an options object, such as specifying filters
   * and resolving against a different file system abstraction (see {@link TreeContainer}).
   *
   * @param options
   * @returns ComponentSet of source resolved components
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  public static async fromGitDiff(options: FromGitDiffOptions): Promise<ComponentSet>;
  public static async fromGitDiff(input: string | string[] | FromGitDiffOptions): Promise<ComponentSet> {
    let fsPaths: string[] | undefined;
    let registry = new RegistryAccess();
    let tree: TreeContainer | undefined;
    let ref1: string | string[];
    let ref2: string | undefined;

    if (Array.isArray(input)) {
      ref1 = input[0];
      ref2 = input[1];
    } else if (typeof input === 'object') {
      if (Array.isArray(input.ref)) {
        ref1 = input.ref[0];
        ref2 = input.ref[1];
      } else {
        ref1 = input.ref;
      }
      fsPaths = input.fsPaths;
      registry = input.registry ?? registry;
      tree = input.tree ?? tree;
    } else {
      ref1 = input;
    }

    const project = await SfProject.resolve();

    const gitDiffResolver = new GitDiffResolver(project, registry);
    const gitDiffResult = await gitDiffResolver.resolve(ref1, ref2, fsPaths);

    const include = new ComponentSet([], registry);
    const markedForDelete = new ComponentSet([], registry);

    const childsTobeReplacedByParent = [
      ...Object.keys(registry.getTypeByName('workflow').children?.types ?? {}),
      ...Object.keys(registry.getTypeByName('sharingrules').children?.types ?? {}),
      ...Object.keys(registry.getTypeByName('bot').children?.types ?? {}),
    ];

    for (const component of gitDiffResult.getSourceComponents()) {
      if (!component.isMarkedForDelete()) {
        if (component.parent && childsTobeReplacedByParent.includes(component.type.id)) {
          logger.debug(
            `add parent ${component.parent.type.name}:${component.parent.fullName} of ${component.type.name}:${component.fullName} to manifest`,
          );
          include.add(component.parent);
        }
        include.add(component);
      } else {
        markedForDelete.add(component, component.getDestructiveChangesType());
      }
    }

    fsPaths =
      fsPaths?.map((filepath) => path.resolve(filepath)).filter((filepath) => fs.existsSync(filepath)) ??
      project.getUniquePackageDirectories().map((pDir) => pDir.fullPath);

    logger.debug({ fsPaths });

    const components = ComponentSet.fromSource({
      fsPaths,
      include,
      tree,
      registry,
    });

    for (const component of markedForDelete.getSourceComponents()) {
      components.add(component, component.getDestructiveChangesType());
    }

    let localSourceComponents: SourceComponent[] = [];

    for (const localComponent of components.getSourceComponents()) {
      localSourceComponents = localSourceComponents.concat(localComponent.getChildren());
      localSourceComponents = localSourceComponents.concat(localComponent);
    }

    const lifecycle = Lifecycle.getInstance();
    for await (const component of include.getSourceComponents()) {
      if (
        !localSourceComponents.find(
          (localComponent) =>
            component.type.name === localComponent.type.name && component.fullName === localComponent.fullName,
        )
      ) {
        await lifecycle.emitWarning(
          `The component "${component.type.name}:${component.fullName}" was not found locally.`,
        );
      }
    }

    return components;
  }
}
