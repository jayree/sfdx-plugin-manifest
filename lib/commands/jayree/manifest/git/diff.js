/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { SfCommand, Flags, orgApiVersionFlagWithDeprecations, arrayWithDeprecation } from '@salesforce/sf-plugins-core';
import { Args } from '@oclif/core';
import { getString } from '@salesforce/ts-types';
import { ComponentSetExtra } from '../../../../SDR-extra/index.js';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');
export default class GitDiffCommand extends SfCommand {
    static summary = messages.getMessage('summary');
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static args = {
        ref1: Args.string({
            required: true,
            description: messages.getMessage('args.ref1.description'),
        }),
        ref2: Args.string({
            description: messages.getMessage('args.ref2.description'),
        }),
    };
    static requiresProject = true;
    static deprecateAliases = true;
    static aliases = ['jayree:manifest:beta:git:diff'];
    static flags = {
        'api-version': orgApiVersionFlagWithDeprecations,
        'source-dir': arrayWithDeprecation({
            char: 'd',
            summary: messages.getMessage('flags.source-dir.summary'),
            description: messages.getMessage('flags.source-dir.description'),
            deprecateAliases: true,
            aliases: ['sourcepath', 'p'],
        }),
        'output-dir': Flags.directory({
            char: 'r',
            summary: messages.getMessage('flags.output-dir.summary'),
            description: messages.getMessage('flags.output-dir.description'),
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
    outputDir;
    manifestName;
    destructiveChangesName;
    manifestOutputPath;
    destructiveChangesOutputPath;
    componentSet;
    destructiveChangesOnly;
    // eslint-disable-next-line sf-plugin/should-parse-flags
    async run() {
        await this.createManifest();
        return this.formatResult();
    }
    async getSourceApiVersion() {
        const projectConfig = await this.project?.resolveProjectConfig();
        return getString(projectConfig, 'sourceApiVersion') ?? undefined;
    }
    async createManifest() {
        const { flags, args } = await this.parse(GitDiffCommand);
        this.manifestName = 'package.xml';
        this.destructiveChangesName = 'destructiveChanges.xml';
        this.outputDir = flags['output-dir'];
        this.destructiveChangesOnly = flags['destructive-changes-only'];
        this.componentSet = await ComponentSetExtra.fromGitDiff({
            ref: [args.ref1, args.ref2],
            fsPaths: flags['source-dir'],
        });
        if (flags['api-version']) {
            this.componentSet.apiVersion = flags['api-version'];
            this.componentSet.sourceApiVersion = flags['api-version'];
        }
        if (this.outputDir) {
            await fs.ensureDir(this.outputDir);
            this.manifestOutputPath = join(this.outputDir, this.manifestName);
            this.destructiveChangesOutputPath = join(this.outputDir, this.destructiveChangesName);
        }
        else {
            this.manifestOutputPath = this.manifestName;
            this.destructiveChangesOutputPath = this.destructiveChangesName;
        }
        if (this.componentSet.size) {
            if (this.componentSet.getTypesOfDestructiveChanges().length) {
                await fs.writeFile(this.destructiveChangesOutputPath, await this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST));
            }
            if (this.destructiveChangesOnly) {
                if (this.componentSet.getTypesOfDestructiveChanges().length) {
                    const emptyCompSet = new ComponentSetExtra();
                    emptyCompSet.sourceApiVersion = this.componentSet.sourceApiVersion;
                    return fs.writeFile(this.manifestOutputPath, await emptyCompSet.getPackageXml());
                }
                return;
            }
            return fs.writeFile(this.manifestOutputPath, await this.componentSet.getPackageXml());
        }
    }
    formatResult() {
        if (!this.jsonEnabled()) {
            if (this.componentSet.size) {
                if (this.destructiveChangesOnly && !this.componentSet.getTypesOfDestructiveChanges().length) {
                    this.log(messages.getMessage('noComponents'));
                }
                else if (this.outputDir) {
                    this.log(messages.getMessage('successOutputDir', [this.manifestName, this.outputDir]));
                    if (this.componentSet.getTypesOfDestructiveChanges().length) {
                        this.log(messages.getMessage('successOutputDir', [this.destructiveChangesName, this.outputDir]));
                    }
                }
                else {
                    this.log(messages.getMessage('success', [this.manifestName]));
                    if (this.componentSet.getTypesOfDestructiveChanges().length) {
                        this.log(messages.getMessage('success', [this.destructiveChangesName]));
                    }
                }
            }
            else {
                this.log(messages.getMessage('noComponents'));
            }
        }
        if (this.componentSet.getTypesOfDestructiveChanges().length) {
            return {
                manifest: { path: this.manifestOutputPath, name: this.manifestName },
                destructiveChanges: {
                    path: this.destructiveChangesOutputPath,
                    name: this.destructiveChangesName,
                },
            };
        }
        else if (this.componentSet.size && !this.destructiveChangesOnly) {
            return { manifest: { path: this.manifestOutputPath, name: this.manifestName } };
        }
        else {
            return {};
        }
    }
}
//# sourceMappingURL=diff.js.map