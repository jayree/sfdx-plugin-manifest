"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changelog = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path_1 = require("path");
const fs = require("fs-extra");
const debug_1 = require("debug");
const terminalRenderer = require("marked-terminal");
const marked_1 = require("marked");
const debug = (0, debug_1.debug)('jayree:hooks');
const changelog = function () {
    process.once('exit', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        marked_1.marked.setOptions({ renderer: new terminalRenderer() });
        try {
            const moduleRootPath = (0, path_1.join)(__dirname, '..', '..');
            const changelogFile = fs.readFileSync((0, path_1.join)(moduleRootPath, 'CHANGELOG.md'), 'utf8');
            const packageJson = fs.readJSONSync((0, path_1.join)(moduleRootPath, 'package.json'));
            const cacheDir = (0, path_1.join)(this.config.cacheDir, packageJson.name);
            fs.ensureDirSync(cacheDir);
            const versionFile = (0, path_1.join)(cacheDir, 'version');
            let changelogText;
            try {
                const latestVersion = fs.readJSONSync(versionFile);
                changelogText = changelogFile.substring(0, changelogFile.indexOf(`[${latestVersion.version}]`));
                if (changelogText.length === 0) {
                    throw new Error('version not found');
                }
            }
            catch (err) {
                changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
            }
            finally {
                changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
                if (changelogText.length > 0) {
                    // eslint-disable-next-line no-console
                    console.log((0, marked_1.marked)(`# CHANGELOG (${packageJson.name})`));
                    // eslint-disable-next-line no-console
                    console.log((0, marked_1.marked)(changelogText));
                }
                else {
                    debug(`${packageJson.name} - no update`);
                }
                fs.writeJsonSync(versionFile, { version: packageJson.version });
            }
        }
        catch (error) {
            debug(error);
        }
    });
};
exports.changelog = changelog;
//# sourceMappingURL=changelog.js.map