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
import path from 'node:path';
import { ComponentSet, TreeContainer, RegistryAccess, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { SfProject, Lifecycle, Logger } from '@salesforce/core';
import fs from 'graceful-fs';
import { GitDiffResolver } from '../resolve/gitDiffResolver.js';
import { FromGitDiffOptions } from './types.js';

const logger = Logger.childFromRoot('gitDiff:ComponentSetExtra');

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

    fsPaths = fsPaths?.map((filepath) => path.resolve(filepath));

    const gitDiffResolver = new GitDiffResolver(project, registry);
    const gitDiffResult = await gitDiffResolver.resolve(ref1, ref2, fsPaths);

    const include = new ComponentSet([], registry);
    const markedForDelete = new ComponentSet([], registry);

    const sourceBehaviorOptions = project.getSfProjectJson().get<string[]>('sourceBehaviorOptions'); // can be removed as soon as sourceBehaviorOptions becomes available in the default registry

    const childsTobeReplacedByParent = [];

    if (!sourceBehaviorOptions?.includes('decomposeWorkflowBeta')) {
      childsTobeReplacedByParent.push(...Object.keys(registry.getTypeByName('workflow').children?.types ?? {}));
    }

    if (!sourceBehaviorOptions?.includes('decomposeSharingRulesBeta')) {
      childsTobeReplacedByParent.push(...Object.keys(registry.getTypeByName('sharingrules').children?.types ?? {}));
    }

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
      fsPaths?.filter((filepath) => fs.existsSync(filepath)) ??
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
    // eslint-disable-next-line @typescript-eslint/await-thenable
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
