import { join } from 'path';
import { readFileSync } from 'fs';

export const collectionPath = join(__dirname, '../../src/collection.json');

export const depsCallsReturnTypesFile = join(__dirname, './test-data/deps-calls-with-return-types.ts');
export const depsCallsReturnTypesFileContents = () =>
    readFileSync(depsCallsReturnTypesFile).toString('utf8');
