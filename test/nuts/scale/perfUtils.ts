/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
