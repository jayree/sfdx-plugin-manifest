"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const os = require("os");
const path_1 = require("path");
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = require("fs-extra");
const listr2_1 = require("listr2");
const kit = require("@salesforce/kit");
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const jayreeSfdxCommand_1 = require("../../../../jayreeSfdxCommand");
const gitdiff_1 = require("../../../../utils/gitdiff");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');
const logger = new listr2_1.Logger({ useIcons: false });
// workaround until listr2 can catch emitWarnings with v4.0
// eslint-disable-next-line @typescript-eslint/unbound-method
const original = process.emitWarning;
process.emitWarning = (warning) => {
    process.once('beforeExit', () => {
        return original(warning);
    });
};
const unexpectedArgument = (input) => {
    if (input.includes('-')) {
        throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
    }
    return input;
};
class GitDiff extends jayreeSfdxCommand_1.JayreeSfdxCommand {
    async run() {
        var _a, _b;
        this.outputDir = this.getFlag('outputdir');
        this.projectRoot = this.project.getPath();
        this.sfdxProjectFolders = this.project.getPackageDirectories().map((p) => (0, gitdiff_1.ensureOSPath)(p.path));
        this.sourceApiVersion = (await this.project.retrieveSfdxProjectJson()).getContents().sourceApiVersion;
        this.destructiveChanges = (0, path_1.join)(this.projectRoot, this.outputDir, 'destructiveChanges.xml');
        this.manifest = (0, path_1.join)(this.projectRoot, this.outputDir, 'package.xml');
        (0, gitdiff_1.debug)({
            outputDir: this.outputDir,
            projectRoot: this.projectRoot,
            sfdxProjectFolders: this.sfdxProjectFolders,
        });
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        const gitArgs = await (0, gitdiff_1.getGitArgsFromArgv)(this.args.ref1, this.args.ref2, this.argv, this.projectRoot);
        (0, gitdiff_1.debug)({ gitArgs });
        const tasks = new listr2_1.Listr([
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
                    this.gitLines = await (0, gitdiff_1.getGitDiff)(this.sfdxProjectFolders, gitArgs.ref1, gitArgs.ref2, this.projectRoot);
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
                            this.ref1VirtualTreeContainer = await (0, gitdiff_1.createVirtualTreeContainer)(gitArgs.ref1, this.projectRoot, this.gitLines.filter((l) => l.status === 'M').map((l) => l.path));
                        },
                    },
                    {
                        title: gitArgs.ref2 !== '' ? `ref2: ${gitArgs.ref2}` : undefined,
                        task: async () => {
                            this.ref2VirtualTreeContainer =
                                gitArgs.ref2 !== ''
                                    ? await (0, gitdiff_1.createVirtualTreeContainer)(gitArgs.ref2, this.projectRoot, this.gitLines.filter((l) => l.status === 'M').map((l) => l.path))
                                    : new source_deploy_retrieve_1.NodeFSTreeContainer();
                        },
                    },
                ], { concurrent: true }),
            },
            {
                title: 'Analyze git diff results',
                skip: () => !this.gitLines.length,
                task: async (ctx, task) => {
                    const { manifest, output } = await (0, gitdiff_1.getGitResults)(this.gitLines, this.ref1VirtualTreeContainer, this.ref2VirtualTreeContainer);
                    task.output = `Added: ${output.counts.added}, Deleted: ${output.counts.deleted}, Modified: ${output.counts.modified}, Unchanged: ${output.counts.unchanged}, Ignored: ${output.counts.ignored}${output.counts.error ? `, Errors: ${output.counts.error}` : ''}`;
                    this.outputErrors = output.errors;
                    (0, gitdiff_1.debug)({ manifest });
                    this.componentSet = (0, gitdiff_1.fixComponentSetChilds)(manifest);
                    this.componentSet.sourceApiVersion = this.sourceApiVersion;
                },
                options: { persistentOutput: true },
            },
            {
                // title: 'Error output',
                skip: () => !(this.outputErrors && this.outputErrors.length),
                task: (ctx, task) => {
                    (0, gitdiff_1.debug)({ errors: this.outputErrors });
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
                skip: () => !(this.componentSet && this.componentSet.size),
                task: (ctx, task) => task.newListr([
                    {
                        title: (0, path_1.relative)(this.projectRoot, this.manifest),
                        task: async () => {
                            await fs.ensureDir((0, path_1.dirname)(this.manifest));
                            await fs.writeFile(this.manifest, this.componentSet.getPackageXml());
                        },
                        options: { persistentOutput: true },
                    },
                    {
                        title: (0, path_1.relative)(this.projectRoot, this.destructiveChanges),
                        skip: () => !this.componentSet.getTypesOfDestructiveChanges().length,
                        task: async () => {
                            await fs.ensureDir((0, path_1.dirname)(this.destructiveChanges));
                            await fs.writeFile(this.destructiveChanges, this.componentSet.getPackageXml(undefined, source_deploy_retrieve_1.DestructiveChangesType.POST));
                        },
                        options: { persistentOutput: true },
                    },
                ], { concurrent: true }),
            },
        ], {
            rendererOptions: { showTimer: true, collapse: false, lazy: true, collapseErrors: false },
            rendererSilent: !this.isOutputEnabled,
            rendererFallback: gitdiff_1.debug.enabled,
        });
        try {
            await tasks.run();
            return {
                destructiveChanges: (_a = this.componentSet) === null || _a === void 0 ? void 0 : _a.getObject(source_deploy_retrieve_1.DestructiveChangesType.POST),
                manifest: (_b = this.componentSet) === null || _b === void 0 ? void 0 : _b.getObject(),
            };
        }
        catch (e) {
            if (gitdiff_1.debug.enabled && this.isOutputEnabled) {
                logger.fail(e.message);
            }
            throw e;
        }
    }
}
exports.default = GitDiff;
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
    outputdir: command_1.flags.string({
        char: 'o',
        description: messages.getMessage('outputdir'),
        default: '',
    }),
};
GitDiff.requiresUsername = false;
GitDiff.supportsDevhubUsername = false;
GitDiff.requiresProject = true;
//# sourceMappingURL=diff.js.map