/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { join, dirname, relative } from 'path';
import { FlagsConfig, flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import * as kit from '@salesforce/kit';
import {
  ComponentSet,
  VirtualTreeContainer,
  NodeFSTreeContainer,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';
import {
  getGitResults,
  createVirtualTreeContainer,
  fixComponentSetChilds,
  getGitDiff,
  debug,
  ensureOSPath,
  getGitArgsFromArgv,
  gitLines,
} from '../../../../utils/gitdiff';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'gitdiff');

const logger = new Logger({ useIcons: false });

// workaround until listr2 can catch emitWarnings with v4.0
// eslint-disable-next-line @typescript-eslint/unbound-method
const original = process.emitWarning;

process.emitWarning = (warning: string): void => {
  process.once('beforeExit', () => {
    return original(warning);
  });
};

const unexpectedArgument = (input: string): string => {
  if (input.includes('-')) {
    throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
  }
  return input;
};

export default class GitDiff extends JayreeSfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = messages.getMessage('examples').split(os.EOL);

  public static args = [
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
    outputdir: flags.string({
      char: 'o',
      description: messages.getMessage('outputdir'),
      default: '',
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  private isOutputEnabled;
  private outputDir: string;
  private projectRoot: string;
  private sfdxProjectFolders: string[];
  private sourceApiVersion: string;
  private destructiveChanges: string;
  private manifest: string;

  private gitLines: gitLines;
  private ref1VirtualTreeContainer: VirtualTreeContainer;
  private ref2VirtualTreeContainer: VirtualTreeContainer | NodeFSTreeContainer;
  private componentSet: ComponentSet;
  private outputErrors: string[];

  public async run(): Promise<AnyJson> {
    this.outputDir = this.getFlag<string>('outputdir');
    this.projectRoot = this.project.getPath();
    this.sfdxProjectFolders = this.project.getPackageDirectories().map((p) => ensureOSPath(p.path));
    this.sourceApiVersion = (await this.project.retrieveSfdxProjectJson()).getContents().sourceApiVersion;
    this.destructiveChanges = join(this.projectRoot, this.outputDir, 'destructiveChanges.xml');
    this.manifest = join(this.projectRoot, this.outputDir, 'package.xml');

    debug({
      outputDir: this.outputDir,
      projectRoot: this.projectRoot,
      sfdxProjectFolders: this.sfdxProjectFolders,
    });

    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
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
          title: 'Analyze sfdx-project',
          task: (ctx, task): void => {
            task.output = `packageDirectories: ${this.sfdxProjectFolders.length} sourceApiVersion: ${this.sourceApiVersion}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: `Execute 'git --no-pager diff --name-status --no-renames ${gitArgs.refString}'`,
          task: async (ctx, task): Promise<void> => {
            this.gitLines = await getGitDiff(this.sfdxProjectFolders, gitArgs.ref1, gitArgs.ref2, this.projectRoot);
            task.output = `Changed files: ${this.gitLines.length}`;
          },
          options: { persistentOutput: true },
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
                  title: gitArgs.ref2 !== '' ? `ref2: ${gitArgs.ref2}` : undefined,
                  task: async (): Promise<void> => {
                    this.ref2VirtualTreeContainer =
                      gitArgs.ref2 !== ''
                        ? await createVirtualTreeContainer(
                            gitArgs.ref2,
                            this.projectRoot,
                            this.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                          )
                        : new NodeFSTreeContainer();
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
            const { manifest, output } = await getGitResults(
              this.gitLines,
              this.ref1VirtualTreeContainer,
              this.ref2VirtualTreeContainer
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
          skip: (): boolean => !(this.outputErrors && this.outputErrors.length),
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
          skip: (): boolean => !(this.componentSet && this.componentSet.size),
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: relative(this.projectRoot, this.manifest),
                  task: async (): Promise<void> => {
                    await fs.ensureDir(dirname(this.manifest));
                    await fs.writeFile(this.manifest, this.componentSet.getPackageXml());
                  },
                  options: { persistentOutput: true },
                },
                {
                  title: relative(this.projectRoot, this.destructiveChanges),
                  skip: (): boolean => !this.componentSet.getTypesOfDestructiveChanges().length,
                  task: async (): Promise<void> => {
                    await fs.ensureDir(dirname(this.destructiveChanges));
                    await fs.writeFile(
                      this.destructiveChanges,
                      this.componentSet.getPackageXml(undefined, DestructiveChangesType.POST)
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
        destructiveChanges: this.componentSet?.getObject(DestructiveChangesType.POST),
        manifest: this.componentSet?.getObject(),
      } as unknown as AnyJson;
    } catch (e) {
      if (debug.enabled && this.isOutputEnabled) {
        logger.fail((e as Error).message);
      }
      throw e;
    }
  }
}
