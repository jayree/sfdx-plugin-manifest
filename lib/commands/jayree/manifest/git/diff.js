/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { join, dirname, relative } from 'path';
import path from 'path';
import { flags } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import kit from '@salesforce/kit';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand.js';
import { getGitResults, createVirtualTreeContainer, fixComponentSetChilds, getGitDiff, debug, ensureOSPath, getGitArgsFromArgv, } from '../../../../utils/gitdiff.js';
Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');
const logger = new Logger({ useIcons: false });
// eslint-disable-next-line @typescript-eslint/require-await
const unexpectedArgument = async (input) => {
    if (input.includes('-')) {
        throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
    }
    return input;
};
export default class GitDiff extends JayreeSfdxCommand {
    async run() {
        const sourcepath = this.getFlag('sourcepath');
        this.destructiveChangesOnly = this.getFlag('destructivechangesonly');
        this.outputDir = this.getFlag('outputdir');
        this.projectRoot = this.project.getPath();
        this.sfdxProjectFolders = this.project.getPackageDirectories().map((p) => ensureOSPath(p.path));
        this.sourceApiVersion = (await this.project.retrieveSfProjectJson()).getContents().sourceApiVersion;
        this.destructiveChanges = join(this.outputDir, 'destructiveChanges.xml');
        this.manifest = join(this.outputDir, 'package.xml');
        debug({
            outputDir: this.outputDir,
            projectRoot: this.projectRoot,
            sfdxProjectFolders: this.sfdxProjectFolders,
        });
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(this.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        const gitArgs = await getGitArgsFromArgv(this.args.ref1, this.args.ref2, this.argv, this.projectRoot);
        debug({ gitArgs });
        const tasks = new Listr([
            {
                title: 'Analyze sfdx-project',
                task: (ctx, task) => {
                    task.output = `packageDirectories: ${this.sfdxProjectFolders.length} sourceApiVersion: ${this.sourceApiVersion}`;
                },
                options: { persistentOutput: true },
            },
            {
                title: `Execute 'git --no-pager diff --name-status --no-renames ${gitArgs.refString}'`,
                task: async (ctx, task) => {
                    this.gitLines = await getGitDiff(this.sfdxProjectFolders, gitArgs.ref1, gitArgs.ref2, this.projectRoot);
                    task.output = `Changed files: ${this.gitLines.length}`;
                },
                options: { persistentOutput: true },
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
                        title: gitArgs.ref2 !== '' ? `ref2: ${gitArgs.ref2}` : `ref2: (staging area)`,
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
                            if (!this.ref1VirtualTreeContainer.exists(filepath) &&
                                !this.ref2VirtualTreeContainer.exists(filepath)) {
                                throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
                            }
                            return path.resolve(filepath);
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
                        title: relative(this.projectRoot, this.manifest),
                        skip: () => !this.componentSet.getTypesOfDestructiveChanges().length || !this.isOutputEnabled,
                        task: async () => {
                            await fs.ensureDir(dirname(this.manifest));
                            await fs.writeFile(this.manifest, await this.componentSet.getPackageXml());
                        },
                        options: { persistentOutput: true },
                    },
                    {
                        title: relative(this.projectRoot, this.destructiveChanges),
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
}
GitDiff.description = messages.getMessage('commandDescription');
GitDiff.examples = messages.getMessage('examples').split(os.EOL);
GitDiff.args = [
    {
        name: 'ref1',
        required: true,
        description: 'base commit or branch',
        parse: unexpectedArgument,
        hidden: false,
    },
    {
        name: 'ref2',
        required: false,
        description: 'commit or branch to compare to the base commit',
        parse: unexpectedArgument,
        hidden: false,
    },
];
GitDiff.flagsConfig = {
    sourcepath: flags.array({
        char: 'p',
        description: messages.getMessage('sourcepath'),
    }),
    outputdir: flags.string({
        char: 'o',
        description: messages.getMessage('outputdir'),
        default: '',
    }),
    destructivechangesonly: flags.boolean({
        char: 'd',
        description: messages.getMessage('destructivechangesonly'),
        default: false,
    }),
};
GitDiff.requiresUsername = false;
GitDiff.supportsDevhubUsername = false;
GitDiff.requiresProject = true;
//# sourceMappingURL=diff.js.map