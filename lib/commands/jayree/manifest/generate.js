/*
 * Copyright 2025, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { SfCommand, Flags, Ux } from '@salesforce/sf-plugins-core';
import { Messages, Logger } from '@salesforce/core';
import { RegistryAccess, ComponentSet } from '@salesforce/source-deploy-retrieve';
import { ensureArray } from '@salesforce/kit';
import fs from 'fs-extra';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const registryAccess = new RegistryAccess();
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestgenerate');
export default class GeneratePackageXML extends SfCommand {
    static summary = messages.getMessage('summary');
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static flags = {
        'target-org': Flags.requiredOrg(),
        'api-version': Flags.orgApiVersion(),
        'quick-filter': Flags.string({
            char: 'q',
            summary: messages.getMessage('flags.quick-filter.summary'),
            multiple: true,
        }),
        'match-case': Flags.boolean({
            char: 'c',
            summary: messages.getMessage('flags.match-case.summary'),
        }),
        'match-whole-word': Flags.boolean({
            char: 'w',
            summary: messages.getMessage('flags.match-whole-word.summary'),
        }),
        'include-flow-versions': Flags.boolean({
            summary: messages.getMessage('flags.include-flow-versions.summary'),
        }),
        file: Flags.string({
            char: 'f',
            summary: messages.getMessage('flags.file.summary'),
        }),
        'exclude-managed': Flags.boolean({
            char: 'x',
            summary: messages.getMessage('flags.exclude-managed.summary'),
            exclusive: ['exclude-all'],
        }),
        'exclude-all': Flags.boolean({
            char: 'a',
            summary: messages.getMessage('flags.exclude-all.summary'),
            exclusive: ['exclude-managed'],
        }),
    };
    logger;
    conn;
    async run() {
        this.logger = await Logger.child('jayree:manifest:generate');
        const { flags } = await this.parse(GeneratePackageXML);
        this.conn = flags['target-org'].getConnection(flags['api-version']);
        const ux = new Ux({ jsonEnabled: this.jsonEnabled() });
        const file = flags['file'];
        ux.spinner.start(`Generating ${file ?? 'package.xml'}`);
        const managed = ['beta', 'deleted', 'deprecated', 'installed', 'released'];
        const all = ['beta', 'deleted', 'deprecated', 'installed', 'released', 'installedEditable', 'deprecatedEditable'];
        const componentFilter = (component) => {
            const isNamespaceUndefined = component.namespacePrefix && component.manageableState === undefined;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            const isTranslationsBeta = component.type === 'Translations' && component.manageableState === 'beta';
            const isExcludedManaged = flags['exclude-managed'] &&
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                (isNamespaceUndefined ||
                    (component.manageableState && managed.includes(component.manageableState) && !isTranslationsBeta));
            const isExcludedAll = flags['exclude-all'] &&
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                (isNamespaceUndefined ||
                    (component.manageableState && all.includes(component.manageableState) && !isTranslationsBeta));
            return !(isExcludedManaged ?? isExcludedAll);
        };
        let componentSet = await ComponentSet.fromConnection({
            usernameOrConnection: this.conn,
            componentFilter,
        });
        if (flags['include-flow-versions']) {
            const flowResult = await this.listMembers({ type: 'Flow' }, '43.0');
            for (const component of flowResult.filter(componentFilter)) {
                componentSet.add({ fullName: component.fullName, type: registryAccess.getTypeByName(component.type) });
            }
        }
        const quickFilter = flags['quick-filter'];
        if (quickFilter) {
            componentSet = componentSet.filter((component) => {
                let filter = quickFilter;
                const comp = { fullName: component.fullName, type: component.type.name };
                if (!flags['match-case']) {
                    filter = quickFilter.join('~').toLowerCase().split('~');
                    comp.fullName = component.fullName.toLocaleLowerCase();
                    comp.type = component.type.name.toLowerCase();
                }
                if (flags['match-whole-word']) {
                    return filter.includes(comp.fullName) || filter.includes(comp.type);
                }
                else {
                    return filter.some((str) => comp.fullName.includes(str));
                }
            });
        }
        const hasFlows = componentSet.toArray().filter((component) => component.type.name === 'Flow');
        if (hasFlows.length) {
            try {
                const flowDefinitionQuery = (await this.conn.tooling.query(`SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition where DeveloperName in (${hasFlows
                    .map((component) => `'${component.fullName}'`)
                    .toString()})`));
                const flowDefinitionRecods = flowDefinitionQuery.records;
                for (const record of flowDefinitionRecods) {
                    if (record.LatestVersion?.VersionNumber !== record.ActiveVersion?.VersionNumber) {
                        this.log(`DeveloperName: ${record.DeveloperName}, ActiveVersion: ${record.ActiveVersion?.VersionNumber}, LatestVersion: ${record.LatestVersion?.VersionNumber}`);
                    }
                }
            }
            catch (error) {
                this.logger.debug(error.message);
            }
        }
        componentSet = componentSet.filter((component) => component.type.name !== 'FlowDefinition');
        componentSet.apiVersion = this.conn.getApiVersion();
        if (file) {
            await fs.ensureFile(file);
            await fs.writeFile(file, await componentSet.getPackageXml());
        }
        else {
            this.log(await componentSet.getPackageXml());
        }
        ux.spinner.stop();
        return componentSet.getObject();
    }
    async listMembers(query, apiVersion) {
        let members;
        try {
            apiVersion ??= this.conn.getApiVersion();
            members = ensureArray((await this.conn.metadata.list(query, apiVersion)));
        }
        catch (error) {
            members = [];
            this.logger.debug(error.message);
        }
        return members;
    }
}
//# sourceMappingURL=generate.js.map