/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join, basename, sep, posix, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'node:util';
import { SfCommand, Flags, arrayWithDeprecation } from '@salesforce/sf-plugins-core';
import { Messages, SfError, SfProject } from '@salesforce/core';
import { Args } from '@oclif/core';
import fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import { env } from '@salesforce/kit';
import { getString } from '@salesforce/ts-types';
import equal from 'fast-deep-equal';
import { ComponentSet, RegistryAccess, registry, VirtualTreeContainer, MetadataResolver, DestructiveChangesType, } from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import Debug from 'debug';
import git from 'isomorphic-git';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');
const logger = new Logger({ useIcons: false });
const debug = Debug('jayree:manifest:git:diff');
const registryAccess = new RegistryAccess();
export default class GitDiff extends SfCommand {
    async run() {
        const { flags, args } = await this.parse(GitDiff);
        const sourcepath = flags['source-dir'];
        this.destructiveChangesOnly = flags['destructive-changes-only'];
        this.outputDir = flags['output-dir'];
        this.projectRoot = this.project.getPath();
        this.sourceApiVersion = (await this.getSourceApiVersion());
        this.destructiveChanges = join(this.outputDir, 'destructiveChanges.xml');
        this.manifest = join(this.outputDir, 'package.xml');
        debug({
            outputDir: this.outputDir,
            projectRoot: this.projectRoot,
        });
        const isContentTypeJSON = env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(this.argv.find((arg) => arg === '--json') ?? isContentTypeJSON);
        const gitArgs = await getGitArgsFromArgv(args.ref1, args.ref2, this.argv, this.projectRoot);
        debug({ gitArgs });
        const tasks = new Listr([
            {
                title: `Execute 'git --no-pager diff --name-status --no-renames ${gitArgs.refString}'`,
                task: async (ctx, task) => {
                    const { gitlines, warnings } = await getGitDiff(gitArgs.ref1, gitArgs.ref2, this.projectRoot);
                    this.gitLines = gitlines;
                    this.outputWarnings = warnings;
                    task.output = `Changed files: ${this.gitLines.length}`;
                },
                options: { persistentOutput: true },
            },
            {
                // title: 'Warning output',
                skip: () => !this.outputWarnings?.length,
                task: (ctx, task) => {
                    debug({ warnings: this.outputWarnings });
                    const moreWarnings = this.outputWarnings.splice(5);
                    for (const message of this.outputWarnings) {
                        task.output = `Warning: unstaged file ${message}`;
                    }
                    task.output = moreWarnings.length ? `... ${moreWarnings.length} more warnings` : '';
                },
                options: { persistentOutput: true, bottomBar: 6 },
            },
            {
                title: 'Create virtual tree container',
                skip: () => !this.gitLines.length,
                task: (ctx, task) => task.newListr([
                    {
                        title: `ref1: ${gitArgs.ref1}`,
                        task: async () => {
                            this.ref1VirtualTreeContainer = await createVirtualTreeContainer(gitArgs.ref1, this.projectRoot, this.gitLines.filter((l) => l.status === 'M').map((l) => l.path));
                        },
                    },
                    {
                        title: gitArgs.ref2 !== '' ? `ref2: ${gitArgs.ref2}` : 'ref2: (staging area)',
                        task: async () => {
                            this.ref2VirtualTreeContainer = await createVirtualTreeContainer(gitArgs.ref2, this.projectRoot, this.gitLines.filter((l) => l.status === 'M').map((l) => l.path));
                        },
                    },
                ], { concurrent: true }),
            },
            {
                title: 'Analyze git diff results',
                skip: () => !this.gitLines.length,
                task: async (ctx, task) => {
                    if (sourcepath) {
                        this.fsPaths = sourcepath.map((filepath) => {
                            filepath = resolve(filepath);
                            if (!this.ref1VirtualTreeContainer.exists(filepath) &&
                                !this.ref2VirtualTreeContainer.exists(filepath)) {
                                throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
                            }
                            return filepath;
                        });
                        debug(`fsPaths: ${this.fsPaths.join(', ')}`);
                    }
                    const { manifest, output } = await getGitResults(this.gitLines, this.ref1VirtualTreeContainer, this.ref2VirtualTreeContainer, this.destructiveChangesOnly, this.fsPaths);
                    task.output = `Added: ${output.counts.added}, Deleted: ${output.counts.deleted}, Modified: ${output.counts.modified}, Unchanged: ${output.counts.unchanged}, Ignored: ${output.counts.ignored}${output.counts.error ? `, Errors: ${output.counts.error}` : ''}`;
                    this.outputErrors = output.errors;
                    debug({ manifest });
                    this.componentSet = fixComponentSetChilds(manifest);
                    this.componentSet.sourceApiVersion = this.sourceApiVersion;
                },
                options: { persistentOutput: true },
            },
            {
                // title: 'Error output',
                skip: () => !this.outputErrors?.length,
                task: (ctx, task) => {
                    debug({ errors: this.outputErrors });
                    const moreErrors = this.outputErrors.splice(5);
                    for (const message of this.outputErrors) {
                        task.output = `Error: ${message}`;
                    }
                    task.output = moreErrors.length ? `... ${moreErrors.length} more errors` : '';
                },
                options: { persistentOutput: true, bottomBar: 6 },
            },
            {
                title: 'Generate manifests',
                skip: () => !this.componentSet?.size,
                task: (ctx, task) => task.newListr([
                    {
                        title: this.manifest,
                        skip: () => !this.isOutputEnabled,
                        task: async () => {
                            await fs.ensureDir(dirname(this.manifest));
                            await fs.writeFile(this.manifest, await this.componentSet.getPackageXml());
                        },
                        options: { persistentOutput: true },
                    },
                    {
                        title: this.destructiveChanges,
                        skip: () => !this.componentSet.getTypesOfDestructiveChanges().length || !this.isOutputEnabled,
                        task: async () => {
                            await fs.ensureDir(dirname(this.destructiveChanges));
                            await fs.writeFile(this.destructiveChanges, await this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST));
                        },
                        options: { persistentOutput: true },
                    },
                ], { concurrent: true }),
            },
        ], {
            rendererOptions: { showTimer: true, collapse: false, lazy: true, collapseErrors: false },
            rendererSilent: !this.isOutputEnabled,
            rendererFallback: debug.enabled,
        });
        try {
            await tasks.run();
            return {
                destructiveChanges: await this.componentSet?.getObject(DestructiveChangesType.POST),
                manifest: await this.componentSet?.getObject(),
            };
        }
        catch (e) {
            if (debug.enabled && this.isOutputEnabled) {
                logger.fail(e.message);
            }
            throw e;
        }
    }
    async getSourceApiVersion() {
        const projectConfig = await this.project.resolveProjectConfig();
        return getString(projectConfig, 'sourceApiVersion') ?? undefined;
    }
}
GitDiff.summary = messages.getMessage('summary');
GitDiff.description = messages.getMessage('description');
GitDiff.examples = messages.getMessages('examples');
GitDiff.args = {
    ref1: Args.string({
        required: true,
        description: messages.getMessage('args.ref1.description'),
    }),
    ref2: Args.string({
        description: messages.getMessage('args.ref2.description'),
    }),
};
GitDiff.requiresProject = true;
GitDiff.flags = {
    'source-dir': arrayWithDeprecation({
        char: 'd',
        summary: messages.getMessage('flags.source-dir.summary'),
        description: messages.getMessage('flags.source-dir.description'),
        deprecateAliases: true,
        aliases: ['sourcepath', 'p'],
    }),
    'output-dir': Flags.directory({
        summary: messages.getMessage('flags.output-dir.summary'),
        description: messages.getMessage('flags.output-dir.description'),
        default: '',
        deprecateAliases: true,
        aliases: ['outputdir', 'o'],
    }),
    'destructive-changes-only': Flags.boolean({
        summary: messages.getMessage('flags.destructive-changes-only.summary'),
        description: messages.getMessage('flags.destructive-changes-only.description'),
        deprecateAliases: true,
        aliases: ['destructivechangesonly'],
    }),
};
async function resolveRef(refOrig, dir) {
    if (refOrig === '') {
        return '';
    }
    const getCommitLog = async (ref) => {
        try {
            const [log] = await git.log({
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
        if (path.startsWith('^')) {
            path = path.substring(1);
            let next = Number(path.substring(0, 1));
            path = next ? path.substring(1) : path;
            next = next ? next : 1;
            // eslint-disable-next-line no-await-in-loop
            ref = (await getCommitLog(ref)).parents[next - 1];
        }
        else if (path.startsWith('~')) {
            path = path.substring(1);
            let next = Number(path.substring(0, 1));
            path = next ? path.substring(1) : path;
            next = next ? next : 1;
            for (let index = 0; index <= next - 1; index++) {
                // eslint-disable-next-line no-await-in-loop
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
            if (argv[0] && !argv[0].includes('-') && ![ref1, ref2].includes(argv[0])) {
                [e] = argv.splice(0, 1);
            }
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
        throw new Error(`Ambiguous ${format('argument%s', argv.length === 1 ? '' : 's')}: ${argv.join(', ')}
See more help with --help`);
    }
    ref1 = await resolveRef(ref1, dir);
    ref2 = await resolveRef(ref2, dir);
    if (a.length === 4) {
        ref1 = (await git.findMergeBase({
            fs,
            dir,
            oids: [ref2, ref1],
        }))[0];
    }
    return { ref1, ref2, refString };
}
function ensureOSPath(path) {
    return path.split(posix.sep).join(sep);
}
function ensureGitRelPath(dir, path) {
    return relative(dir, path).split(sep).join(posix.sep);
}
async function createVirtualTreeContainer(ref, dir, modifiedFiles) {
    const paths = (await git.listFiles({ fs, dir, ref })).map((p) => join(dir, ensureOSPath(p)));
    const oid = ref ? await git.resolveRef({ fs, dir, ref }) : '';
    const virtualDirectoryByFullPath = new Map();
    for await (const filename of paths) {
        let dirPath = dirname(filename);
        virtualDirectoryByFullPath.set(dirPath, {
            dirPath,
            children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
                name: basename(filename),
                data: parseMetadataXml(filename) && modifiedFiles.includes(filename)
                    ? oid
                        ? Buffer.from((await git.readBlob({ fs, dir, oid, filepath: ensureGitRelPath(dir, filename) })).blob)
                        : await fs.readFile(ensureOSPath(filename))
                    : Buffer.from(''),
            })),
        });
        const splits = filename.split(sep);
        for (let i = 1; i < splits.length - 1; i++) {
            dirPath = splits.slice(0, i + 1).join(sep);
            virtualDirectoryByFullPath.set(dirPath, {
                dirPath,
                children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add(splits[i + 1])),
            });
        }
    }
    return new VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
}
async function analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    if (!parseMetadataXml(path)) {
        return { path, status: 0 };
    }
    const ref2resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
    const [ref2Component] = ref2resolver.getComponentsFromPath(path); // git path only conaints files
    const ref1resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
    const [ref1Component] = ref1resolver.getComponentsFromPath(path); // git path only conaints files
    if (ref1resolver.forceIgnoredPaths.has(path) || ref2resolver.forceIgnoredPaths.has(path)) {
        return { path, status: -2 };
    }
    if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
        return { path, status: -1 };
    }
    if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
        return { path, status: 0 };
    }
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
    debug({ childComponentsNotInRef2, childComponentsNotInRef1, childComponentsInRef1AndRef2 });
    for await (const childComponentRef1 of childComponentsInRef1AndRef2) {
        const [childComponentRef2] = ref2Component
            .getChildren()
            .filter((childComponent) => getUniqueIdentifier(childComponentRef1) === getUniqueIdentifier(childComponent));
        if (!equal(await childComponentRef1.parseXml(), await childComponentRef2.parseXml())) {
            childComponentsNotInRef1.push(childComponentRef2); // modified! -> add to added
        }
    }
    debug({ childComponentsNotInRef1 });
    return {
        path,
        status: 1 + childComponentsNotInRef2.length + childComponentsNotInRef1.length,
        toManifest: childComponentsNotInRef1,
        toDestructiveChanges: childComponentsNotInRef2,
    };
}
function getUniqueIdentifier(component) {
    return `${component.type.name}#${getString(component, component.type.uniqueIdElement)}`;
}
async function getFileStateChanges(commitHash1, commitHash2, dir) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return git.walk({
        fs,
        dir,
        trees: [git.TREE({ ref: commitHash1 }), git.TREE({ ref: commitHash2 })],
        async map(filepath, [A, B]) {
            if (filepath === '.' || (await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
                return;
            }
            const Aoid = await A?.oid();
            const Boid = await B?.oid();
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
                    path: join(dir, ensureOSPath(filepath)),
                    status: type,
                };
            }
        },
    });
}
async function getStatusMatrix(dir, ref) {
    const getStatus = (row) => {
        if ([
            [0, 2, 2],
            [0, 2, 3], // added, staged, with unstaged changes
        ].some((a) => a.every((val, index) => val === row[index]))) {
            return 'A';
        }
        if ([
            [1, 0, 0],
            [1, 0, 1],
            [1, 1, 0],
            [1, 2, 0],
            [1, 0, 3], // modified, staged, with unstaged deletion
        ].some((a) => a.every((val, index) => val === row[index]))) {
            return 'D';
        }
        if ([
            [1, 2, 1],
            [1, 2, 2],
            [1, 2, 3], // modified, staged, with unstaged changes
        ].some((a) => a.every((val, index) => val === row[index]))) {
            return 'M';
        }
        return undefined;
    };
    const statusMatrix = await git.statusMatrix({ fs, dir, ref });
    const warnings = statusMatrix
        .filter((row) => [
        [0, 2, 0],
        [0, 0, 3],
        [0, 2, 3],
        [1, 2, 1],
        [1, 0, 3],
        [1, 1, 3],
        [1, 2, 3],
        [1, 1, 0],
        [1, 2, 0],
        [1, 0, 1], // deleted, unstaged
    ].some((a) => a.every((val, index) => val === row.slice(1)[index])))
        .map((row) => join(dir, ensureOSPath(row[0])));
    const gitlines = statusMatrix
        .filter((row) => ![
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 3],
        [0, 2, 0],
        [1, 1, 3], // modified, staged, with unstaged original file
    ].some((a) => a.every((val, index) => val === row.slice(1)[index])))
        .map((row) => ({
        path: join(dir, ensureOSPath(row[0])),
        status: getStatus(row.slice(1)),
    }));
    return { warnings, lines: gitlines };
}
async function getGitDiff(ref1, ref2, dir) {
    let gitlines;
    let warnings = [];
    const proj = await SfProject.resolve();
    const resolveSourcePaths = proj.getUniquePackageDirectories().map((pDir) => pDir.fullPath);
    if (ref2) {
        gitlines = (await getFileStateChanges(ref1, ref2, dir)).filter((l) => resolveSourcePaths.some((f) => l.path.startsWith(f)));
    }
    else {
        const { warnings: warn, lines } = await getStatusMatrix(dir, ref1);
        warnings = warn.filter((l) => resolveSourcePaths.some((f) => l.startsWith(f)));
        gitlines = lines.filter((l) => resolveSourcePaths.some((f) => l.path.startsWith(f)));
    }
    gitlines = gitlines.filter((line) => {
        if (line.status === 'D') {
            for (const sourcePath of resolveSourcePaths) {
                const defaultFolder = join(sourcePath, 'main', 'default');
                const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sourcePath, '');
                const target = gitlines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
                if (target) {
                    debug(`rename: ${line.path} -> ${target.path}`);
                    return false;
                }
            }
        }
        return true;
    });
    debug({ gitlines, warnings });
    return { gitlines, warnings };
}
// eslint-disable-next-line complexity
async function getGitResults(gitLines, ref1VirtualTreeContainer, ref2VirtualTreeContainer, destructiveChangesOnly, fsPaths) {
    const results = {
        manifest: new ComponentSet(undefined, registryAccess),
        output: {
            unchanged: [],
            ignored: { ref1: [], ref2: [] },
            counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
            errors: [],
        },
    };
    const ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
    const ref2Resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
    const getComponentsFromPath = (resolver, path) => {
        let result = [];
        try {
            result = resolver.getComponentsFromPath(path);
        }
        catch (error) {
            results.output.counts.error++;
            results.output.errors.push(error.message);
        }
        return result;
    };
    const analyzedFilesPromises = [];
    for (const [, { status, path }] of gitLines.entries()) {
        if (!fsPaths || fsPaths.some((fsPath) => resolve(path).startsWith(fsPath))) {
            if (status === 'D') {
                for (const c of getComponentsFromPath(ref1Resolver, path)) {
                    if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
                        results.manifest.add(c, DestructiveChangesType.POST);
                        results.output.counts.deleted++;
                    }
                    else {
                        try {
                            if (c.xml) {
                                // in case a binary source file of a bundle was deleted, check if the bundle ist still valid and update instead of delete
                                ref2Resolver.getComponentsFromPath(c.xml);
                            }
                            if (!destructiveChangesOnly) {
                                results.manifest.add(c);
                                results.output.counts.added++;
                            }
                        }
                        catch (error) {
                            results.output.counts.error++;
                            results.output.errors.push(error.message);
                        }
                    }
                }
            }
            else if (status === 'A') {
                if (!destructiveChangesOnly) {
                    for (const c of getComponentsFromPath(ref2Resolver, path)) {
                        results.manifest.add(c);
                        results.output.counts.added++;
                    }
                }
            }
            else {
                analyzedFilesPromises.push(analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer));
            }
        }
        else {
            debug(`${path} not included in sourcepath`);
        }
    }
    for await (const check of analyzedFilesPromises) {
        if (check.status === 0) {
            if (!destructiveChangesOnly) {
                for (const c of getComponentsFromPath(ref2Resolver, check.path)) {
                    results.manifest.add(c);
                    results.output.counts.modified++;
                }
            }
        }
        else if (check.status === -1) {
            results.output.unchanged.push(check.path);
            results.output.counts.unchanged++;
        }
        else if (check.status === -2) {
            results.output.counts.ignored++;
            results.output.ignored.ref2.push(check.path);
        }
        else {
            if ((check.toDestructiveChanges && check.toDestructiveChanges.length > 0) ||
                (check.toManifest && check.toManifest.length > 0 && !destructiveChangesOnly)) {
                results.output.counts.modified++;
            }
            if (check.toDestructiveChanges) {
                for (const c of check.toDestructiveChanges) {
                    results.manifest.add(c, DestructiveChangesType.POST);
                }
            }
            if (!destructiveChangesOnly && check.toManifest) {
                for (const c of check.toManifest) {
                    results.manifest.add(c);
                }
            }
        }
    }
    results.output.ignored = {
        ref1: Array.from(ref1Resolver.forceIgnoredPaths),
        ref2: results.output.ignored.ref2.concat(Array.from(ref2Resolver.forceIgnoredPaths)),
    };
    results.output.counts.ignored =
        results.output.counts.ignored + ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;
    return results;
}
function fixComponentSetChilds(cs) {
    let sourceComponents = cs.getSourceComponents();
    // SDR library is more strict and avoids fixes like this
    const childsTobeReplacedByParent = [
        ...Object.keys(registry.types.workflow.children?.types ?? {}),
        ...Object.keys(registry.types.sharingrules.children?.types ?? {}),
        ...Object.keys(registry.types.customobjecttranslation.children?.types ?? {}),
        ...Object.keys(registry.types.bot.children?.types ?? {}),
    ];
    sourceComponents = sourceComponents.map((component) => {
        if (!component.isMarkedForDelete() && childsTobeReplacedByParent.includes(component.type.id) && component.parent) {
            debug(`replace: ${component.type.name}:${component.fullName} -> ${component.parent.type.name}:${component.parent.fullName}`);
            return component.parent;
        }
        return component;
    });
    return new ComponentSet(sourceComponents, registryAccess);
}
//# sourceMappingURL=diff.js.map