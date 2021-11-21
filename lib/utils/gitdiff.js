"use strict";
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixComponentSetChilds = exports.getGitResults = exports.getGitDiff = exports.analyzeFile = exports.createVirtualTreeContainer = exports.ensureGitPath = exports.ensureOSPath = exports.getGitArgsFromArgv = exports.debug = void 0;
const path_1 = require("path");
const util = require("util");
const fs = require("fs-extra");
const equal = require("fast-deep-equal");
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const utils_1 = require("@salesforce/source-deploy-retrieve/lib/src/utils");
const debug_1 = require("debug");
const isomorphic_git_1 = require("isomorphic-git");
exports.debug = (0, debug_1.debug)('jayree:manifest:git:diff');
const registryAccess = new source_deploy_retrieve_1.RegistryAccess();
async function resolveRef(refOrig, dir) {
    if (refOrig === '') {
        return '';
    }
    const getCommitLog = async (ref) => {
        try {
            const [log] = await isomorphic_git_1.default.log({
                fs,
                dir,
                ref,
                depth: 1,
            });
            return { oid: log.oid, parents: log.commit.parent };
        }
        catch (error) {
            throw new Error(`ambiguous argument '${ref}': unknown revision or path not in the working tree.
See more help with --help`);
        }
    };
    if (!['~', '^'].some((el) => refOrig.includes(el))) {
        return (await getCommitLog(refOrig)).oid;
    }
    const firstIndex = [refOrig.indexOf('^'), refOrig.indexOf('~')]
        .filter((a) => a >= 0)
        .reduce((a, b) => Math.min(a, b));
    let path = refOrig.substring(firstIndex);
    let ref = refOrig.substring(0, firstIndex);
    while (path.length && ref !== undefined) {
        if (path.substring(0, 1) === '^') {
            path = path.substring(1);
            let next = Number(path.substring(0, 1));
            path = next ? path.substring(1) : path;
            next = next ? next : 1;
            ref = (await getCommitLog(ref)).parents[next - 1];
        }
        else if (path.substring(0, 1) === '~') {
            path = path.substring(1);
            let next = Number(path.substring(0, 1));
            path = next ? path.substring(1) : path;
            next = next ? next : 1;
            for (let index = 0; index <= next - 1; index++) {
                ref = (await getCommitLog(ref)).parents[0];
            }
        }
        else {
            ref = undefined;
        }
    }
    if (ref === undefined) {
        throw new Error(`ambiguous argument '${refOrig}': unknown revision or path not in the working tree.`);
    }
    return ref;
}
async function getGitArgsFromArgv(ref1, ref2, argv, dir) {
    const newArgv = [];
    while (argv.length) {
        let [e] = argv.splice(0, 1);
        if (e.includes('=')) {
            // skip parameter=value
        }
        else if (e.includes('-')) {
            // remove value
            [e] = argv.splice(0, 1);
        }
        else {
            newArgv.push(e);
        }
    }
    argv = newArgv;
    let refString = ref1;
    const a = argv.join('.').split('.');
    if ((a.length === 3 || a.length === 4) && typeof ref2 === 'undefined') {
        ref1 = a[0];
        ref2 = a[a.length - 1];
    }
    else if (a.length === 2 && typeof ref2 !== 'undefined') {
        refString = `${ref1}..${ref2}`;
    }
    else if (a.length === 1) {
        ref2 = '';
    }
    else {
        throw new Error(`Ambiguous ${util.format('argument%s', argv.length === 1 ? '' : 's')}: ${argv.join(', ')}
See more help with --help`);
    }
    ref1 = await resolveRef(ref1, dir);
    ref2 = await resolveRef(ref2, dir);
    if (a.length === 4) {
        ref1 = (await isomorphic_git_1.default.findMergeBase({
            fs,
            dir,
            oids: [ref2, ref1],
        }))[0];
    }
    return { ref1, ref2, refString };
}
exports.getGitArgsFromArgv = getGitArgsFromArgv;
function ensureOSPath(path) {
    return path.split(path_1.posix.sep).join(path_1.sep);
}
exports.ensureOSPath = ensureOSPath;
function ensureGitPath(path) {
    return path.split(path_1.sep).join(path_1.posix.sep);
}
exports.ensureGitPath = ensureGitPath;
async function createVirtualTreeContainer(ref, dir, modifiedFiles) {
    var _a, _b, _c, _d;
    const paths = (await isomorphic_git_1.default.listFiles({ fs, dir, ref })).map((p) => ensureOSPath(p));
    const oid = await isomorphic_git_1.default.resolveRef({ fs, dir, ref });
    const virtualDirectoryByFullPath = new Map();
    for (const filename of paths) {
        let dirPath = (0, path_1.dirname)(filename);
        virtualDirectoryByFullPath.set(dirPath, {
            dirPath,
            children: Array.from(new Set((_b = (_a = virtualDirectoryByFullPath.get(dirPath)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : []).add({
                name: (0, path_1.basename)(filename),
                data: (0, utils_1.parseMetadataXml)(filename) && modifiedFiles.includes(filename)
                    ? Buffer.from((await isomorphic_git_1.default.readBlob({ fs, dir, oid, filepath: ensureGitPath(filename) })).blob)
                    : Buffer.from(''),
            })),
        });
        const splits = filename.split(path_1.sep);
        for (let i = 0; i < splits.length - 2; i++) {
            dirPath = splits.slice(0, i + 1).join(path_1.sep);
            virtualDirectoryByFullPath.set(dirPath, {
                dirPath,
                children: Array.from(new Set((_d = (_c = virtualDirectoryByFullPath.get(dirPath)) === null || _c === void 0 ? void 0 : _c.children) !== null && _d !== void 0 ? _d : []).add(splits[i + 1])),
            });
        }
    }
    return new source_deploy_retrieve_1.VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
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
    const ref2ChildUniqueIdArray = ref2Component.getChildren().map((childComponent) => {
        return getUniqueIdentifier(childComponent);
    });
    const ref1ChildUniqueIdArray = ref1Component.getChildren().map((childComponent) => {
        return getUniqueIdentifier(childComponent);
    });
    const childComponentsNotInRef2 = ref1Component
        .getChildren()
        .filter((childComponent) => !ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // deleted
    const childComponentsNotInRef1 = ref2Component
        .getChildren()
        .filter((childComponent) => !ref1ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // added
    const childComponentsInRef1AndRef2 = ref1Component
        .getChildren()
        .filter((childComponent) => ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // modified?
    (0, exports.debug)({ childComponentsNotInRef2, childComponentsNotInRef1, childComponentsInRef1AndRef2 });
    for (const childComponentRef1 of childComponentsInRef1AndRef2) {
        const [childComponentRef2] = ref2Component
            .getChildren()
            .filter((childComponent) => getUniqueIdentifier(childComponentRef1) === getUniqueIdentifier(childComponent));
        if (!equal(await childComponentRef1.parseXml(), await childComponentRef2.parseXml())) {
            childComponentsNotInRef1.push(childComponentRef2); // modified! -> add to added
        }
    }
    (0, exports.debug)({ childComponentsNotInRef1 });
    return {
        status: childComponentsNotInRef2.length + childComponentsNotInRef1.length,
        toManifest: childComponentsNotInRef1,
        toDestructiveChanges: childComponentsNotInRef2,
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
    gitLines = gitLines.filter((line) => {
        if (line.status === 'D') {
            for (const sfdxFolder of sfdxProjectFolders) {
                const defaultFolder = (0, path_1.join)(sfdxFolder, 'main', 'default');
                const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
                const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
                if (target) {
                    (0, exports.debug)(`rename: ${line.path} -> ${target.path}`);
                    return false;
                }
            }
        }
        return true;
    });
    (0, exports.debug)({ gitLines });
    return gitLines;
}
exports.getGitDiff = getGitDiff;
async function getGitResults(gitLines, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    const results = {
        manifest: new source_deploy_retrieve_1.ComponentSet(undefined, registryAccess),
        output: {
            unchanged: [],
            ignored: { ref1: [], ref2: [] },
            counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
            errors: [],
        },
    };
    const ref1Resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref1VirtualTreeContainer);
    const ref2Resolver = new source_deploy_retrieve_1.MetadataResolver(registryAccess, ref2VirtualTreeContainer);
    for (const [, { status, path }] of gitLines.entries()) {
        if (status === 'D') {
            for (const c of ref1Resolver.getComponentsFromPath(path)) {
                if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
                    results.manifest.add(c, source_deploy_retrieve_1.DestructiveChangesType.POST);
                    results.output.counts.deleted++;
                }
                else {
                    try {
                        // in case a binary source file of a bundle was deleted, check if the bundle ist still valid and update instead of delete
                        ref2Resolver.getComponentsFromPath(c.xml);
                        results.manifest.add(c);
                        results.output.counts.added++;
                    }
                    catch (error) {
                        results.output.counts.error++;
                        results.output.errors.push(error);
                    }
                }
            }
        }
        else if (status === 'A') {
            for (const c of ref2Resolver.getComponentsFromPath(path)) {
                results.manifest.add(c);
                results.output.counts.added++;
            }
        }
        else {
            const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
            if (check.status === 0) {
                for (const c of ref2Resolver.getComponentsFromPath(path)) {
                    results.manifest.add(c);
                    results.output.counts.added++;
                }
            }
            else if (check.status === -1) {
                results.output.unchanged.push(path);
                results.output.counts.unchanged++;
            }
            else {
                results.output.counts.modified++;
                for (const c of check.toDestructiveChanges) {
                    results.manifest.add(c, source_deploy_retrieve_1.DestructiveChangesType.POST);
                }
                for (const c of check.toManifest) {
                    results.manifest.add(c);
                }
            }
        }
    }
    results.output.ignored = {
        ref1: Array.from(ref1Resolver.forceIgnoredPaths),
        ref2: Array.from(ref2Resolver.forceIgnoredPaths),
    };
    results.output.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;
    return results;
}
exports.getGitResults = getGitResults;
function fixComponentSetChilds(cs) {
    let sourceComponents = cs.getSourceComponents();
    // SDR library is more strict and avoids fixes like this
    const childsTobeReplacedByParent = [
        ...Object.keys(source_deploy_retrieve_1.registry.types.workflow.children.types),
        ...Object.keys(source_deploy_retrieve_1.registry.types.sharingrules.children.types),
    ];
    sourceComponents = sourceComponents.map((component) => {
        if (!component.isMarkedForDelete() && childsTobeReplacedByParent.includes(component.type.id)) {
            (0, exports.debug)(`replace: ${component.type.name}:${component.fullName} -> ${component.parent.type.name}:${component.parent.fullName}`);
            return component.parent;
        }
        return component;
    });
    return new source_deploy_retrieve_1.ComponentSet(sourceComponents.toArray().sort((a, b) => {
        if (a.type.name === b.type.name) {
            return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
        }
        return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
    }), registryAccess);
}
exports.fixComponentSetChilds = fixComponentSetChilds;
//# sourceMappingURL=gitdiff.js.map