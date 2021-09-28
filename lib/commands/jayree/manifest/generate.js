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
const standardValueSetData = require("../../../metadata/standardvalueset.json");
const jayreeSfdxCommand_1 = require("../../../jayreeSfdxCommand");
const stdValueSets = (0, utils_1.deepFreeze)(standardValueSetData);
const registryAccess = new source_deploy_retrieve_1.RegistryAccess();
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'packagexml');
class GeneratePackageXML extends jayreeSfdxCommand_1.JayreeSfdxCommand {
    // eslint-disable-next-line complexity
    async run() {
        var _a, _b, _c, _d, _e;
        this.warnIfRunByAlias(GeneratePackageXML.aliases, GeneratePackageXML.id);
        await this.org.refreshAuth();
        const file = this.getFlag('file');
        this.ux.startSpinner(`Generating ${file || 'package.xml'}`);
        this.cacheConnection = this.org.getConnection();
        let Aggregator = [];
        const componentPromises = [];
        for (const type of Object.values(source_deploy_retrieve_1.registry.types)) {
            componentPromises.push(this.listMembers({ type: type.name }));
        }
        const childrenPromises = [];
        const componentTypes = new Set();
        for await (const componentResult of componentPromises) {
            Aggregator.push(...componentResult);
            for (const component of componentResult) {
                const componentType = registryAccess.getTypeByName(component.type.toLowerCase());
                componentTypes.add(componentType);
                const folderContentType = componentType.folderContentType;
                if (folderContentType) {
                    childrenPromises.push(this.listMembers({
                        type: registryAccess.getTypeByName(componentType.folderContentType).name,
                        folder: component.fullName,
                    }));
                }
            }
        }
        for (const componentType of componentTypes) {
            const childTypes = (_a = componentType.children) === null || _a === void 0 ? void 0 : _a.types;
            if (childTypes) {
                Object.values(childTypes).map((childType) => {
                    childrenPromises.push(this.listMembers({ type: childType.name }));
                });
            }
        }
        for await (const childrenResult of childrenPromises) {
            Aggregator.push(...childrenResult);
        }
        if (this.getFlag('excludemanaged')) {
            Aggregator = Aggregator.filter((component) => !((component.namespacePrefix && component.manageableState !== 'unmanaged') ||
                component.manageableState === 'installed'));
        }
        if (this.getFlag('includeflowversions')) {
            const flowPromises = [];
            flowPromises.push(this.listMembers({ type: 'Flow' }, '43.0'));
            for await (const flowResult of flowPromises) {
                for (const component of flowResult) {
                    Aggregator.push(component);
                }
            }
        }
        const quickFilter = this.getFlag('quickfilter');
        if (quickFilter) {
            Aggregator = Aggregator.filter((component) => {
                let filter = quickFilter;
                let comp = component;
                if (!this.getFlag('matchcase')) {
                    filter = quickFilter.join('~').toLowerCase().split('~');
                    comp = Object.fromEntries(Object.entries(component).map(([k, v]) => [k, v === null || v === void 0 ? void 0 : v.toLowerCase()]));
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
        const hasFlows = Aggregator.filter((component) => component.type === 'Flow');
        if (hasFlows.length) {
            try {
                const flowDefinitionQuery = (await this.cacheConnection.tooling.query(`SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition where DeveloperName in (${hasFlows
                    .map((component) => `'${component.fullName}'`)
                    .toString()})`));
                const flowDefinitionRecods = flowDefinitionQuery.records;
                for (const record of flowDefinitionRecods) {
                    if (((_b = record.LatestVersion) === null || _b === void 0 ? void 0 : _b.VersionNumber) !== ((_c = record.ActiveVersion) === null || _c === void 0 ? void 0 : _c.VersionNumber)) {
                        this.ux.log(`Developername: ${record.DeveloperName}, ActiveVersion: ${(_d = record.ActiveVersion) === null || _d === void 0 ? void 0 : _d.VersionNumber}, LatestVersion: ${(_e = record.LatestVersion) === null || _e === void 0 ? void 0 : _e.VersionNumber}`);
                    }
                }
            }
            catch (error) {
                this.logger.debug(error.message);
            }
        }
        Aggregator = Aggregator.filter((component) => component.type !== 'FlowDefinition');
        const MetadataComponentAggregator = Aggregator.map((component) => {
            return { fullName: component.fullName, type: registryAccess.getTypeByName(component.type) };
        }).sort((a, b) => {
            if (a.type.name === b.type.name) {
                return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
            }
            return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
        });
        const pkg = new source_deploy_retrieve_1.ComponentSet(MetadataComponentAggregator, registryAccess);
        pkg.apiVersion = this.cacheConnection.getApiVersion();
        if (file) {
            await fs.ensureFile(file);
            await fs.writeFile(file, pkg.getPackageXml());
        }
        else {
            this.ux.log(pkg.getPackageXml());
        }
        this.ux.stopSpinner();
        return pkg.getObject();
    }
    async listMembers(query, apiVersion) {
        let members;
        try {
            if (!apiVersion) {
                apiVersion = this.cacheConnection.getApiVersion();
            }
            members = (0, utils_1.normalizeToArray)(await this.cacheConnection.metadata.list(query, apiVersion));
        }
        catch (error) {
            members = [];
            this.logger.debug(error.message);
        }
        if (query.type === source_deploy_retrieve_1.registry.types.standardvalueset.name && members.length === 0) {
            const standardValueSetPromises = stdValueSets.fullNames.map(async (standardValueSetFullName) => {
                try {
                    const queryResult = (await this.cacheConnection.tooling.query(`SELECT Id, MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = '${standardValueSetFullName}'`));
                    const standardValueSetRecord = queryResult.records[0];
                    return (standardValueSetRecord.Metadata.standardValue.length && {
                        fullName: standardValueSetRecord.MasterLabel,
                        fileName: `${source_deploy_retrieve_1.registry.types.standardvalueset.directoryName}/${standardValueSetRecord.MasterLabel}.${source_deploy_retrieve_1.registry.types.standardvalueset.suffix}`,
                        type: source_deploy_retrieve_1.registry.types.standardvalueset.name,
                        createdById: '',
                        createdByName: '',
                        createdDate: '',
                        id: '',
                        lastModifiedById: '',
                        lastModifiedByName: '',
                        lastModifiedDate: '',
                    });
                }
                catch (error) {
                    this.logger.debug(error.message);
                }
            });
            for await (const standardValueSetResult of standardValueSetPromises) {
                if (standardValueSetResult) {
                    members.push(standardValueSetResult);
                }
            }
        }
        return members;
    }
}
exports.default = GeneratePackageXML;
GeneratePackageXML.aliases = ['jayree:packagexml'];
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
    }),
};
GeneratePackageXML.requiresUsername = true;
GeneratePackageXML.supportsDevhubUsername = false;
GeneratePackageXML.requiresProject = false;
//# sourceMappingURL=generate.js.map