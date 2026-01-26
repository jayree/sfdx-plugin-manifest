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
import { ComponentSet, RegistryAccess, MetadataResolver } from '@salesforce/source-deploy-retrieve';
import { SfProject, Lifecycle, Logger, NamedPackageDir } from '@salesforce/core';
import { GitRepo } from '../shared/local/localGitRepo.js';
import { getComponentSets, getGroupedFiles } from '../shared/gitComponentSetArray.js';
import { VirtualTreeContainerExtra } from '../resolve/treeContainersExtra.js';

const logger = Logger.childFromRoot('gitDiff:resolver');

/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export class GitDiffResolver {
  private ref2VirtualTreeContainer!: VirtualTreeContainerExtra;
  private ref1Resolver!: MetadataResolver;
  private ref2Resolver!: MetadataResolver;
  private dir: string;
  private packagesDirs: NamedPackageDir[];
  private localRepo: GitRepo;
  private registry: RegistryAccess;
  private project: SfProject;

  /**
   * @param dir SFDX project directory
   */
  public constructor(project: SfProject, registry?: RegistryAccess) {
    this.project = project;
    this.dir = project.getPath();
    this.registry = registry ?? new RegistryAccess();
    this.packagesDirs = project.getUniquePackageDirectories();
    this.localRepo = GitRepo.getInstance({
      dir: this.dir,
      packageDirs: this.packagesDirs,
      registry: this.registry,
    });
  }

  public async resolve(ref1: string, ref2: string | undefined): Promise<ComponentSet> {
    if (ref2 === undefined) {
      const { ref1: r1, ref2: r2 } = await this.localRepo.resolveMultiRefString(ref1);
      ref1 = r1;
      ref2 = r2;
    } else {
      const [r1, r2] = await Promise.all([
        this.localRepo.resolveSingleRefString(ref1),
        this.localRepo.resolveSingleRefString(ref2),
      ]);
      ref1 = r1;
      ref2 = r2;
    }

    logger.debug({ ref1, ref2 });

    await this.localRepo.getStatus(ref1, ref2);

    const [ref1VirtualTreeContainer, ref2VirtualTreeContainer] = await Promise.all([
      VirtualTreeContainerExtra.fromGitRef(ref1, this.dir, this.localRepo.getModifyFilenames()),
      VirtualTreeContainerExtra.fromGitRef(ref2, this.dir, this.localRepo.getModifyFilenames()),
    ]);

    this.ref2VirtualTreeContainer = ref2VirtualTreeContainer;
    this.ref1Resolver = new MetadataResolver(this.registry, ref1VirtualTreeContainer);
    this.ref2Resolver = new MetadataResolver(this.registry, this.ref2VirtualTreeContainer);

    const cs = (await this.gitChangesAsComponentSet(false))?.[0] ?? new ComponentSet();

    if (cs.forceIgnoredPaths?.size) {
      const lifecycle = Lifecycle.getInstance();
      // eslint-disable-next-line @typescript-eslint/await-thenable
      for await (const file of cs.forceIgnoredPaths) {
        await lifecycle.emitWarning(`The forceignored file ${file} was ignored.`);
      }
    }

    return cs;
  }

  private async gitChangesAsComponentSet(byPackageDir?: boolean): Promise<ComponentSet[]> {
    const projectConfig = (await this.project.resolveProjectConfig()) as {
      sourceApiVersion?: string;
      pushPackageDirectoriesSequentially?: boolean;
    };

    const sourceApiVersion = projectConfig.sourceApiVersion;

    const adds = this.localRepo.getAddFilenames();
    const modifies = this.localRepo.getModifyFilenames();
    const deletes = this.localRepo.getDeleteFilenames();

    const groupings = getGroupedFiles(
      {
        packageDirs: this.packagesDirs,
        adds,
        modifies,
        deletes,
      },
      byPackageDir ?? Boolean(projectConfig.pushPackageDirectoriesSequentially),
    );

    return getComponentSets({
      groupings,
      sourceApiVersion,
      registry: this.registry,
      resolverForDeletes: this.ref1Resolver,
      resolverForNonDeletes: this.ref2Resolver,
      virtualTreeContainer: this.ref2VirtualTreeContainer,
    });
  }
}
