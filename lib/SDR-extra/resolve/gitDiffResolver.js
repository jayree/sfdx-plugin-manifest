/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { ComponentSet, RegistryAccess, MetadataResolver } from '@salesforce/source-deploy-retrieve';
import { SfError, Lifecycle, Logger } from '@salesforce/core';
import { GitRepo } from '../utils/localGitRepo.js';
import { getComponentSets, getGroupedFiles } from '../utils/gitComponentSetArray.js';
import { VirtualTreeContainerExtra } from '../resolve/treeContainersExtra.js';
const logger = Logger.childFromRoot('gitDiff:resolver');
/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export class GitDiffResolver {
    ref2VirtualTreeContainer;
    ref1Resolver;
    ref2Resolver;
    dir;
    packagesDirs;
    localRepo;
    registry;
    project;
    /**
     * @param dir SFDX project directory
     */
    constructor(project, registry) {
        this.project = project;
        this.dir = project.getPath();
        this.registry = registry ?? new RegistryAccess();
        this.packagesDirs = project.getUniquePackageDirectories();
        this.localRepo = GitRepo.getInstance({
            dir: this.dir,
            packageDirs: this.packagesDirs,
            registry: this.registry,
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
        logger.debug({ ref1, ref2 });
        await this.localRepo.getStatus(ref1, ref2);
        const [ref1VirtualTreeContainer, ref2VirtualTreeContainer] = await Promise.all([
            VirtualTreeContainerExtra.fromGitRef(ref1, this.dir, this.localRepo.getModifyFilenames()),
            VirtualTreeContainerExtra.fromGitRef(ref2, this.dir, this.localRepo.getModifyFilenames()),
        ]);
        if (fsPaths) {
            fsPaths.map((filepath) => {
                filepath = filepath.endsWith(path.sep) && filepath.length > 1 ? filepath.slice(0, -1) : filepath;
                if (!ref1VirtualTreeContainer.exists(filepath) && !ref2VirtualTreeContainer.exists(filepath)) {
                    throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
                }
            });
        }
        this.ref2VirtualTreeContainer = ref2VirtualTreeContainer;
        this.ref1Resolver = new MetadataResolver(this.registry, ref1VirtualTreeContainer);
        this.ref2Resolver = new MetadataResolver(this.registry, this.ref2VirtualTreeContainer);
        const cs = (await this.gitChangesAsComponentSet(false))?.[0] ?? new ComponentSet();
        if (cs.forceIgnoredPaths?.size) {
            const lifecycle = Lifecycle.getInstance();
            for await (const file of cs.forceIgnoredPaths) {
                await lifecycle.emitWarning(`The forceignored file ${file} was ignored.`);
            }
        }
        return cs;
    }
    async gitChangesAsComponentSet(byPackageDir) {
        const [projectConfig] = await Promise.all([
            this.project.resolveProjectConfig(),
        ]);
        const sourceApiVersion = projectConfig.sourceApiVersion;
        const adds = this.localRepo.getAddFilenames();
        const modifies = this.localRepo.getModifyFilenames();
        const deletes = this.localRepo.getDeleteFilenames();
        const groupings = getGroupedFiles({
            packageDirs: this.packagesDirs,
            adds,
            modifies,
            deletes,
        }, byPackageDir ?? Boolean(projectConfig.pushPackageDirectoriesSequentially));
        return getComponentSets({
            groupings,
            sourceApiVersion,
            registry: this.registry,
            resolverForDeletes: this.ref1Resolver,
            resolverForNonDeletes: this.ref2Resolver,
            virtualTreeContainer: this.ref2VirtualTreeContainer,
        });
    }
}
//# sourceMappingURL=gitDiffResolver.js.map