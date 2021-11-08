/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import * as fs from 'fs-extra';
import { Hook } from '@oclif/config';
import { debug as Debug } from 'debug';
import terminalRenderer = require('marked-terminal');
import { marked } from 'marked';

const debug = Debug('jayree:hooks');

export const changelog: Hook<'changelog'> = function () {
  process.once('exit', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    marked.setOptions({ renderer: new terminalRenderer() });
    try {
      const moduleRootPath = join(__dirname, '..', '..');
      const changelogFile = fs.readFileSync(join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
      const packageJson = fs.readJSONSync(join(moduleRootPath, 'package.json')) as { name: string; version: string };
      const cacheDir = join(this.config.cacheDir, packageJson.name);
      fs.ensureDirSync(cacheDir);
      const versionFile = join(cacheDir, 'version');
      let changelogText: string;
      try {
        const latestVersion = fs.readJSONSync(versionFile) as { version: string };
        changelogText = changelogFile.substring(0, changelogFile.indexOf(`[${latestVersion.version}]`));
        if (changelogText.length === 0) {
          throw new Error('version not found');
        }
      } catch (err) {
        changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
      } finally {
        changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
        if (changelogText.length > 0) {
          // eslint-disable-next-line no-console
          console.log(marked(`# CHANGELOG (${packageJson.name})`));
          // eslint-disable-next-line no-console
          console.log(marked(changelogText));
        } else {
          debug(`${packageJson.name} - no update`);
        }
        fs.writeJsonSync(versionFile, { version: packageJson.version });
      }
    } catch (error) {
      debug(error);
    }
  });
};
