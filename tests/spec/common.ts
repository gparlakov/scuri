import { LogEntry } from '@angular-devkit/core/src/logger';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readFileSync } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import { filter } from 'rxjs/operators';
import { getSpecFilePathName } from '../../src/common/get-spec-file-name';

export const collectionPath = join(__dirname, '../../collection.json');

export const getTestFile = (fileName: string) => join(__dirname, './test-data', fileName);
export const getTestFileContents = (fullFilePath: string) =>
    readFileSync(fullFilePath).toString('utf8');

export const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts');
export const depsCallsReturnTypesFileContents = () => getTestFileContents(depsCallsReturnTypesFile);

export function splitLines(s: string): string[] {
    return typeof s === 'string' ? s.split(/\n\r|\n|\r\n/) : [];
}

export function setupBase(testFilesFolder: string, fileName: string) {
    const tree = Tree.empty();
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const fileUnderTestFullPath = getTestFile(`${testFilesFolder}/${fileName}`);

    const builder = {
        testFilesFolder,
        fullFileName: fileUnderTestFullPath,
        testFileName: getSpecFilePathName(fileUnderTestFullPath),
        tree,
        runner,
        log(o?: { map?: (l: LogEntry) => unknown; filter?: string | ((l: LogEntry) => boolean) }) {
            const mapFn = typeof o?.map === 'function' ? o.map : (m: LogEntry) => m;
            const filterFn =
                typeof o?.filter === 'function'
                    ? o.filter
                    : typeof o?.filter === 'string'
                    ? (m: LogEntry) =>
                          m.name.includes(o.filter as string) ||
                          m.message.includes(o.filter as string)
                    : () => true;

            const c = console; // hide from tslint
            runner.logger.pipe(filter((f) => filterFn(f))).subscribe((l) => c.log(mapFn(l)));

            return builder;
        },
        add(name: string, contents?: string) {
            tree.create(name, contents ?? getTestFileContents(name));
            return builder;
        },
        default() {
            return builder.add(fileUnderTestFullPath, getTestFileContents(fileUnderTestFullPath));
        },
        build() {
            return tree;
        },
        async run(o?: { framework?: string }) {
            return runner
                .runSchematicAsync('spec', { ...o, name: fileUnderTestFullPath }, tree)
                .toPromise();
        },
        splitLines(s: string): string[] {
            return typeof s === 'string' ? s.replace(EOL, '\n').split('\n') : [];
        }
    };

    return builder;
}
