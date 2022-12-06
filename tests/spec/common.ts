import { normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { LogEntry } from '@angular-devkit/core/src/logger';
import { ScopedHost } from '@angular-devkit/core/src/virtual-fs/host';
import { HostCreateTree, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { log } from 'console';
import { readFileSync } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import { filter } from 'rxjs/operators';
import { getSpecFilePathName } from '../../src/common/get-spec-file-name';
import { SpecOptions } from '../../src/spec/index';

export const collectionPath = join(__dirname, '../../collection.json');

export const getTestFile = (fileName: string, fromRoot: string = join(__dirname, './test-data')) =>
    join(fromRoot, fileName);
export const getTestFileContents = (fullFilePath: string, tree?: Tree) =>
    (tree?.get(fullFilePath)?.content ?? readFileSync(fullFilePath)).toString('utf8');

export const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts');
export const depsCallsReturnTypesFileContents = (t?: Tree) =>
    getTestFileContents(depsCallsReturnTypesFile, t);

export function splitLines(s: string): string[] {
    return typeof s === 'string' ? s.split(/\n\r|\n|\r\n/) : [];
}

export function setupBase(
    testFilesFolder: string,
    fileName: string,
    t: Tree | 'absolute' = Tree.empty()
) {
    const tree = t === 'absolute' ? getTestDataAbsoluteTree() : t;
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

            runner.logger.pipe(filter((f) => filterFn(f))).subscribe((l) => log(mapFn(l)));

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
        async run(o?: Partial<SpecOptions>) {
            return runner
                .runSchematicAsync('spec', { name: fileUnderTestFullPath, ...o }, tree)
                .toPromise();
        },
        splitLines(s: string): string[] {
            return typeof s === 'string' ? s.replace(EOL, '\n').replace(/\r\n|\n\r|\n/g, '\n').split('\n') : [];
        },
        logTreeFiles(t: Tree) {
            const files: string[] = [];
            t.visit(f => files.push(f));
            log(files);
        }
    };

    return builder;
}

export function getTestDataAbsoluteTree() {
    return new HostCreateTree(new ScopedHost(new NodeJsSyncHost(), normalize(getTestFile(''))));
}
