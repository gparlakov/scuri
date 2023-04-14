import { join } from 'path';
import { readFileSync } from 'fs';
import { EOL } from 'os';

export const collectionPath = join(__dirname, '../../collection.json');


export const getTestFile = (fileName: string) => join(__dirname, './test-data', fileName);
export const getTestFileContents = (fullFilePath: string) => readFileSync(fullFilePath).toString('utf8');

export const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts');
export const depsCallsReturnTypesFileContents = () => getTestFileContents(depsCallsReturnTypesFile);

export function splitLines(s: string): string[] {
    return typeof s === 'string' ? s.replace(EOL, '\n').split('\n') : [];
}
