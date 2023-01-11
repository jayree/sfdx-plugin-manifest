/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand.js';
import { cleanupManifestFile } from '../../../utils/manifest.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestcleanup');
export default class CleanupManifest extends JayreeSfdxCommand {
    async run() {
        const file = this.getFlag('file');
        if (!(await fs.pathExists(file))) {
            await fs.ensureFile(file);
            await fs.writeFile(file, `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <name>Audience</name>
    <!--Remove all members/the entire type-->
    <members>*</members>
  </types>
  <types>
    <name>SharingRules</name>
    <!--Remove specified members from type E.g. VideoCall-->
    <members>VideoCall</members>
  </types>
  <types>
    <name>Report</name>
    <!--Remove all members from type, but keep members: MyFolder, MyFolder/MyReport. E.g. if you don't need all your reports in your repository-->
    <members>*</members>
    <members>MyFolder</members>
    <members>MyFolder/MyReport</members>
  </types>
  <types>
    <name>CustomObject</name>
    <!--Add members. E.g. if you have used 'excludemanaged' with 'jayree:manifest:generate' to re-add required managed components-->
    <members>!ObjectName1</members>
    <members>!ObjectName2</members>
  </types>
  <version>52.0</version>
</Package>
`);
            this.ux.log(`Cleanup manifest file template '${file}' was created`);
        }
        else {
            await cleanupManifestFile(this.getFlag('manifest'), file);
        }
        return;
    }
}
CleanupManifest.description = messages.getMessage('commandDescription');
CleanupManifest.examples = messages.getMessage('examples').split(os.EOL);
CleanupManifest.flagsConfig = {
    manifest: flags.filepath({
        char: 'x',
        description: messages.getMessage('manifestFlagDescription'),
    }),
    file: flags.filepath({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
};
CleanupManifest.requiresUsername = false;
CleanupManifest.supportsDevhubUsername = false;
CleanupManifest.requiresProject = true;
//# sourceMappingURL=cleanup.js.map