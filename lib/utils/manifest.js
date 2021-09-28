"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupManifestFile = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const cli_ux_1 = require("cli-ux");
const fs = require("fs-extra");
const utils_1 = require("@salesforce/source-deploy-retrieve/lib/src/utils");
const fast_xml_parser_1 = require("fast-xml-parser");
const common_1 = require("@salesforce/source-deploy-retrieve/lib/src/common");
function parseManifest(xmlData) {
    const { Package: { types, version }, } = (0, fast_xml_parser_1.parse)(xmlData, { stopNodes: ['version'] });
    const packageTypeMembers = (0, utils_1.normalizeToArray)(types);
    return { packageTypeMembers, version };
}
function js2Manifest(jsData) {
    const js2Xml = new fast_xml_parser_1.j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
    jsData.Package[common_1.XML_NS_KEY] = common_1.XML_NS_URL;
    return common_1.XML_DECL.concat(js2Xml.parse(jsData));
}
async function cleanupManifestFile(manifest, ignoreManifest) {
    const { packageTypeMembers: manifestTypeMembers, version } = parseManifest(fs.readFileSync(manifest, 'utf8'));
    cli_ux_1.cli.log(`apply '${ignoreManifest}' to '${manifest}'`);
    const typeMap = new Map();
    manifestTypeMembers.forEach((value) => {
        typeMap.set(value.name, (0, utils_1.normalizeToArray)(value.members));
    });
    const { packageTypeMembers: ignoreTypeMembers } = parseManifest(fs.readFileSync(ignoreManifest, 'utf8'));
    ignoreTypeMembers.forEach((types) => {
        if (typeMap.get(types.name)) {
            const packageTypeMembers = (0, utils_1.normalizeToArray)(types.members);
            if (packageTypeMembers.includes('*') && packageTypeMembers.length > 1) {
                const includemembers = packageTypeMembers.slice();
                includemembers.splice(includemembers.indexOf('*'), 1);
                const includedmembers = typeMap.get(types.name).filter((value) => {
                    return includemembers.includes(value);
                });
                if (includedmembers.length) {
                    cli_ux_1.cli.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
                    typeMap.set(types.name, includedmembers);
                }
            }
            if (packageTypeMembers.includes('*') && packageTypeMembers.length === 1) {
                cli_ux_1.cli.log('exclude all members for type ' + types.name);
                typeMap.delete(types.name);
            }
            if (!packageTypeMembers.includes('*')) {
                const includedmembers = typeMap.get(types.name).filter((value) => {
                    return !packageTypeMembers.includes(value);
                });
                typeMap.set(types.name, includedmembers);
            }
            packageTypeMembers.forEach((member) => {
                if (member.startsWith('!')) {
                    typeMap.get(types.name).push(member.substring(1));
                }
            });
        }
    });
    const typeMembers = [];
    for (const [typeName, members] of typeMap.entries()) {
        if (members.length) {
            typeMembers.push({ name: typeName, members });
        }
    }
    await fs.writeFile(manifest, js2Manifest({ Package: { types: typeMembers, version } }));
}
exports.cleanupManifestFile = cleanupManifestFile;
//# sourceMappingURL=manifest.js.map