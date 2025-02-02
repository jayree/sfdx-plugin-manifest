/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// https://github.com/forcedotcom/source-tracking/blob/main/src/shared/localComponentSetArray.ts
import {
  ComponentSet,
  RegistryAccess,
  MetadataResolver,
  SourceComponent,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { Logger, NamedPackageDir } from '@salesforce/core';
import equal from 'fast-deep-equal';
import { getString } from '@salesforce/ts-types';
import { supportsPartialDelete, pathIsInFolder } from '@salesforce/source-tracking/lib/shared/functions.js';
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
import { VirtualTreeContainerExtra } from '../resolve/treeContainersExtra.js';

type GroupedFileInput = {
  packageDirs: NamedPackageDir[];
  adds: string[];
  modifies: string[];
  deletes: string[];
};
type GroupedFile = {
  path: string;
  adds: string[];
  modifies: string[];
  deletes: string[];
};

export const getGroupedFiles = (input: GroupedFileInput, byPackageDir = false): GroupedFile[] =>
  (byPackageDir ? getSequential(input) : getNonSequential(input)).filter(
    (group) => group.deletes.length || group.adds.length || group.modifies.length,
  );

const getSequential = ({ packageDirs, adds, modifies, deletes }: GroupedFileInput): GroupedFile[] =>
  packageDirs.map((pkgDir) => ({
    path: pkgDir.name,
    adds: adds.filter(pathIsInFolder(pkgDir.name)),
    modifies: modifies.filter(pathIsInFolder(pkgDir.name)),
    deletes: deletes.filter(pathIsInFolder(pkgDir.name)),
  }));

const getNonSequential = ({ packageDirs, adds, modifies, deletes }: GroupedFileInput): GroupedFile[] => [
  {
    adds,
    modifies,
    deletes,
    path: packageDirs.map((dir) => dir.name).join(';'),
  },
];

export const getComponentSets = ({
  groupings,
  sourceApiVersion,
  registry = new RegistryAccess(),
  resolverForNonDeletes,
  resolverForDeletes,
  virtualTreeContainer,
}: {
  groupings: GroupedFile[];
  sourceApiVersion?: string;
  registry: RegistryAccess;
  resolverForNonDeletes: MetadataResolver;
  resolverForDeletes: MetadataResolver;
  virtualTreeContainer: VirtualTreeContainerExtra;
}): ComponentSet[] => {
  const logger = Logger.childFromRoot('gitDiff:gitComponentSetArray');

  return groupings
    .map((grouping) => {
      logger.debug(
        `building componentSet for ${grouping.path} (deletes: ${grouping.deletes.length} adds: ${grouping.adds.length} modifies: ${grouping.modifies.length})`,
      );

      const componentSet = new ComponentSet(undefined, registry);
      if (sourceApiVersion) {
        componentSet.sourceApiVersion = sourceApiVersion;
      }

      const filterSourceBehaviorOptionsBetaDeletions = (component: SourceComponent): boolean => {
        const customLabelsType = registry.getTypeByName('customlabels');
        if (component.type === customLabelsType) {
          logger.debug(`remove '${component.xml as string}' from deletes due to sourceBehaviourOptionsBeta.`);
          return customLabelsType.strategies?.transformer !== 'decomposedLabels';
        }
        return true;
      };

      grouping.deletes
        .flatMap((filename) => resolverForDeletes.getComponentsFromPath(filename))
        .filter(isDefined)
        .filter(filterSourceBehaviorOptionsBetaDeletions)
        .forEach((component) => {
          // if the component supports partial delete AND there are files that are not deleted,
          // set the component for deploy, not for delete.
          if (supportsPartialDelete(component) && component.content && virtualTreeContainer.exists(component.content)) {
            // all bundle types have a directory name
            try {
              resolverForNonDeletes
                .getComponentsFromPath(component.content)
                .filter(isDefined)
                .map((nonDeletedComponent) => componentSet.add(nonDeletedComponent));
            } catch {
              logger.warn(
                `unable to find component at ${component.content}.  That's ok if it was supposed to be deleted`,
              );
            }
          } else {
            componentSet.add(component, DestructiveChangesType.POST);
          }
        });

      grouping.adds
        .flatMap((filename) => resolverForNonDeletes.getComponentsFromPath(filename))
        .filter(isDefined)
        .forEach((component) => componentSet.add(component));

      grouping.modifies
        .flat()
        .filter((filename) => {
          if (!parseMetadataXml(filename)) {
            resolverForNonDeletes
              .getComponentsFromPath(filename)
              .filter(isDefined)
              .forEach((component) => componentSet.add(component));
            return false;
          }
          return true;
        })
        .map((filename) => {
          const [ref2Component] = resolverForNonDeletes.getComponentsFromPath(filename).filter(isDefined); // git path only conaints files
          const [ref1Component] = resolverForDeletes.getComponentsFromPath(filename).filter(isDefined); // git path only conaints files
          return { ref1Component, ref2Component, filename };
        })
        .filter((comp) => {
          if (
            resolverForDeletes.forceIgnoredPaths.has(comp.filename) ||
            resolverForNonDeletes.forceIgnoredPaths.has(comp.filename)
          ) {
            return false;
          }
          return true;
        })
        .filter((comp) => {
          if (equal(comp.ref1Component.parseXmlSync(comp.filename), comp.ref2Component.parseXmlSync(comp.filename))) {
            return false;
          }
          return true;
        })
        .filter((comp) => {
          if (comp.ref1Component.type.strictDirectoryName === true || !comp.ref1Component.type.children) {
            resolverForNonDeletes
              .getComponentsFromPath(comp.filename)
              .filter(isDefined)
              .forEach((component) => componentSet.add(component));
            return false;
          }
          return true;
        })
        .forEach((comp) => {
          const getUniqueIdentifier = (component: SourceComponent): string =>
            `${component.type.name}#${getString(component, component.type.uniqueIdElement as string) as string}`;

          const ref2ChildUniqueIdArray = comp.ref2Component
            .getChildren()
            .map((childComponent) => getUniqueIdentifier(childComponent));
          const ref1ChildUniqueIdArray = comp.ref1Component
            .getChildren()
            .map((childComponent) => getUniqueIdentifier(childComponent));

          comp.ref1Component
            .getChildren()
            .filter((childComponent) => !ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent)))
            .map((component) => componentSet.add(component, DestructiveChangesType.POST)); // deleted
          comp.ref2Component
            .getChildren()
            .filter((childComponent) => !ref1ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent)))
            .map((component) => componentSet.add(component)); // added
          const childComponentsInRef1AndRef2 = comp.ref1Component
            .getChildren()
            .filter((childComponent) => ref2ChildUniqueIdArray.includes(getUniqueIdentifier(childComponent))); // modified?

          for (const childComponentRef1 of childComponentsInRef1AndRef2) {
            const [childComponentRef2] = comp.ref2Component
              .getChildren()
              .filter(
                (childComponent) => getUniqueIdentifier(childComponentRef1) === getUniqueIdentifier(childComponent),
              );
            if (!equal(childComponentRef1.parseXmlSync(), childComponentRef2.parseXmlSync())) {
              componentSet.add(childComponentRef2); // modified! -> add to added
            }
          }
        });

      // there may have been ignored files, but componentSet.add doesn't automatically track them.
      // We'll manually set the ignored paths from what the resolver has been tracking
      componentSet.forceIgnoredPaths = new Set(
        [...(componentSet.forceIgnoredPaths ?? [])]
          .concat(Array.from(resolverForDeletes.forceIgnoredPaths))
          .concat(Array.from(resolverForNonDeletes.forceIgnoredPaths)),
      );

      return componentSet;
    })
    .filter((componentSet) => componentSet.size > 0 || componentSet.forceIgnoredPaths?.size);
};
