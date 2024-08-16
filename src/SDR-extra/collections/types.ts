/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { OptionalTreeRegistryOptions } from '@salesforce/source-deploy-retrieve';

export type FromGitDiffOptions = {
  /**
   * Git ref to resolve components against
   */
  ref: string | string[];
  /**
   * File paths or directory paths to resolve components against
   */
  fsPaths?: string[];
} & OptionalTreeRegistryOptions;
