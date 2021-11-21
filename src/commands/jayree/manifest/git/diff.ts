/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { join, dirname } from 'path';
import { FlagsConfig, flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import * as kit from '@salesforce/kit';
import { ComponentSet, VirtualTreeContainer, DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';
import {
  getGitResults,
  createVirtualTreeContainer,
  NodeFSTreeContainer,
  buildManifestComponentSet,
  getGitDiff,
  Ctx,
  debug,
  ensureOSPath,
  getGitArgsFromArgv,
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
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  private isOutputEnabled;
  private outputDir: string;

  public async run(): Promise<AnyJson> {
    this.outputDir = this.getFlag<string>('outputdir');
    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
    const gitArgs = await getGitArgsFromArgv(
      this.args.ref1 as string,
      this.args.ref2 as string,
      this.argv,
      this.project.getPath()
    );
    debug(gitArgs);
    const tasks = new Listr<Ctx>(
      [
        {
          title: 'Analyze sfdx-project',
          task: async (ctx, task): Promise<void> => {
            ctx.projectRoot = this.project.getPath();
            ctx.sfdxProjectFolders = this.project.getPackageDirectories().map((p) => ensureOSPath(p.path));
            ctx.sourceApiVersion = (await this.project.retrieveSfdxProjectJson()).getContents().sourceApiVersion;
            task.output = `packageDirectories: ${ctx.sfdxProjectFolders.length} sourceApiVersion: ${ctx.sourceApiVersion}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: "Execute 'git --no-pager diff --name-status --no-renames <pending>'",
          task: async (ctx, task): Promise<void> => {
            ctx.git = gitArgs;
            task.title = `Execute 'git --no-pager diff --name-status --no-renames ${ctx.git.ref1ref2}'`;
            ctx.gitLines = await getGitDiff(ctx.sfdxProjectFolders, ctx.git.ref1, ctx.git.ref2, ctx.projectRoot);
            task.output = `Changed files: ${ctx.gitLines.length}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: 'Create virtual tree container',
          skip: (ctx): boolean => ctx.gitLines.length === 0,
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: `ref1: ${ctx.git.ref1}`,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx): Promise<void> => {
                    ctx.ref1VirtualTreeContainer = await createVirtualTreeContainer(
                      ctx.git.ref1,
                      ctx.projectRoot,
                      ctx.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                    );
                  },
                },
                {
                  title: ctx.git.ref2 !== '' ? `ref2: ${ctx.git.ref2}` : undefined,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx): Promise<void> => {
                    ctx.ref2VirtualTreeContainer =
                      ctx.git.ref2 !== ''
                        ? await createVirtualTreeContainer(
                            ctx.git.ref2,
                            ctx.projectRoot,
                            ctx.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
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
          skip: (ctx): boolean => ctx.gitLines.length === 0,
          task: async (ctx, task): Promise<void> => {
            ctx.gitResults = await getGitResults(
              ctx.gitLines,
              ctx.ref1VirtualTreeContainer,
              ctx.ref2VirtualTreeContainer
            );
            task.output = `Added: ${ctx.gitResults.counts.added}, Deleted: ${
              ctx.gitResults.counts.deleted
            }, Modified: ${ctx.gitResults.counts.modified}, Unchanged: ${ctx.gitResults.counts.unchanged}, Ignored: ${
              ctx.gitResults.counts.ignored
            }${ctx.gitResults.counts.error ? `, Errors: ${ctx.gitResults.counts.error}` : ''}`;
          },
          options: { persistentOutput: true },
        },
        {
          // title: 'Error output',
          skip: (ctx): boolean => !ctx.gitResults?.errors.length,
          task: (ctx, task): void => {
            const errors = [...ctx.gitResults.errors];
            const moreErrors = errors.splice(5);
            for (const message of errors) {
              task.output = `Error: ${message}`;
            }
            task.output = moreErrors.length ? `... ${moreErrors.length} more errors` : '';
          },
          options: { persistentOutput: true, bottomBar: 6 },
        },
        {
          title: 'Generate manifests',
          skip: (ctx): boolean =>
            !ctx.gitResults || (!ctx.gitResults.manifest.size && !ctx.gitResults.destructiveChanges.size),
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: join(this.outputDir, 'destructiveChanges.xml'),
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  skip: (ctx): boolean => !ctx.gitResults.destructiveChanges.size,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx, task): Promise<void> => {
                    ctx.destructiveChangesComponentSet = buildManifestComponentSet(
                      ctx.gitResults.destructiveChanges,
                      true
                    );
                    if (
                      !ctx.destructiveChangesComponentSet.getObject(DestructiveChangesType.POST).Package.types.length
                    ) {
                      task.skip();
                      return;
                    }
                    ctx.destructiveChangesComponentSet.sourceApiVersion = ctx.sourceApiVersion;
                    ctx.destructiveChanges = {
                      files: [
                        join(ctx.projectRoot, this.outputDir, 'destructiveChanges.xml'),
                        join(ctx.projectRoot, this.outputDir, 'package.xml'),
                      ],
                    };
                    await fs.ensureDir(dirname(ctx.destructiveChanges.files[0]));
                    await fs.writeFile(
                      ctx.destructiveChanges.files[0],
                      ctx.destructiveChangesComponentSet.getPackageXml(undefined, DestructiveChangesType.POST)
                    );

                    await fs.writeFile(
                      ctx.destructiveChanges.files[1],
                      ctx.destructiveChangesComponentSet.getPackageXml()
                    );
                  },
                  options: { persistentOutput: true },
                },
                {
                  title: join(this.outputDir, 'package.xml'),
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  skip: (ctx): boolean => !ctx.gitResults.manifest.size,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx, task): Promise<void> => {
                    ctx.manifestComponentSet = buildManifestComponentSet(ctx.gitResults.manifest);
                    if (!ctx.manifestComponentSet.getObject().Package.types.length) {
                      task.skip();
                      return;
                    }
                    ctx.manifestComponentSet.sourceApiVersion = ctx.sourceApiVersion;
                    ctx.manifest = { file: join(ctx.projectRoot, this.outputDir, 'package.xml') };
                    await fs.ensureDir(dirname(ctx.manifest.file));
                    await fs.writeFile(ctx.manifest.file, ctx.manifestComponentSet.getPackageXml());
                  },
                  options: { persistentOutput: true },
                },
              ],
              { concurrent: true, exitOnError: false }
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
      const context = await tasks.run();
      if (debug.enabled && this.isOutputEnabled) {
        logger.success(
          `Context: ${JSON.stringify(
            context,
            (key, value) => {
              if (value instanceof ComponentSet && value !== null) {
                let types = value.getObject().Package.types;
                if (types.length === 0) {
                  types = value.getObject(DestructiveChangesType.POST).Package.types;
                }
                return types;
              }
              if (value instanceof VirtualTreeContainer) {
                return typeof value;
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return value;
            },
            2
          )}`
        );
      }
      return {
        destructiveChanges: context.destructiveChangesComponentSet?.getObject(DestructiveChangesType.POST),
        manifest: context.manifestComponentSet?.getObject(),
      } as unknown as AnyJson;
    } catch (e) {
      if (debug.enabled && this.isOutputEnabled) {
        logger.fail((e as Error).message);
      }
      throw e;
    }
  }
}
