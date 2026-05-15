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
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'mocha';
import { VirtualTreeContainerExtra } from '../../../src/SDR-extra/resolve/treeContainersExtra.js';

describe('VirtualTreeContainerExtra.fromFilePathsWithBlobs', () => {
  it('builds nested virtual directories from file paths', () => {
    const classPath = join('force-app', 'main', 'default', 'classes', 'MyClass.cls');
    const triggerPath = join('force-app', 'main', 'default', 'triggers', 'MyTrigger.trigger');
    const tree = VirtualTreeContainerExtra.fromFilePathsWithBlobs(
      [classPath, triggerPath],
      new Map([[classPath, Buffer.from('public class MyClass {}')]]),
    );

    assert.equal(tree.exists(join('force-app')), true);
    assert.equal(tree.isDirectory(join('force-app', 'main', 'default', 'classes')), true);
    assert.deepEqual(tree.readDirectory(join('force-app', 'main', 'default')).sort(), ['classes', 'triggers']);
    assert.deepEqual(tree.readDirectory(join('force-app', 'main', 'default', 'classes')), ['MyClass.cls']);
  });

  it('attaches buffer data only to exact matching files', () => {
    const classPath = join('force-app', 'main', 'default', 'classes', 'MyClass.cls');
    const otherClassPath = join('force-app', 'main', 'default', 'classes', 'OtherClass.cls');
    const tree = VirtualTreeContainerExtra.fromFilePathsWithBlobs(
      [classPath, otherClassPath],
      new Map([[classPath, Buffer.from('public class MyClass {}')]]),
    );

    assert.equal(tree.readFileSync(classPath).toString('utf8'), 'public class MyClass {}');
    assert.equal(tree.readFileSync(otherClassPath).length, 0);
  });

  it('ignores non-string paths at runtime', () => {
    const classPath = join('force-app', 'main', 'default', 'classes', 'MyClass.cls');
    const tree = VirtualTreeContainerExtra.fromFilePathsWithBlobs(
      [classPath, undefined, 42] as unknown as string[],
      new Map([[classPath, Buffer.from('public class MyClass {}')]]),
    );

    assert.equal(tree.exists(classPath), true);
    assert.equal(tree.exists('42'), false);
  });
});
