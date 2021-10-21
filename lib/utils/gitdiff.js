"use strict";
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildManifestComponentSet = exports.getGitResults = exports.getGitDiff = exports.analyzeFile = exports.createVirtualTreeContainer = exports.ensureGitPath = exports.ensureOSPath = exports.debug = exports.NodeFSTreeContainer = void 0;
const path_1 = require("path");
const fs = require("fs-extra");
const equal = require("fast-deep-equal");
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const utils_1 = require("@salesforce/source-deploy-retrieve/lib/src/utils");
const debug_1 = require("debug");
const isomorphic_git_1 = require("isomorphic-git");
exports.NodeFSTreeContainer = source_deploy_retrieve_1.NodeFSTreeContainer;
exports.debug = (0, debug_1.debug)('jayree:manifest:git:diff');
const registryAccess = new source_deploy_retrieve_1.RegistryAccess();
function ensureOSPath(path) {
    return path.split(path_1.posix.sep).join(path_1.sep);
}
exports.ensureOSPath = ensureOSPath;
function ensureGitPath(path) {
    return path.split(path_1.sep).join(path_1.posix.sep);
}
exports.ensureGitPath = ensureGitPath;
async function createVirtualTreeContainer(ref, dir, modifiedFiles) {
    const paths = (await isomorphic_git_1.default.listFiles({ fs, dir, ref })).map((p) => ensureOSPath(p));
    const virtualFsSet = new Map();
    (0, exports.debug)({ modifiedFiles });
    for (const path of paths) {
        let dirOrFilePath = path;
        while (dirOrFilePath !== (0, path_1.dirname)(dirOrFilePath)) {
            const fileOrFolderName = (0, path_1.basename)(dirOrFilePath);
            dirOrFilePath = (0, path_1.dirname)(dirOrFilePath);
            if (!virtualFsSet.has(dirOrFilePath)) {
                virtualFsSet.set(dirOrFilePath, new Set());
            }
            if (path.endsWith(fileOrFolderName)) {
                const data = (0, utils_1.parseMetadataXml)(path) && modifiedFiles.includes(path)
                    ? Buffer.from((await isomorphic_git_1.default.readBlob({
                        fs,
                        dir,
                        oid: await isomorphic_git_1.default.resolveRef({ fs, dir, ref }),
                        filepath: ensureGitPath(path),
                    })).blob)
                    : Buffer.from('');
                virtualFsSet.get(dirOrFilePath).add({ name: fileOrFolderName, data });
            }
            else {
                virtualFsSet.get(dirOrFilePath).add(fileOrFolderName);
            }
        }
    }
    const virtualFs = [];
    for (const [dirPath, childSet] of virtualFsSet) {
        virtualFs.push({ dirPath, children: [...childSet] });
    }
    return new source_deploy_retrieve_1.VirtualTreeContainer(virtualFs);
}
exports.createVirtualTreeContainer = createVirtualTreeContainer;
async function analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    if (!(0, utils_1.parseMetadataXml)(path)) {
        return { status: 0 };
    }
    const ref2resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref2VirtualTreeContainer);
    const [ref2Component] = ref2resolver.getComponentsFromPath(path); // git path only conaints files
    const ref1resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref1VirtualTreeContainer);
    const [ref1Component] = ref1resolver.getComponentsFromPath(path); // git path only conaints files
    if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
        return { status: -1 };
    }
    if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
        return { status: 0 };
    }
    const SourceComponentNotInSource = ref1Component.getChildren().filter((x) => !ref2Component
        .getChildren()
        .map((f) => {
        return getUniqueIdentifier(f);
    })
        .includes(getUniqueIdentifier(x))); // deleted
    const SourceComponentNotInTarget = ref2Component.getChildren().filter((x) => !ref1Component
        .getChildren()
        .map((f) => {
        return getUniqueIdentifier(f);
    })
        .includes(getUniqueIdentifier(x))); // added
    const SourceComponentInSourceAndTarget = ref1Component.getChildren().filter((x) => ref2Component
        .getChildren()
        .map((f) => {
        return getUniqueIdentifier(f);
    })
        .includes(getUniqueIdentifier(x))); // modified?
    (0, exports.debug)({ SourceComponentNotInSource, SourceComponentNotInTarget, SourceComponentInSourceAndTarget });
    for (const x of SourceComponentInSourceAndTarget) {
        const [y] = ref2Component.getChildren().filter((f) => getUniqueIdentifier(x) === getUniqueIdentifier(f));
        if (!equal(await x.parseXml(), await y.parseXml())) {
            SourceComponentNotInTarget.push(y); // modified! -> add to added
        }
    }
    (0, exports.debug)({ SourceComponentNotInTarget });
    return {
        status: SourceComponentNotInSource.length + SourceComponentNotInTarget.length,
        toManifest: SourceComponentNotInTarget,
        toDestructiveChanges: SourceComponentNotInSource,
    };
}
exports.analyzeFile = analyzeFile;
function getUniqueIdentifier(component) {
    return `${component.type.name}#${component[component.type.uniqueIdElement]}`;
}
async function getFileStateChanges(commitHash1, commitHash2, dir) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return isomorphic_git_1.default.walk({
        fs,
        dir,
        trees: [isomorphic_git_1.default.TREE({ ref: commitHash1 }), commitHash2 ? isomorphic_git_1.default.TREE({ ref: commitHash2 }) : isomorphic_git_1.default.STAGE()],
        async map(filepath, [A, B]) {
            if (filepath === '.' || (await (A === null || A === void 0 ? void 0 : A.type())) === 'tree' || (await (B === null || B === void 0 ? void 0 : B.type())) === 'tree') {
                return;
            }
            const Aoid = await (A === null || A === void 0 ? void 0 : A.oid());
            const Boid = await (B === null || B === void 0 ? void 0 : B.oid());
            let type = 'EQ';
            if (Aoid !== Boid) {
                type = 'M';
            }
            if (Aoid === undefined) {
                type = 'A';
            }
            if (Boid === undefined) {
                type = 'D';
            }
            if (type !== 'EQ') {
                return {
                    path: filepath,
                    status: type,
                };
            }
        },
    });
}
async function getGitDiff(sfdxProjectFolders, ref1, ref2, dir) {
    let gitLines = (await getFileStateChanges(ref1, ref2, dir))
        .map((line) => {
        return { path: ensureOSPath(line.path), status: line.status };
    })
        .filter((l) => sfdxProjectFolders.some((f) => {
        return l.path.startsWith(f);
    }));
    const renames = [];
    gitLines = gitLines.filter((line) => {
        if (line.status === 'D') {
            for (const sfdxFolder of sfdxProjectFolders) {
                const defaultFolder = (0, path_1.join)(sfdxFolder, 'main', 'default');
                const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
                const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
                if (target) {
                    renames.push({ from: line.path, to: target.path });
                    return false;
                }
            }
        }
        return true;
    });
    (0, exports.debug)({ gitLines, renames, sfdxProjectFolders });
    return gitLines;
}
exports.getGitDiff = getGitDiff;
async function getGitResults(gitLines, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    const results = {
        manifest: new source_deploy_retrieve_1.ComponentSet(undefined, registryAccess),
        destructiveChanges: new source_deploy_retrieve_1.ComponentSet(undefined, registryAccess),
        unchanged: [],
        ignored: { ref1: [], ref2: [] },
        counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
        errors: [],
    };
    const ref1Resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref1VirtualTreeContainer);
    const ref2Resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref2VirtualTreeContainer);
    for (const [, { status, path }] of gitLines.entries()) {
        if (status === 'D') {
            for (const c of ref1Resolver.getComponentsFromPath(path)) {
                if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
                    results.destructiveChanges.add(c, source_deploy_retrieve_1.DestructiveChangesType.POST);
                    results.counts.deleted++;
                }
                else {
                    try {
                        ref2Resolver.getComponentsFromPath(c.xml);
                        results.manifest.add(c);
                        results.counts.added++;
                    }
                    catch (error) {
                        results.counts.error++;
                        results.errors.push(error);
                    }
                }
            }
        }
        else if (status === 'A') {
            for (const c of ref2Resolver.getComponentsFromPath(path)) {
                results.manifest.add(c);
                results.counts.added++;
            }
        }
        else {
            const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
            if (check.status === 0) {
                for (const c of ref2Resolver.getComponentsFromPath(path)) {
                    results.manifest.add(c);
                    results.counts.added++;
                }
            }
            else if (check.status === -1) {
                results.unchanged.push(path);
                results.counts.unchanged++;
            }
            else {
                results.counts.modified++;
                for (const c of check.toDestructiveChanges) {
                    results.destructiveChanges.add(c, source_deploy_retrieve_1.DestructiveChangesType.POST);
                }
                for (const c of check.toManifest) {
                    results.manifest.add(c);
                }
            }
        }
    }
    results.ignored = {
        ref1: Array.from(ref1Resolver.forceIgnoredPaths),
        ref2: Array.from(ref2Resolver.forceIgnoredPaths),
    };
    results.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;
    return results;
}
exports.getGitResults = getGitResults;
function buildManifestComponentSet(cs, forDestructiveChanges = false) {
    // SDR library is more strict and avoids fixes like this
    if (!forDestructiveChanges) {
        // const missingParents = cs.find((c) => ['CustomFieldTranslation'].includes(c.type.name))?.parent;
        // if (missingParents) {
        //   debug({ missingParents });
        //   cs.add(missingParents);
        // }
        const childsTobeReplacedByParent = [
            ...Object.keys(source_deploy_retrieve_1.registry.types.workflow.children.types),
            ...Object.keys(source_deploy_retrieve_1.registry.types.sharingrules.children.types),
        ];
        return new source_deploy_retrieve_1.ComponentSet(cs.map((component) => {
            if (childsTobeReplacedByParent.includes(component.type.id)) {
                return component.parent;
            }
            return component;
        }), registryAccess);
    }
    return cs;
}
exports.buildManifestComponentSet = buildManifestComponentSet;
//# sourceMappingURL=gitdiff.js.map