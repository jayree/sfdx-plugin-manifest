/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Messages } from '@salesforce/core';
import { CLIError } from '@oclif/core/lib/parser/errors.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { ensureArray } from '@salesforce/kit';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { XML_DECL, XML_NS_KEY, XML_NS_URL } from '@salesforce/source-deploy-retrieve/lib/src/common/index.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestcleanup');
class CleanupManifest extends SfCommand {
    async run() {
        const { flags } = await this.parse(CleanupManifest);
        const file = flags['file'];
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
    <!--Remove specified members from type-->
    <members>VideoCall</members>
    <!--Remove all members starting with Video from type-->
    <members>Video*</members>
  </types>
  <types>
    <name>Report</name>
    <!--Remove all members from type, but keep members: MyFolder, MyFolder/MyReport. If you don't need all your reports in your repository-->
    <members>*</members>
    <members>MyFolder</members>
    <members>MyFolder/MyReport</members>
  </types>
  <types>
    <name>CustomObjectTranslation</name>
    <!--Remove all members from type, but keep members ending with -de. If you don't want to store all CustomObjectTranslation in your repository-->
    <members>*</members>
    <members>*-de</members>
  </types>
  <types>
    <name>CustomObject</name>
    <!--Add members ObjectName1, ObjectName2. If you have used 'excludemanaged' with 'jayree:manifest:generate' to re-add required managed components-->
    <members>!ObjectName1</members>
    <members>!ObjectName2</members>
  </types>
  <version>52.0</version>
</Package>
`);
            this.log(`Cleanup manifest file template '${file}' was created`);
        }
        else {
            if (!flags['manifest'] || !(await fs.pathExists(flags['manifest']))) {
                throw new CLIError(`The following error occurred:\n  ${chalk.dim('Missing required flag manifest')}`);
            }
            await this.cleanupManifestFile(flags['manifest'], file);
        }
        return;
    }
    async cleanupManifestFile(manifest, ignoreManifest) {
        const { packageTypeMembers: manifestTypeMembers, version } = parseManifest(fs.readFileSync(manifest, 'utf8'));
        this.log(`apply '${ignoreManifest}' to '${manifest}'`);
        const typeMap = new Map();
        manifestTypeMembers.forEach((value) => {
            typeMap.set(value.name, ensureArray(value.members));
        });
        const { packageTypeMembers: ignoreTypeMembers } = parseManifest(fs.readFileSync(ignoreManifest, 'utf8'));
        const resolveWildCard = (name, members) => {
            members
                .filter((m) => m.includes('*') && m.length > 1)
                .forEach((i) => {
                members.splice(members.indexOf(i), 1);
                const wildCard = i.split('*');
                members = members.concat(typeMap.get(name)?.filter((m) => {
                    if (wildCard.length === 2) {
                        if (i.startsWith('*')) {
                            return m.endsWith(wildCard[1]);
                        }
                        else if (i.endsWith('*')) {
                            return m.startsWith(wildCard[0]);
                        }
                        else {
                            return m.startsWith(wildCard[0]) && m.endsWith(wildCard[1]);
                        }
                    }
                }));
            });
            return members;
        };
        ignoreTypeMembers.forEach((types) => {
            if (!typeMap.get(types.name)) {
                typeMap.set(types.name, []);
            }
            const packageTypeMembers = resolveWildCard(types.name, ensureArray(types.members));
            if (packageTypeMembers.includes('*') && packageTypeMembers.length > 1) {
                const includemembers = packageTypeMembers.slice();
                includemembers.splice(includemembers.indexOf('*'), 1);
                const includedmembers = typeMap.get(types.name)?.filter((value) => includemembers.includes(value));
                if (includedmembers?.length) {
                    this.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
                    typeMap.set(types.name, includedmembers);
                }
            }
            if (packageTypeMembers.includes('*') && packageTypeMembers.length === 1) {
                this.log('exclude all members for type ' + types.name);
                typeMap.delete(types.name);
            }
            if (!packageTypeMembers.includes('*')) {
                const includedmembers = typeMap.get(types.name)?.filter((value) => !packageTypeMembers.includes(value));
                if (includedmembers) {
                    typeMap.set(types.name, includedmembers);
                }
            }
            packageTypeMembers.forEach((member) => {
                if (member.startsWith('!') && !typeMap.get(types.name)?.includes(member.substring(1))) {
                    typeMap.get(types.name)?.push(member.substring(1));
                }
            });
        });
        const typeMembers = [];
        for (const [typeName, members] of typeMap.entries()) {
            if (members.length) {
                typeMembers.push({ members, name: typeName });
            }
        }
        await fs.writeFile(manifest, js2Manifest({ Package: { types: typeMembers, version } }));
    }
}
CleanupManifest.summary = messages.getMessage('summary');
CleanupManifest.description = messages.getMessage('description');
CleanupManifest.examples = messages.getMessages('examples');
CleanupManifest.requiresProject = true;
CleanupManifest.flags = {
    manifest: Flags.file({
        char: 'x',
        summary: messages.getMessage('flags.manifest.summary'),
    }),
    file: Flags.file({
        char: 'f',
        required: true,
        summary: messages.getMessage('flags.file.summary'),
    }),
};
export default CleanupManifest;
function parseManifest(xmlData) {
    const parser = new XMLParser({ stopNodes: ['version'], parseTagValue: false });
    const { Package: { types, version }, } = parser.parse(xmlData);
    const packageTypeMembers = ensureArray(types);
    return { packageTypeMembers, version };
}
function js2Manifest(jsData) {
    const js2Xml = new XMLBuilder({ format: true, indentBy: '    ', ignoreAttributes: false });
    jsData.Package[XML_NS_KEY] = XML_NS_URL;
    return XML_DECL.concat(js2Xml.build(jsData));
}
//# sourceMappingURL=cleanup.js.map