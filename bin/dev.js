#!/usr/bin/env -S node --loader ts-node/esm

import oclif from '@oclif/core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = path.join(__dirname, '..', 'tsconfig.json');

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development';

import tsnode from 'ts-node';
tsnode.register({ project });

// In dev mode, always show stack traces
oclif.settings.debug = true;

// Start the CLI
oclif.run(undefined, __filename).then(oclif.flush).catch(oclif.Errors.handle);
