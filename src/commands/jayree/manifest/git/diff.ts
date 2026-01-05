/*
 * Copyright 2026, jayree
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
import { join } from 'node:path';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Args } from '@oclif/core';
import { getString, Optional } from '@salesforce/ts-types';
import { ComponentSetExtra } from '../../../../SDR-extra/index.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');

export type GitDiffCommandResult = {
  manifest?: { path: string; name: string };
  destructiveChanges?: { path: string; name: string };
};

export default class GitDiffCommand extends SfCommand<GitDiffCommandResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');

  public static readonly examples = messages.getMessages('examples');

  public static readonly args = {
    ref1: Args.string({
      required: true,
      description: messages.getMessage('args.ref1.description'),
    }),
    ref2: Args.string({
      description: messages.getMessage('args.ref2.description'),
    }),
  };

  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    'source-dir': Flags.string({
      char: 'd',
      summary: messages.getMessage('flags.source-dir.summary'),
      description: messages.getMessage('flags.source-dir.description'),
      multiple: true,
    }),
    'output-dir': Flags.directory({
      char: 'r',
      summary: messages.getMessage('flags.output-dir.summary'),
      description: messages.getMessage('flags.output-dir.description'),
    }),
    'destructive-changes-only': Flags.boolean({
      summary: messages.getMessage('flags.destructive-changes-only.summary'),
      description: messages.getMessage('flags.destructive-changes-only.description'),
    }),
  };

  private outputDir!: string | undefined;
  private manifestName!: string;
  private destructiveChangesName!: string;
  private manifestOutputPath!: string;
  private destructiveChangesOutputPath!: string;
  private componentSet!: ComponentSetExtra;
  private destructiveChangesOnly!: boolean;

  // eslint-disable-next-line sf-plugin/should-parse-flags
  public async run(): Promise<GitDiffCommandResult> {
    await this.createManifest();
    return this.formatResult();
  }

  protected async getSourceApiVersion(): Promise<Optional<string>> {
    const projectConfig = await this.project?.resolveProjectConfig();
    return getString(projectConfig, 'sourceApiVersion') ?? undefined;
  }

  protected async createManifest(): Promise<void> {
    const { flags, args } = await this.parse(GitDiffCommand);

    this.manifestName = 'package.xml';
    this.destructiveChangesName = 'destructiveChanges.xml';
    this.outputDir = flags['output-dir'];
    this.destructiveChangesOnly = flags['destructive-changes-only'];
    this.componentSet = await ComponentSetExtra.fromGitDiff({
      ref: [args.ref1, args.ref2 as string],
      fsPaths: flags['source-dir'],
    });

    if (flags['api-version']) {
      this.componentSet.apiVersion = flags['api-version'];
      this.componentSet.sourceApiVersion = flags['api-version'];
    }

    if (this.outputDir) {
      await fs.ensureDir(this.outputDir);
      this.manifestOutputPath = join(this.outputDir, this.manifestName);
      this.destructiveChangesOutputPath = join(this.outputDir, this.destructiveChangesName);
    } else {
      this.manifestOutputPath = this.manifestName;
      this.destructiveChangesOutputPath = this.destructiveChangesName;
    }

    if (this.componentSet.size) {
      if (this.componentSet.getTypesOfDestructiveChanges().length) {
        await fs.writeFile(
          this.destructiveChangesOutputPath,
          await this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST),
        );
      }
      if (this.destructiveChangesOnly) {
        if (this.componentSet.getTypesOfDestructiveChanges().length) {
          const emptyCompSet = new ComponentSetExtra();
          emptyCompSet.sourceApiVersion = this.componentSet.sourceApiVersion;
          return fs.writeFile(this.manifestOutputPath, await emptyCompSet.getPackageXml());
        }
        return;
      }
      return fs.writeFile(this.manifestOutputPath, await this.componentSet.getPackageXml());
    }
  }

  protected formatResult(): GitDiffCommandResult {
    if (!this.jsonEnabled()) {
      if (this.componentSet.size) {
        if (this.destructiveChangesOnly && !this.componentSet.getTypesOfDestructiveChanges().length) {
          this.log(messages.getMessage('noComponents'));
        } else if (this.outputDir) {
          this.log(messages.getMessage('successOutputDir', [this.manifestName, this.outputDir]));
          if (this.componentSet.getTypesOfDestructiveChanges().length) {
            this.log(messages.getMessage('successOutputDir', [this.destructiveChangesName, this.outputDir]));
          }
        } else {
          this.log(messages.getMessage('success', [this.manifestName]));
          if (this.componentSet.getTypesOfDestructiveChanges().length) {
            this.log(messages.getMessage('success', [this.destructiveChangesName]));
          }
        }
      } else {
        this.log(messages.getMessage('noComponents'));
      }
    }
    if (this.componentSet.getTypesOfDestructiveChanges().length) {
      return {
        manifest: { path: this.manifestOutputPath, name: this.manifestName },
        destructiveChanges: {
          path: this.destructiveChangesOutputPath,
          name: this.destructiveChangesName,
        },
      };
    } else if (this.componentSet.size && !this.destructiveChangesOnly) {
      return { manifest: { path: this.manifestOutputPath, name: this.manifestName } };
    } else {
      return {};
    }
  }
}
