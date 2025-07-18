/*
 * Copyright 2025, jayree
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
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as os from 'node:os';
import { Performance } from 'node:perf_hooks';
import fs from 'graceful-fs';
import { expect } from 'chai';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(__filename);

export const recordPerf = async (testName: string, performance: Performance): Promise<void> => {
  const fileTarget = path.join(__dirname, 'output.json');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existing = fs.existsSync(fileTarget) ? JSON.parse(await fs.promises.readFile(fileTarget, 'utf8')) : [];
  await fs.promises.writeFile(
    fileTarget,
    JSON.stringify(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      existing.concat(
        performance.getEntriesByType('measure').map((m) => ({
          name: `${testName}-${m.name}-${os.platform()}`,
          value: Math.trunc(m.duration),
          unit: 'ms',
        })),
      ),
      null,
      2,
    ),
  );
  performance.clearMarks();
  performance.clearMeasures();
  expect(fs.existsSync(fileTarget)).to.equal(true);
};
