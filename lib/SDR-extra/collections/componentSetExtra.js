/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ComponentSet, DestructiveChangesType, registry as untypedRegistry, } from '@salesforce/source-deploy-retrieve';
import { SfProject } from '@salesforce/core';
import Debug from 'debug';
import { GitDiffResolver } from '../resolve/gitDiffResolver.js';
export const debug = Debug('sf:gitDiff:ComponentSetExtra');
export class ComponentSetExtra extends ComponentSet {
    static async fromGitDiff(input) {
        let fsPaths;
        let registry;
        let tree;
        let ref1;
        let ref2;
        if (Array.isArray(input)) {
            ref1 = input[0];
            ref2 = input[1];
        }
        else if (typeof input === 'object') {
            if (Array.isArray(input.ref)) {
                ref1 = input.ref[0];
                ref2 = input.ref[1];
            }
            else {
                ref1 = input.ref;
            }
            fsPaths = input.fsPaths;
            registry = input.registry ?? registry;
            tree = input.tree ?? tree;
        }
        else {
            ref1 = input;
        }
        const proj = await SfProject.resolve();
        fsPaths = fsPaths || proj.getUniquePackageDirectories().map((pDir) => pDir.fullPath);
        const gitDiffResolver = new GitDiffResolver();
        const inclusiveFilter = await gitDiffResolver.resolve(ref1, ref2, fsPaths);
        const components = ComponentSet.fromSource({
            fsPaths,
            include: inclusiveFilter,
            tree,
            registry,
        });
        const childsTobeReplacedByParent = [
            ...Object.keys(untypedRegistry.types.workflow.children.types),
            ...Object.keys(untypedRegistry.types.sharingrules.children.types),
            ...Object.keys(untypedRegistry.types.customobjecttranslation.children.types),
            ...Object.keys(untypedRegistry.types.bot.children.types),
        ];
        for (const component of inclusiveFilter.getSourceComponents()) {
            if (component.isMarkedForDelete()) {
                components.add(component, DestructiveChangesType.POST);
            }
            else if (childsTobeReplacedByParent.includes(component.type.id)) {
                debug(`add parent ${component.parent.type.name}:${component.parent.fullName} of ${component.type.name}:${component.fullName} to manifest`);
                components.add(component.parent);
            }
        }
        return components;
    }
}
//# sourceMappingURL=componentSetExtra.js.map