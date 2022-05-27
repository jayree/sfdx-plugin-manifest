/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CliUx } from '@oclif/core';
import * as fs from 'fs-extra';
import { normalizeToArray } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import { PackageTypeMembers } from '@salesforce/source-deploy-retrieve';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { XML_DECL, XML_NS_KEY, XML_NS_URL } from '@salesforce/source-deploy-retrieve/lib/src/common';

interface PackageManifestObject {
  Package: {
    types: PackageTypeMembers[];
    version: string;
    [XML_NS_KEY]?: string;
  };
}

function parseManifest(xmlData: string): { packageTypeMembers: PackageTypeMembers[]; version: string } {
  const parser = new XMLParser({ stopNodes: ['version'], parseTagValue: false });

  const {
    Package: { types, version },
  } = parser.parse(xmlData) as PackageManifestObject;

  const packageTypeMembers = normalizeToArray(types);
  return { packageTypeMembers, version };
}

function js2Manifest(jsData: PackageManifestObject): string {
  const js2Xml = new XMLBuilder({ format: true, indentBy: '    ', ignoreAttributes: false });
  jsData.Package[XML_NS_KEY] = XML_NS_URL;
  return XML_DECL.concat(js2Xml.build(jsData) as string);
}

export async function cleanupManifestFile(manifest: string, ignoreManifest: string): Promise<void> {
  const { packageTypeMembers: manifestTypeMembers, version } = parseManifest(fs.readFileSync(manifest, 'utf8'));
  CliUx.ux.log(`apply '${ignoreManifest}' to '${manifest}'`);

  const typeMap = new Map<string, string[]>();

  manifestTypeMembers.forEach((value) => {
    typeMap.set(value.name, normalizeToArray(value.members));
  });

  const { packageTypeMembers: ignoreTypeMembers } = parseManifest(fs.readFileSync(ignoreManifest, 'utf8'));

  ignoreTypeMembers.forEach((types) => {
    if (typeMap.get(types.name)) {
      const packageTypeMembers = normalizeToArray(types.members);
      if (packageTypeMembers.includes('*') && packageTypeMembers.length > 1) {
        const includemembers = packageTypeMembers.slice();
        includemembers.splice(includemembers.indexOf('*'), 1);
        const includedmembers = typeMap.get(types.name).filter((value) => {
          return includemembers.includes(value);
        });
        if (includedmembers.length) {
          CliUx.ux.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
          typeMap.set(types.name, includedmembers);
        }
      }

      if (packageTypeMembers.includes('*') && packageTypeMembers.length === 1) {
        CliUx.ux.log('exclude all members for type ' + types.name);
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

  const typeMembers: PackageTypeMembers[] = [];
  for (const [typeName, members] of typeMap.entries()) {
    if (members.length) {
      typeMembers.push({ name: typeName, members });
    }
  }

  await fs.writeFile(manifest, js2Manifest({ Package: { types: typeMembers, version } }));
}
