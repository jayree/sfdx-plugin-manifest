/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArgInput } from '@oclif/core/lib/interfaces';
import { FlagsConfig, flags } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import kit from '@salesforce/kit';
import { ComponentSet, VirtualTreeContainer, DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand.js';
import {
  getGitResults,
  createVirtualTreeContainer,
  fixComponentSetChilds,
  getGitDiff,
  debug,
  getGitArgsFromArgv,
  gitLines,
} from '../../../../utils/gitdiff.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');

const logger = new Logger({ useIcons: false });

// eslint-disable-next-line @typescript-eslint/require-await
const unexpectedArgument = async (input: string): Promise<string> => {
  if (input.includes('-')) {
    throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
  }
  return input;
};

export interface GitDiffCommandResult {
  destructiveChanges: object;
  manifest: object;
}

export default class GitDiff extends JayreeSfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = messages.getMessage('examples').split(os.EOL);

  public static args: ArgInput = [
    {
      name: 'ref1',
      required: true,
      description: 'base commit or branch',
      parse: unexpectedArgument,
      hidden: false,
    },
    {
      name: 'ref2',
      required: false,
      description: 'commit or branch to compare to the base commit',
      parse: unexpectedArgument,
      hidden: false,
    },
  ];

  protected static flagsConfig: FlagsConfig = {
    sourcepath: flags.array({
      char: 'p',
      description: messages.getMessage('sourcepath'),
    }),
    outputdir: flags.string({
      char: 'o',
      description: messages.getMessage('outputdir'),
      default: '',
    }),
    destructivechangesonly: flags.boolean({
      char: 'd',
      description: messages.getMessage('destructivechangesonly'),
      default: false,
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  private isOutputEnabled;
  private outputDir: string;
  private destructiveChangesOnly: boolean;
  private projectRoot: string;
  private sourceApiVersion: string;
  private destructiveChanges: string;
  private manifest: string;

  private gitLines: gitLines;
  private ref1VirtualTreeContainer: VirtualTreeContainer;
  private ref2VirtualTreeContainer: VirtualTreeContainer;
  private componentSet: ComponentSet;
  private outputErrors: string[];
  private outputWarnings: string[];
  private fsPaths: string[];

  public async run(): Promise<GitDiffCommandResult> {
    const sourcepath = this.getFlag<string[]>('sourcepath');
    this.destructiveChangesOnly = this.getFlag<boolean>('destructivechangesonly');
    this.outputDir = this.getFlag<string>('outputdir');
    this.projectRoot = this.project.getPath();
    this.sourceApiVersion = (await this.project.retrieveSfProjectJson()).getContents().sourceApiVersion;
    this.destructiveChanges = join(this.outputDir, 'destructiveChanges.xml');
    this.manifest = join(this.outputDir, 'package.xml');

    debug({
      outputDir: this.outputDir,
      projectRoot: this.projectRoot,
    });

    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(this.argv.find((arg) => arg === '--json') || isContentTypeJSON);
    const gitArgs = await getGitArgsFromArgv(
      this.args.ref1 as string,
      this.args.ref2 as string,
      this.argv,
      this.projectRoot
    );
    debug({ gitArgs });
    const tasks = new Listr(
      [
        {
          title: `Execute 'git --no-pager diff --name-status --no-renames ${gitArgs.refString}'`,
          task: async (ctx, task): Promise<void> => {
            const { gitlines, warnings } = await getGitDiff(gitArgs.ref1, gitArgs.ref2, this.projectRoot);
            this.gitLines = gitlines;
            this.outputWarnings = warnings;
            task.output = `Changed files: ${this.gitLines.length}`;
          },
          options: { persistentOutput: true },
        },
        {
          // title: 'Warning output',
          skip: (): boolean => !this.outputWarnings?.length,
          task: (ctx, task): void => {
            debug({ warnings: this.outputWarnings });
            const moreWarnings = this.outputWarnings.splice(5);
            for (const message of this.outputWarnings) {
              task.output = `Warning: unstaged file ${message}`;
            }
            task.output = moreWarnings.length ? `... ${moreWarnings.length} more warnings` : '';
          },
          options: { persistentOutput: true, bottomBar: 6 },
        },
        {
          title: 'Create virtual tree container',
          skip: (): boolean => !this.gitLines.length,
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: `ref1: ${gitArgs.ref1}`,
                  task: async (): Promise<void> => {
                    this.ref1VirtualTreeContainer = await createVirtualTreeContainer(
                      gitArgs.ref1,
                      this.projectRoot,
                      this.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                    );
                  },
                },
                {
                  title: gitArgs.ref2 !== '' ? `ref2: ${gitArgs.ref2}` : `ref2: (staging area)`,
                  task: async (): Promise<void> => {
                    this.ref2VirtualTreeContainer = await createVirtualTreeContainer(
                      gitArgs.ref2,
                      this.projectRoot,
                      this.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                    );
                  },
                },
              ],
              { concurrent: true }
            ) as Listr,
        },
        {
          title: 'Analyze git diff results',
          skip: (): boolean => !this.gitLines.length,
          task: async (ctx, task): Promise<void> => {
            if (sourcepath) {
              this.fsPaths = sourcepath.map((filepath) => {
                filepath = resolve(filepath);
                if (
                  !this.ref1VirtualTreeContainer.exists(filepath) &&
                  !this.ref2VirtualTreeContainer.exists(filepath)
                ) {
                  throw new SfError(`The sourcepath "${filepath}" is not a valid source file path.`);
                }
                return filepath;
              });
              debug(`fsPaths: ${this.fsPaths.join(', ')}`);
            }

            const { manifest, output } = await getGitResults(
              this.gitLines,
              this.ref1VirtualTreeContainer,
              this.ref2VirtualTreeContainer,
              this.destructiveChangesOnly,
              this.fsPaths
            );
            task.output = `Added: ${output.counts.added}, Deleted: ${output.counts.deleted}, Modified: ${
              output.counts.modified
            }, Unchanged: ${output.counts.unchanged}, Ignored: ${output.counts.ignored}${
              output.counts.error ? `, Errors: ${output.counts.error}` : ''
            }`;
            this.outputErrors = output.errors;

            debug({ manifest });
            this.componentSet = fixComponentSetChilds(manifest);
            this.componentSet.sourceApiVersion = this.sourceApiVersion;
          },
          options: { persistentOutput: true },
        },
        {
          // title: 'Error output',
          skip: (): boolean => !this.outputErrors?.length,
          task: (ctx, task): void => {
            debug({ errors: this.outputErrors });
            const moreErrors = this.outputErrors.splice(5);
            for (const message of this.outputErrors) {
              task.output = `Error: ${message}`;
            }
            task.output = moreErrors.length ? `... ${moreErrors.length} more errors` : '';
          },
          options: { persistentOutput: true, bottomBar: 6 },
        },
        {
          title: 'Generate manifests',
          skip: (): boolean => !this.componentSet?.size,
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: this.manifest,
                  skip: (): boolean => !this.isOutputEnabled,
                  task: async (): Promise<void> => {
                    await fs.ensureDir(dirname(this.manifest));
                    await fs.writeFile(this.manifest, await this.componentSet.getPackageXml());
                  },
                  options: { persistentOutput: true },
                },
                {
                  title: this.destructiveChanges,
                  skip: (): boolean =>
                    !this.componentSet.getTypesOfDestructiveChanges().length || !this.isOutputEnabled,
                  task: async (): Promise<void> => {
                    await fs.ensureDir(dirname(this.destructiveChanges));
                    await fs.writeFile(
                      this.destructiveChanges,
                      await this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST)
                    );
                  },
                  options: { persistentOutput: true },
                },
              ],
              { concurrent: true }
            ) as Listr,
        },
      ],
      {
        rendererOptions: { showTimer: true, collapse: false, lazy: true, collapseErrors: false },
        rendererSilent: !this.isOutputEnabled,
        rendererFallback: debug.enabled,
      }
    );

    try {
      await tasks.run();
      return {
        destructiveChanges: await this.componentSet?.getObject(DestructiveChangesType.POST),
        manifest: await this.componentSet?.getObject(),
      };
    } catch (e) {
      if (debug.enabled && this.isOutputEnabled) {
        logger.fail((e as Error).message);
      }
      throw e;
    }
  }
}
