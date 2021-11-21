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

export const NodeFSTreeContainer = FSTreeContainer;

export const debug = Debug('jayree:manifest:git:diff');

const registryAccess = new RegistryAccess();

export interface Ctx {
  projectRoot: string;
  sfdxProjectFolders: string[];
  sourceApiVersion: string;
  gitLines: Array<{ path: string; status: string }>;
  gitResults: {
    manifest: ComponentSet;
    destructiveChanges: ComponentSet;
    unchanged: string[];
    ignored: { ref1: string[]; ref2: string[] };
    counts: { added: number; deleted: number; modified: number; unchanged: number; ignored: number; error: number };
    errors: string[];
  };
  ref1VirtualTreeContainer: VirtualTreeContainer;
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer;
  destructiveChangesComponentSet: ComponentSet;
  manifestComponentSet: ComponentSet;
  git: {
    ref1: string;
    ref2: string;
    ref1ref2: string;
  };
  destructiveChanges: {
    files: string[];
  };
  manifest: {
    file: string;
  };
}

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

export async function getGitArgsFromArgv(ref1: string, ref2: string, argv: string[], dir: string): Promise<Ctx['git']> {
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

  let ref1ref2 = ref1;
  const a = argv.join('.').split('.');

  if ((a.length === 3 || a.length === 4) && typeof ref2 === 'undefined') {
    ref1 = a[0];
    ref2 = a[a.length - 1];
  } else if (a.length === 2 && typeof ref2 !== 'undefined') {
    ref1ref2 = `${ref1}..${ref2}`;
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

  return { ref1, ref2, ref1ref2 };
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
  debug({ modifiedFiles });
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
): Promise<Ctx['gitLines']> {
  let gitLines = (await getFileStateChanges(ref1, ref2, dir))
    .map((line) => {
      return { path: ensureOSPath(line.path), status: line.status };
    })
    .filter((l) =>
      sfdxProjectFolders.some((f) => {
        return l.path.startsWith(f);
      })
    );

  const renames = [];
  gitLines = gitLines.filter((line) => {
    if (line.status === 'D') {
      for (const sfdxFolder of sfdxProjectFolders) {
        const defaultFolder = join(sfdxFolder, 'main', 'default');
        const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
        const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
        if (target) {
          renames.push({ from: line.path, to: target.path });
          return false;
        }
      }
    }
    return true;
  });
  debug({ gitLines, renames, sfdxProjectFolders });
  return gitLines;
}

export async function getGitResults(
  gitLines: Ctx['gitLines'],
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<Ctx['gitResults']> {
  const results = {
    manifest: new ComponentSet(undefined, registryAccess),
    destructiveChanges: new ComponentSet(undefined, registryAccess),
    unchanged: [],
    ignored: { ref1: [], ref2: [] },
    counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
    errors: [],
  };
  const ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const ref2Resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);

  for (const [, { status, path }] of gitLines.entries()) {
    if (status === 'D') {
      for (const c of ref1Resolver.getComponentsFromPath(path)) {
        if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
          results.destructiveChanges.add(c, DestructiveChangesType.POST);
          results.counts.deleted++;
        } else {
          try {
            ref2Resolver.getComponentsFromPath(c.xml);
            results.manifest.add(c);
            results.counts.added++;
          } catch (error) {
            results.counts.error++;
            results.errors.push(error);
          }
        }
      }
    } else if (status === 'A') {
      for (const c of ref2Resolver.getComponentsFromPath(path)) {
        results.manifest.add(c);
        results.counts.added++;
      }
    } else {
      const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
      if (check.status === 0) {
        for (const c of ref2Resolver.getComponentsFromPath(path)) {
          results.manifest.add(c);
          results.counts.added++;
        }
      } else if (check.status === -1) {
        results.unchanged.push(path);
        results.counts.unchanged++;
      } else {
        results.counts.modified++;
        for (const c of check.toDestructiveChanges) {
          results.destructiveChanges.add(c, DestructiveChangesType.POST);
        }
        for (const c of check.toManifest) {
          results.manifest.add(c);
        }
      }
    }
  }

  results.ignored = {
    ref1: Array.from(ref1Resolver.forceIgnoredPaths),
    ref2: Array.from(ref2Resolver.forceIgnoredPaths),
  };
  results.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;

  return results;
}

export function buildManifestComponentSet(cs: ComponentSet, forDestructiveChanges = false): ComponentSet {
  let csArray = cs.toArray();
  // SDR library is more strict and avoids fixes like this
  if (!forDestructiveChanges) {
    const childsTobeReplacedByParent = [
      ...Object.keys(registry.types.workflow.children.types),
      ...Object.keys(registry.types.sharingrules.children.types),
    ];
    csArray = csArray.map((component) => {
      if (childsTobeReplacedByParent.includes(component.type.id)) {
        return component.parent;
      }
      return component;
    });
  }

  return new ComponentSet(
    csArray.sort((a, b) => {
      if (a.type.name === b.type.name) {
        return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
      }
      return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
    }),
    registryAccess
  );
}
