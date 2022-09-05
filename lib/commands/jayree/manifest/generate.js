/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { RegistryAccess, ComponentSet } from '@salesforce/source-deploy-retrieve';
import { ensureArray } from '@salesforce/kit';
import fs from 'fs-extra';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand.js';
const registryAccess = new RegistryAccess();
Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestgenerate');
export default class GeneratePackageXML extends JayreeSfdxCommand {
    // eslint-disable-next-line complexity
    async run() {
        await this.org.refreshAuth();
        const file = this.getFlag('file');
        this.ux.startSpinner(`Generating ${file || 'package.xml'}`);
        this.cacheConnection = this.org.getConnection();
        const managed = ['beta', 'deleted', 'deprecated', 'installed', 'released'];
        const all = ['beta', 'deleted', 'deprecated', 'installed', 'released', 'installedEditable', 'deprecatedEditable'];
        const componentFilter = (component) => !((this.getFlag('excludemanaged') &&
            ((component.namespacePrefix &&
                (managed.includes(component.manageableState) || component.manageableState === undefined)) ||
                managed.includes(component.manageableState))) ||
            (this.getFlag('excludeall') &&
                ((component.namespacePrefix &&
                    (all.includes(component.manageableState) || component.manageableState === undefined)) ||
                    all.includes(component.manageableState))));
        let componentSet = await ComponentSet.fromConnection({
            usernameOrConnection: this.cacheConnection,
            componentFilter,
        });
        if (this.getFlag('includeflowversions')) {
            const flowResult = await this.listMembers({ type: 'Flow' }, '43.0');
            for (const component of flowResult.filter(componentFilter)) {
                componentSet.add({ fullName: component.fullName, type: registryAccess.getTypeByName(component.type) });
            }
        }
        const quickFilter = this.getFlag('quickfilter');
        if (quickFilter) {
            componentSet = componentSet.filter((component) => {
                let filter = quickFilter;
                const comp = { fullName: component.fullName, type: component.type.name };
                if (!this.getFlag('matchcase')) {
                    filter = quickFilter.join('~').toLowerCase().split('~');
                    comp.fullName = component.fullName.toLocaleLowerCase();
                    comp.type = component.type.name.toLowerCase();
                }
                if (this.getFlag('matchwholeword')) {
                    return filter.includes(comp.fullName) || filter.includes(comp.type);
                }
                else {
                    for (const f of filter) {
                        return comp.fullName.includes(f) || comp.type.includes(f);
                    }
                }
            });
        }
        const hasFlows = componentSet.toArray().filter((component) => component.type.name === 'Flow');
        if (hasFlows.length) {
            try {
                const flowDefinitionQuery = (await this.cacheConnection.tooling.query(`SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition where DeveloperName in (${hasFlows
                    .map((component) => `'${component.fullName}'`)
                    .toString()})`));
                const flowDefinitionRecods = flowDefinitionQuery.records;
                for (const record of flowDefinitionRecods) {
                    if (record.LatestVersion?.VersionNumber !== record.ActiveVersion?.VersionNumber) {
                        this.ux.log(`DeveloperName: ${record.DeveloperName}, ActiveVersion: ${record.ActiveVersion?.VersionNumber}, LatestVersion: ${record.LatestVersion?.VersionNumber}`);
                    }
                }
            }
            catch (error) {
                this.logger.debug(error.message);
            }
        }
        componentSet = componentSet.filter((component) => component.type.name !== 'FlowDefinition');
        componentSet.apiVersion = this.cacheConnection.getApiVersion();
        if (file) {
            await fs.ensureFile(file);
            await fs.writeFile(file, await componentSet.getPackageXml());
        }
        else {
            this.ux.log(await componentSet.getPackageXml());
        }
        this.ux.stopSpinner();
        return componentSet.getObject();
    }
    async listMembers(query, apiVersion) {
        let members;
        try {
            if (!apiVersion) {
                apiVersion = this.cacheConnection.getApiVersion();
            }
            members = ensureArray((await this.cacheConnection.metadata.list(query, apiVersion)));
        }
        catch (error) {
            members = [];
            this.logger.debug(error.message);
        }
        return members;
    }
}
GeneratePackageXML.description = messages.getMessage('commandDescription');
GeneratePackageXML.examples = messages.getMessage('examples').split(os.EOL);
GeneratePackageXML.flagsConfig = {
    quickfilter: flags.array({
        char: 'q',
        description: messages.getMessage('quickfilterFlagDescription'),
    }),
    matchcase: flags.boolean({
        char: 'c',
        description: messages.getMessage('matchCaseFlagDescription'),
    }),
    matchwholeword: flags.boolean({
        char: 'w',
        description: messages.getMessage('matchWholeWordFlagDescription'),
    }),
    includeflowversions: flags.boolean({
        description: messages.getMessage('includeflowversionsDescription'),
    }),
    file: flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
    excludemanaged: flags.boolean({
        char: 'x',
        description: messages.getMessage('excludeManagedFlagDescription'),
        exclusive: ['excludeall'],
    }),
    excludeall: flags.boolean({
        char: 'a',
        description: messages.getMessage('excludeAllFlagDescription'),
        exclusive: ['excludemanaged'],
    }),
};
GeneratePackageXML.requiresUsername = true;
GeneratePackageXML.supportsDevhubUsername = false;
GeneratePackageXML.requiresProject = false;
//# sourceMappingURL=generate.js.map