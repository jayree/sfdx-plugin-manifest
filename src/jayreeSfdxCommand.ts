/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { get } from '@salesforce/ts-types';

export abstract class JayreeSfdxCommand extends SfdxCommand {
  protected warnIfRunByAlias(aliases: string[], id: string): void {
    if (aliases.some((r) => process.argv.includes(r))) {
      this.ux.warn(`You are using a deprecated alias of the command: ${id}`);
    }
  }

  protected getFlag<T>(flagName: string, defaultVal?: unknown): T {
    return get(this.flags, flagName, defaultVal) as T;
  }
}
