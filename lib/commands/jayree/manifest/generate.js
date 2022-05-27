"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const os = require("os");
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const utils_1 = require("@salesforce/source-deploy-retrieve/lib/src/utils");
const fs = require("fs-extra");
const jayreeSfdxCommand_1 = require("../../../jayreeSfdxCommand");
const registryAccess = new source_deploy_retrieve_1.RegistryAccess();
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestgenerate');
class GeneratePackageXML extends jayreeSfdxCommand_1.JayreeSfdxCommand {
    // eslint-disable-next-line complexity
    async run() {
        var _a, _b, _c, _d;
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
        let componentSet = await source_deploy_retrieve_1.ComponentSet.fromConnection({
            usernameOrConnection: this.cacheConnection,
            componentFilter,
        });
        if (this.getFlag('includeflowversions')) {
            const flowPromises = [];
            flowPromises.push(this.listMembers({ type: 'Flow' }, '43.0'));
            for await (const flowResult of flowPromises) {
                for (const component of flowResult.filter(componentFilter)) {
                    componentSet.add({ fullName: component.fullName, type: registryAccess.getTypeByName(component.type) });
                }
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
                    if (((_a = record.LatestVersion) === null || _a === void 0 ? void 0 : _a.VersionNumber) !== ((_b = record.ActiveVersion) === null || _b === void 0 ? void 0 : _b.VersionNumber)) {
                        this.ux.log(`DeveloperName: ${record.DeveloperName}, ActiveVersion: ${(_c = record.ActiveVersion) === null || _c === void 0 ? void 0 : _c.VersionNumber}, LatestVersion: ${(_d = record.LatestVersion) === null || _d === void 0 ? void 0 : _d.VersionNumber}`);
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
            await fs.writeFile(file, componentSet.getPackageXml());
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
            members = (0, utils_1.normalizeToArray)((await this.cacheConnection.metadata.list(query, apiVersion)));
        }
        catch (error) {
            members = [];
            this.logger.debug(error.message);
        }
        return members;
    }
}
exports.default = GeneratePackageXML;
GeneratePackageXML.description = messages.getMessage('commandDescription');
GeneratePackageXML.examples = messages.getMessage('examples').split(os.EOL);
GeneratePackageXML.flagsConfig = {
    quickfilter: command_1.flags.array({
        char: 'q',
        description: messages.getMessage('quickfilterFlagDescription'),
    }),
    matchcase: command_1.flags.boolean({
        char: 'c',
        description: messages.getMessage('matchCaseFlagDescription'),
    }),
    matchwholeword: command_1.flags.boolean({
        char: 'w',
        description: messages.getMessage('matchWholeWordFlagDescription'),
    }),
    includeflowversions: command_1.flags.boolean({
        description: messages.getMessage('includeflowversionsDescription'),
    }),
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
    excludemanaged: command_1.flags.boolean({
        char: 'x',
        description: messages.getMessage('excludeManagedFlagDescription'),
        exclusive: ['excludeall'],
    }),
    excludeall: command_1.flags.boolean({
        char: 'a',
        description: messages.getMessage('excludeAllFlagDescription'),
        exclusive: ['excludemanaged'],
    }),
};
GeneratePackageXML.requiresUsername = true;
GeneratePackageXML.supportsDevhubUsername = false;
GeneratePackageXML.requiresProject = false;
//# sourceMappingURL=generate.js.map