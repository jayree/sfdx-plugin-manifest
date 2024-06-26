/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import printChangeLog from '@jayree/changelog';
import { Logger } from '@salesforce/core';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
const logger = Logger.childFromRoot('@jayree/sfdx-plugin-manifest:hooks:update');
// eslint-disable-next-line @typescript-eslint/require-await
export const changelog = async function () {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.once('beforeExit', async () => {
        const changes = await printChangeLog(this.config.cacheDir, join(__dirname, '..', '..'), logger);
        if (changes)
            this.log(changes);
    });
};
//# sourceMappingURL=changelog.js.map