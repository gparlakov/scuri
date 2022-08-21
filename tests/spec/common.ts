import { join } from 'path';
import { readFileSync } from 'fs';

export const collectionPath = join(__dirname, '../../collection.json');


export const getTestFile = (fileName: string) => join(__dirname, './test-data', fileName);
export const getTestFileContents = (fullFilePath: string) => readFileSync(fullFilePath).toString('utf8');

export const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts');
export const depsCallsReturnTypesFileContents = () => getTestFileContents(depsCallsReturnTypesFile);
