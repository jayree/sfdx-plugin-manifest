/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { join } from 'path';
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../../../jayreeSfdxCommand.js';
import { ComponentSetExtra } from '../../../../../SDR-extra/collections/componentSetExtra.js';
Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiffbeta');
export default class gitDiff extends JayreeSfdxCommand {
    async run() {
        await this.createManifest();
        return this.formatResult();
    }
    async createManifest() {
        this.manifestName = 'package.xml';
        this.destructiveChangesName = 'destructiveChanges.xml';
        this.outputDir = this.getFlag('outputdir');
        this.destructiveChangesOnly = this.getFlag('destructivechangesonly');
        this.componentSet = await ComponentSetExtra.fromGitDiff({
            ref: [this.args.ref1, this.args.ref2],
            fsPaths: this.getFlag('sourcepath'),
        });
        this.componentSet.sourceApiVersion = this.getFlag('apiversion') ?? (await this.getSourceApiVersion());
        if (this.outputDir) {
            await fs.ensureDir(this.outputDir);
            this.outputPath = join(this.outputDir, this.manifestName);
        }
        else {
            this.outputPath = this.manifestName;
        }
        if (this.componentSet.size) {
            if (this.componentSet.getTypesOfDestructiveChanges().length) {
                await fs.writeFile(join(this.outputDir, this.destructiveChangesName), await this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST));
            }
            if (this.destructiveChangesOnly) {
                if (this.componentSet.getTypesOfDestructiveChanges().length) {
                    const emptyCompSet = new ComponentSetExtra();
                    emptyCompSet.sourceApiVersion = this.componentSet.sourceApiVersion;
                    return fs.writeFile(this.outputPath, await emptyCompSet.getPackageXml());
                }
                return;
            }
            return fs.writeFile(this.outputPath, await this.componentSet.getPackageXml());
        }
    }
    formatResult() {
        if (!this.isJsonOutput()) {
            if (this.componentSet.size) {
                if (this.destructiveChangesOnly && !this.componentSet.getTypesOfDestructiveChanges().length) {
                    this.ux.log(messages.getMessage('nocomponents'));
                }
                else if (this.outputDir) {
                    this.ux.log(messages.getMessage('successOutputDir', [this.manifestName, this.outputDir]));
                    if (this.componentSet.getTypesOfDestructiveChanges().length) {
                        this.ux.log(messages.getMessage('successOutputDir', [this.destructiveChangesName, this.outputDir]));
                    }
                }
                else {
                    this.ux.log(messages.getMessage('success', [this.manifestName]));
                    if (this.componentSet.getTypesOfDestructiveChanges().length) {
                        this.ux.log(messages.getMessage('success', [this.destructiveChangesName]));
                    }
                }
            }
            else {
                this.ux.log(messages.getMessage('nocomponents'));
            }
        }
        if (this.componentSet.getTypesOfDestructiveChanges().length) {
            return {
                manifest: { path: this.outputPath, name: this.manifestName },
                destructiveChanges: {
                    path: join(this.outputDir, this.destructiveChangesName),
                    name: this.destructiveChangesName,
                },
            };
        }
        else if (this.componentSet.size && !this.destructiveChangesOnly) {
            return { manifest: { path: this.outputPath, name: this.manifestName } };
        }
        else {
            return {};
        }
    }
}
gitDiff.description = messages.getMessage('description');
gitDiff.examples = messages.getMessage('examples').split(os.EOL);
gitDiff.args = [
    {
        name: 'ref1',
        required: true,
        description: 'base commit or branch',
    },
    {
        name: 'ref2',
        description: 'commit or branch to compare to the base commit',
    },
];
gitDiff.flagsConfig = {
    apiversion: flags.builtin({}),
    sourcepath: flags.array({
        char: 'p',
        description: messages.getMessage('flags.sourcepath'),
    }),
    outputdir: flags.string({
        char: 'o',
        description: messages.getMessage('flags.outputdir'),
        default: '',
    }),
    destructivechangesonly: flags.boolean({
        char: 'd',
        description: messages.getMessage('flags.destructivechangesonly'),
        default: false,
    }),
};
gitDiff.requiresUsername = false;
gitDiff.supportsDevhubUsername = false;
gitDiff.requiresProject = true;
//# sourceMappingURL=diff.js.map