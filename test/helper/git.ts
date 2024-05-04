/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import git from 'isomorphic-git';
import fs from 'fs-extra';

export async function setAutocrlfOnWin32(dir: string) {
  process.platform === 'win32' && (await git.setConfig({ fs, dir, path: 'core.autocrlf', value: 'true' }));
}
