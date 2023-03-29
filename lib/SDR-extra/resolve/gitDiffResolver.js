/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { ComponentSet, RegistryAccess, MetadataResolver, SourceComponent, DestructiveChangesType, } from '@salesforce/source-deploy-retrieve';
import { SfError, Lifecycle } from '@salesforce/core';
import equal from 'fast-deep-equal';
import Debug from 'debug';
import { getString } from '@salesforce/ts-types';
import { GitRepo } from '../utils/localGitRepo.js';
import { VirtualTreeContainerExtra, parseMetadataXml } from './index.js';
const debug = Debug('sf:gitDiff:resolver');
const registryAccess = new RegistryAccess();
/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export class GitDiffResolver {
    /**
     * @param dir SFDX project directory
     */
    constructor(project) {
        this.gitDir = project.getPath();
        this.uniquePackageDirectories = project.getUniquePackageDirectories().map((pDir) => pDir.fullPath);
        this.localRepo = GitRepo.getInstance({
            gitDir: this.gitDir,
            packageDirs: this.uniquePackageDirectories,
        });
    }
    async resolve(ref1, ref2, fsPaths) {
        if (ref2 === undefined) {
            const { ref1: r1, ref2: r2 } = await this.localRepo.resolveMultiRefString(ref1);
            ref1 = r1;
            ref2 = r2;
        }
        else {
            const [r1, r2] = await Promise.all([
                this.localRepo.resolveSingleRefString(ref1),
                this.localRepo.resolveSingleRefString(ref2),
            ]);
            ref1 = r1;
            ref2 = r2;
        }
        debug({ ref1, ref2 });
        const fileStatus = await this.getFileStatus(ref1, ref2);
        debug({ fileStatus });
        const [ref1VirtualTreeContainer, ref2VirtualTreeContainer] = await Promise.all([
            VirtualTreeContainerExtra.fromGitRef(ref1, this.gitDir, fileStatus.filter((l) => l.status === 'M').map((l) => l.path)),
            VirtualTreeContainerExtra.fromGitRef(ref2, this.gitDir, fileStatus.filter((l) => l.status === 'M').map((l) => l.path)),
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
        this.ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
        this.ref2Resolver = new MetadataResolver(registryAccess, this.ref2VirtualTreeContainer);
        return this.getComponentSet(fileStatus);
    }
    async getFileStatus(ref1, ref2) {
        let files;
        if (ref2) {
            files = (await this.localRepo.getFileState({ ref1, ref2 })).filter((l) => this.uniquePackageDirectories.some((f) => l.path.startsWith(f)));
        }
        else {
            files = await this.localRepo.getStatus(ref1);
        }
        files = files.filter((file) => {
            if (file.status === 'D') {
                for (const sourcePath of this.uniquePackageDirectories) {
                    const defaultFolder = path.join(sourcePath, 'main', 'default');
                    const filePath = file.path.replace(file.path.startsWith(defaultFolder) ? defaultFolder : sourcePath, '');
                    const target = files.find((t) => t.path.endsWith(filePath) && t.status === 'A');
                    // debug({ target, file, sourcePath, filePath });
                    if (target) {
                        return false;
                    }
                }
            }
            return true;
        });
        return files;
    }
    // eslint-disable-next-line complexity
    async getComponentSet(gitLines) {
        const results = new ComponentSet(undefined, registryAccess);
        const childComponentPromises = [];
        for (const [, { status, path: fpath }] of gitLines.entries()) {
            if (status === 'D') {
                for (const c of this.ref1Resolver.getComponentsFromPath(fpath)) {
                    // if the component supports partial delete AND there are files that are not deleted,
                    // set the component for deploy, not for delete.
                    // https://github.com/forcedotcom/source-tracking/blob/5cb32bef2e5860c0f8fc2afa3ea65432fe511a99/src/shared/localComponentSetArray.ts#L81
                    if ((!!c.type.supportsPartialDelete || c.type.name === 'CustomObjectTranslation') &&
                        c.content &&
                        this.ref2VirtualTreeContainer.exists(c.content)) {
                        // all bundle types have a directory name
                        try {
                            this.ref2Resolver
                                .getComponentsFromPath(path.resolve(c.content))
                                .filter((input) => input instanceof SourceComponent)
                                .map((nonDeletedComponent) => {
                                results.add(nonDeletedComponent);
                            });
                        }
                        catch (e) {
                            debug(`unable to find component at ${c.content}.  That's ok if it was supposed to be deleted`);
                        }
                    }
                    else {
                        results.add(c, DestructiveChangesType.POST);
                    }
                }
            }
            else if (status === 'A') {
                for (const c of this.ref2Resolver.getComponentsFromPath(fpath)) {
                    results.add(c);
                }
            }
            else {
                childComponentPromises.push(this.getChildComponentStatus(fpath));
            }
        }
        for await (const check of childComponentPromises) {
            if (check.status === 0) {
                for (const c of this.ref2Resolver.getComponentsFromPath(check.path)) {
                    results.add(c);
                }
            }
            else if (check.status === -1) {
                // unchanged file
            }
            else if (check.status === -2) {
                // forceignored file
            }
            else {
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
        const forceIgnored = Array.from(new Set([...this.ref1Resolver.forceIgnoredPaths, ...this.ref2Resolver.forceIgnoredPaths]));
        for await (const file of forceIgnored) {
            await Lifecycle.getInstance().emitWarning(`The forceignored file "${file}" was ignored.`);
        }
        return results;
    }
    async getChildComponentStatus(fpath) {
        if (!parseMetadataXml(fpath)) {
            return { path: fpath, status: 0 };
        }
        const [ref2Component] = this.ref2Resolver.getComponentsFromPath(fpath); // git path only conaints files
        const [ref1Component] = this.ref1Resolver.getComponentsFromPath(fpath); // git path only conaints files
        if (this.ref1Resolver.forceIgnoredPaths.has(fpath) || this.ref2Resolver.forceIgnoredPaths.has(fpath)) {
            return { path: fpath, status: -2 };
        }
        if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
            return { path: fpath, status: -1 };
        }
        if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
            return { path: fpath, status: 0 };
        }
        const getUniqueIdentifier = (component) => `${component.type.name}#${getString(component, component.type.uniqueIdElement)}`;
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
//# sourceMappingURL=gitDiffResolver.js.map