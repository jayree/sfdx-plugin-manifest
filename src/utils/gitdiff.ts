/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename, sep, posix, dirname } from 'path';
import * as util from 'util';
import * as fs from 'fs-extra';
import * as equal from 'fast-deep-equal';
import {
  ComponentSet,
  RegistryAccess,
  registry,
  VirtualDirectory,
  VirtualTreeContainer,
  SourceComponent,
  NodeFSTreeContainer as FSTreeContainer,
  MetadataResolver,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import { debug as Debug } from 'debug';
import git from 'isomorphic-git';

export const debug = Debug('jayree:manifest:git:diff');

const registryAccess = new RegistryAccess();

type gitResults = {
  manifest: ComponentSet;
  output: {
    unchanged: string[];
    ignored: { ref1: string[]; ref2: string[] };
    counts: { added: number; deleted: number; modified: number; unchanged: number; ignored: number; error: number };
    errors: string[];
  };
};

type git = {
  ref1: string;
  ref2: string;
  refString: string;
};

export type gitLines = Array<{ path: string; status: string }>;

async function resolveRef(refOrig: string, dir: string): Promise<string> {
  if (refOrig === '') {
    return '';
  }

  const getCommitLog = async (ref: string): Promise<{ oid: string; parents: string[] }> => {
    try {
      const [log] = await git.log({
        fs,
        dir,
        ref,
        depth: 1,
      });
      return { oid: log.oid, parents: log.commit.parent };
    } catch (error) {
      throw new Error(
        `ambiguous argument '${ref}': unknown revision or path not in the working tree.
See more help with --help`
      );
    }
  };

  if (!['~', '^'].some((el) => refOrig.includes(el))) {
    return (await getCommitLog(refOrig)).oid;
  }

  const firstIndex = [refOrig.indexOf('^'), refOrig.indexOf('~')]
    .filter((a) => a >= 0)
    .reduce((a, b) => Math.min(a, b));
  let path = refOrig.substring(firstIndex);
  let ref = refOrig.substring(0, firstIndex);
  while (path.length && ref !== undefined) {
    if (path.substring(0, 1) === '^') {
      path = path.substring(1);
      let next = Number(path.substring(0, 1));
      path = next ? path.substring(1) : path;
      next = next ? next : 1;
      ref = (await getCommitLog(ref)).parents[next - 1];
    } else if (path.substring(0, 1) === '~') {
      path = path.substring(1);
      let next = Number(path.substring(0, 1));
      path = next ? path.substring(1) : path;
      next = next ? next : 1;
      for (let index = 0; index <= next - 1; index++) {
        ref = (await getCommitLog(ref)).parents[0];
      }
    } else {
      ref = undefined;
    }
  }
  if (ref === undefined) {
    throw new Error(`ambiguous argument '${refOrig}': unknown revision or path not in the working tree.`);
  }
  return ref;
}

export async function getGitArgsFromArgv(ref1: string, ref2: string, argv: string[], dir: string): Promise<git> {
  const newArgv: string[] = [];
  while (argv.length) {
    let [e] = argv.splice(0, 1);
    if (e.includes('=')) {
      // skip parameter=value
    } else if (e.includes('-')) {
      // remove value
      [e] = argv.splice(0, 1);
    } else {
      newArgv.push(e);
    }
  }
  argv = newArgv;

  let refString = ref1;
  const a = argv.join('.').split('.');

  if ((a.length === 3 || a.length === 4) && typeof ref2 === 'undefined') {
    ref1 = a[0];
    ref2 = a[a.length - 1];
  } else if (a.length === 2 && typeof ref2 !== 'undefined') {
    refString = `${ref1}..${ref2}`;
  } else if (a.length === 1) {
    ref2 = '';
  } else {
    throw new Error(`Ambiguous ${util.format('argument%s', argv.length === 1 ? '' : 's')}: ${argv.join(', ')}
See more help with --help`);
  }

  ref1 = await resolveRef(ref1, dir);
  ref2 = await resolveRef(ref2, dir);

  if (a.length === 4) {
    ref1 = (
      await git.findMergeBase({
        fs,
        dir,
        oids: [ref2, ref1],
      })
    )[0] as string;
  }

  return { ref1, ref2, refString };
}

export function ensureOSPath(path: string): string {
  return path.split(posix.sep).join(sep);
}

export function ensureGitPath(path: string): string {
  return path.split(sep).join(posix.sep);
}

export async function createVirtualTreeContainer(
  ref: string,
  dir: string,
  modifiedFiles: string[]
): Promise<VirtualTreeContainer> {
  const paths = (await git.listFiles({ fs, dir, ref })).map((p) => ensureOSPath(p));
  const oid = await git.resolveRef({ fs, dir, ref });
  const virtualDirectoryByFullPath = new Map<string, VirtualDirectory>();
  for (const filename of paths) {
    let dirPath = dirname(filename);
    virtualDirectoryByFullPath.set(dirPath, {
      dirPath,
      children: Array.from(
        new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
          name: basename(filename),
          data:
            parseMetadataXml(filename) && modifiedFiles.includes(filename)
              ? Buffer.from((await git.readBlob({ fs, dir, oid, filepath: ensureGitPath(filename) })).blob)
              : Buffer.from(''),
        })
      ),
    });
    const splits = filename.split(sep);
    for (let i = 0; i < splits.length - 2; i++) {
      dirPath = splits.slice(0, i + 1).join(sep);
      virtualDirectoryByFullPath.set(dirPath, {
        dirPath,
        children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add(splits[i + 1])),
      });
    }
  }
  return new VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
}

export async function analyzeFile(
  path: string,
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<{
  status: number;
  toManifest?: SourceComponent[];
  toDestructiveChanges?: SourceComponent[];
}> {
  if (!parseMetadataXml(path)) {
    return { status: 0 };
  }

  const ref2resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
  const [ref2Component] = ref2resolver.getComponentsFromPath(path); // git path only conaints files

  const ref1resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const [ref1Component] = ref1resolver.getComponentsFromPath(path); // git path only conaints files

  if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
    return { status: -1 };
  }

  if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
    return { status: 0 };
  }

  const ref2ChildUniqueIdArray = ref2Component.getChildren().map((childComponent) => {
    return getUniqueIdentifier(childComponent);
  });
  const ref1ChildUniqueIdArray = ref1Component.getChildren().map((childComponent) => {
    return getUniqueIdentifier(childComponent);
  });

  const childComponentsNotInRef2 = ref1Component
    .getChildren()
    .filter((childComponent) => !ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // deleted
  const childComponentsNotInRef1 = ref2Component
    .getChildren()
    .filter((childComponent) => !ref1ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // added
  const childComponentsInRef1AndRef2 = ref1Component
    .getChildren()
    .filter((childComponent) => ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // modified?

  debug({ childComponentsNotInRef2, childComponentsNotInRef1, childComponentsInRef1AndRef2 });

  for (const childComponentRef1 of childComponentsInRef1AndRef2) {
    const [childComponentRef2] = ref2Component
      .getChildren()
      .filter((childComponent) => getUniqueIdentifier(childComponentRef1) === getUniqueIdentifier(childComponent));
    if (!equal(await childComponentRef1.parseXml(), await childComponentRef2.parseXml())) {
      childComponentsNotInRef1.push(childComponentRef2); // modified! -> add to added
    }
  }

  debug({ childComponentsNotInRef1 });

  return {
    status: childComponentsNotInRef2.length + childComponentsNotInRef1.length,
    toManifest: childComponentsNotInRef1,
    toDestructiveChanges: childComponentsNotInRef2,
  };
}

function getUniqueIdentifier(component: SourceComponent): string {
  return `${component.type.name}#${component[component.type.uniqueIdElement] as string}`;
}

async function getFileStateChanges(
  commitHash1: string,
  commitHash2: string,
  dir: string
): Promise<
  [
    {
      path: string;
      status: string;
    }
  ]
> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: commitHash1 }), commitHash2 ? git.TREE({ ref: commitHash2 }) : git.STAGE()],
    async map(filepath, [A, B]) {
      if (filepath === '.' || (await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
        return;
      }

      const Aoid = await A?.oid();
      const Boid = await B?.oid();

      let type = 'EQ';
      if (Aoid !== Boid) {
        type = 'M';
      }
      if (Aoid === undefined) {
        type = 'A';
      }
      if (Boid === undefined) {
        type = 'D';
      }

      if (type !== 'EQ') {
        return {
          path: filepath,
          status: type,
        };
      }
    },
  });
}

export async function getGitDiff(
  sfdxProjectFolders: string[],
  ref1: string,
  ref2: string,
  dir: string
): Promise<gitLines> {
  let gitLines = (await getFileStateChanges(ref1, ref2, dir))
    .map((line) => {
      return { path: ensureOSPath(line.path), status: line.status };
    })
    .filter((l) =>
      sfdxProjectFolders.some((f) => {
        return l.path.startsWith(f);
      })
    );

  gitLines = gitLines.filter((line) => {
    if (line.status === 'D') {
      for (const sfdxFolder of sfdxProjectFolders) {
        const defaultFolder = join(sfdxFolder, 'main', 'default');
        const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
        const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
        if (target) {
          debug(`rename: ${line.path} -> ${target.path}`);
          return false;
        }
      }
    }
    return true;
  });
  debug({ gitLines });
  return gitLines;
}

// eslint-disable-next-line complexity
export async function getGitResults(
  gitLines: gitLines,
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer,
  destructiveChangesOnly: boolean
): Promise<gitResults> {
  const results = {
    manifest: new ComponentSet(undefined, registryAccess),
    output: {
      unchanged: [],
      ignored: { ref1: [], ref2: [] },
      counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
      errors: [],
    },
  };
  const ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const ref2Resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);

  const getComponentsFromPath = (resolver: MetadataResolver, path: string): SourceComponent[] => {
    let result: SourceComponent[] = [];
    try {
      result = resolver.getComponentsFromPath(path);
    } catch (error) {
      results.output.counts.error++;
      results.output.errors.push(error);
    }
    return result;
  };

  for (const [, { status, path }] of gitLines.entries()) {
    if (status === 'D') {
      for (const c of getComponentsFromPath(ref1Resolver, path)) {
        if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
          results.manifest.add(c, DestructiveChangesType.POST);
          results.output.counts.deleted++;
        } else {
          try {
            // in case a binary source file of a bundle was deleted, check if the bundle ist still valid and update instead of delete
            ref2Resolver.getComponentsFromPath(c.xml);
            if (!destructiveChangesOnly) {
              results.manifest.add(c);
              results.output.counts.added++;
            }
          } catch (error) {
            results.output.counts.error++;
            results.output.errors.push(error);
          }
        }
      }
    } else if (status === 'A') {
      if (!destructiveChangesOnly) {
        for (const c of getComponentsFromPath(ref2Resolver, path)) {
          results.manifest.add(c);
          results.output.counts.added++;
        }
      }
    } else {
      const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
      if (check.status === 0) {
        if (!destructiveChangesOnly) {
          for (const c of getComponentsFromPath(ref2Resolver, path)) {
            results.manifest.add(c);
            results.output.counts.added++;
          }
        }
      } else if (check.status === -1) {
        results.output.unchanged.push(path);
        results.output.counts.unchanged++;
      } else {
        if (check.toDestructiveChanges.length > 0 || (check.toManifest.length > 0 && !destructiveChangesOnly)) {
          results.output.counts.modified++;
        }
        for (const c of check.toDestructiveChanges) {
          results.manifest.add(c, DestructiveChangesType.POST);
        }
        if (!destructiveChangesOnly) {
          for (const c of check.toManifest) {
            results.manifest.add(c);
          }
        }
      }
    }
  }

  results.output.ignored = {
    ref1: Array.from(ref1Resolver.forceIgnoredPaths),
    ref2: Array.from(ref2Resolver.forceIgnoredPaths),
  };
  results.output.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;

  return results;
}

export function fixComponentSetChilds(cs: ComponentSet): ComponentSet {
  let sourceComponents = cs.getSourceComponents();
  // SDR library is more strict and avoids fixes like this
  const childsTobeReplacedByParent = [
    ...Object.keys(registry.types.workflow.children.types),
    ...Object.keys(registry.types.sharingrules.children.types),
  ];
  sourceComponents = sourceComponents.map((component) => {
    if (!component.isMarkedForDelete() && childsTobeReplacedByParent.includes(component.type.id)) {
      debug(
        `replace: ${component.type.name}:${component.fullName} -> ${component.parent.type.name}:${component.parent.fullName}`
      );
      return component.parent;
    }
    return component;
  });

  return new ComponentSet(sourceComponents, registryAccess);
}
