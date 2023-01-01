/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { get, getBoolean, getString } from '@salesforce/ts-types';
export class JayreeSfdxCommand extends SfdxCommand {
    warnIfRunByAlias(aliases, id) {
        if (aliases.some((r) => process.argv.includes(r))) {
            this.ux.warn(`You are using a deprecated alias of the command: ${id}`);
        }
    }
    getFlag(flagName, defaultVal) {
        return get(this.flags, flagName, defaultVal);
    }
    isJsonOutput() {
        return getBoolean(this.flags, 'json', false);
    }
    async getSourceApiVersion() {
        const projectConfig = await this.project.resolveProjectConfig();
        return getString(projectConfig, 'sourceApiVersion');
    }
}
//# sourceMappingURL=jayreeSfdxCommand.js.map