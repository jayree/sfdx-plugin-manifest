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
  DestructiveChangesType,
  RegistryAccess,
  SourceComponent,
} from '@salesforce/source-deploy-retrieve';
import { SfProject, Lifecycle } from '@salesforce/core';
import Debug from 'debug';
import fs from 'graceful-fs';
import { GitDiffResolver } from '../resolve/index.js';

const debug = Debug('sf:gitDiff:ComponentSetExtra');

export interface FromGitDiffOptions extends OptionalTreeRegistryOptions {
  /**
   * Git ref to resolve components against
   */
  ref: string | string[];
  /**
   * File paths or directory paths to resolve components against
   */
  fsPaths?: string[];
}

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

    const gitDiffResolver = new GitDiffResolver(project);
    const inclusiveFilter = await gitDiffResolver.resolve(ref1, ref2, fsPaths);

    const childsTobeReplacedByParent = [
      ...Object.keys(registry.getTypeByName('workflow').children?.types ?? {}),
      ...Object.keys(registry.getTypeByName('sharingrules').children?.types ?? {}),
      ...Object.keys(registry.getTypeByName('bot').children?.types ?? {}),
    ];

    for (const component of inclusiveFilter.getSourceComponents()) {
      if (
        !component.isMarkedForDelete() &&
        component.parent &&
        childsTobeReplacedByParent.includes(component.type.id)
      ) {
        debug(
          `add parent ${component.parent.type.name}:${component.parent.fullName} of ${component.type.name}:${component.fullName} to manifest`,
        );
        inclusiveFilter.add(component.parent);
      }
    }

    fsPaths =
      fsPaths?.map((filepath) => path.resolve(filepath)).filter((filepath) => fs.existsSync(filepath)) ??
      project.getUniquePackageDirectories().map((pDir) => pDir.fullPath);

    debug({ fsPaths });

    const components = ComponentSet.fromSource({
      fsPaths,
      include: inclusiveFilter,
      tree,
      registry,
    });

    for (const component of inclusiveFilter.getSourceComponents()) {
      if (component.isMarkedForDelete()) {
        components.add(component, DestructiveChangesType.POST);
      }
    }

    let localSourceComponents: SourceComponent[] = [];

    for (const localComponent of components.getSourceComponents()) {
      localSourceComponents = localSourceComponents.concat(localComponent.getChildren());
      localSourceComponents = localSourceComponents.concat(localComponent);
    }

    for await (const component of inclusiveFilter.getSourceComponents()) {
      if (
        !localSourceComponents.find(
          (localComponent) =>
            component.type.name === localComponent.type.name && component.fullName === localComponent.fullName,
        )
      ) {
        await Lifecycle.getInstance().emitWarning(
          `The component "${component.type.name}:${component.fullName}" was not found locally.`,
        );
      }
    }

    return components;
  }
}
