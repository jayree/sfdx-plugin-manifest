/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import {
  ComponentSet,
  OptionalTreeRegistryOptions,
  TreeContainer,
  DestructiveChangesType,
  RegistryAccess,
  registry as untypedRegistry,
} from '@salesforce/source-deploy-retrieve';
import { SfProject } from '@salesforce/core';
import Debug from 'debug';
import fs from 'fs-extra';
import { GitDiffResolver } from '../resolve/gitDiffResolver.js';

export const debug = Debug('sf:gitDiff:ComponentSetExtra');

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
    let fsPaths: string[];
    let registry: RegistryAccess;
    let tree: TreeContainer;
    let ref1: string | string[];
    let ref2: string;

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

    const gitDiffResolver = new GitDiffResolver(project, fs);
    const inclusiveFilter = await gitDiffResolver.resolve(ref1, ref2, fsPaths);

    const childsTobeReplacedByParent = [
      ...Object.keys(untypedRegistry.types.workflow.children.types),
      ...Object.keys(untypedRegistry.types.sharingrules.children.types),
      ...Object.keys(untypedRegistry.types.customobjecttranslation.children.types),
      ...Object.keys(untypedRegistry.types.bot.children.types),
    ];

    for (const component of inclusiveFilter.getSourceComponents()) {
      if (childsTobeReplacedByParent.includes(component.type.id)) {
        debug(
          `add parent ${component.parent.type.name}:${component.parent.fullName} of ${component.type.name}:${component.fullName} to manifest`
        );
        inclusiveFilter.add(component.parent);
      }
    }

    fsPaths =
      fsPaths?.map((filepath) => path.resolve(filepath)).filter((filepath) => fs.existsSync(filepath)) ||
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

    for (const component of inclusiveFilter.getSourceComponents()) {
      if (
        !components
          .getSourceComponents()
          .find(
            (localComponent) =>
              !!localComponent
                .getChildren()
                .find(
                  (localChild) =>
                    `${component.type.name}:${component.fullName}` === `${localChild.type.name}:${localChild.fullName}`
                ) ||
              `${component.type.name}:${component.fullName}` ===
                `${localComponent.type.name}:${localComponent.fullName}`
          )
      ) {
        debug(`${component.type.name}:${component.fullName} is missing locally`);
      }
    }

    return components;
  }
}
