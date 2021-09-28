"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = require("fs-extra");
const jayreeSfdxCommand_1 = require("../../../jayreeSfdxCommand");
const manifest_1 = require("../../../utils/manifest");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestcleanup');
class CleanupManifest extends jayreeSfdxCommand_1.JayreeSfdxCommand {
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
            await (0, manifest_1.cleanupManifestFile)(this.getFlag('manifest'), file);
        }
        return {};
    }
}
exports.default = CleanupManifest;
CleanupManifest.description = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
CleanupManifest.flagsConfig = {
    manifest: command_1.flags.filepath({
        char: 'x',
        description: messages.getMessage('manifestFlagDescription'),
    }),
    file: command_1.flags.filepath({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
};
CleanupManifest.requiresUsername = false;
CleanupManifest.supportsDevhubUsername = false;
CleanupManifest.requiresProject = true;
//# sourceMappingURL=cleanup.js.map