import { normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { Logger } from '@angular-devkit/core/src/logger';
import { ScopedHost } from '@angular-devkit/core/src/virtual-fs/host';
import { HostCreateTree, Tree } from '@angular-devkit/schematics';
import { log } from 'console';
import { setLogger } from '../../src/common/logger';
import { describeSource } from '../../src/common/read/read';
import { ClassDescription, DependencyCallDescription } from '../../src/types';
import { getTestFile } from './common';

describe('Dependency method calls ', () => {

    let tree: Tree;
    beforeEach(() => {
        tree = new HostCreateTree(new ScopedHost(new NodeJsSyncHost(), normalize(getTestFile(''))));
    });

    it('should read the names and return types of dependency methods', async () => {
        // arrange
        const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts', '/');
        const depsCallsReturnTypesFileContents = tree.read(depsCallsReturnTypesFile)?.toString()!;
        const baseLogger = new Logger('base');
        setLogger(baseLogger);
        baseLogger.subscribe(log);
        const x = describeSource(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents, tree);
        // const files: string[] = [];
        // tree.visit(f => files.push(f));
        log(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents)//, files.filter(f => !f.includes('node_modules')))
        // act
        const classDescription: ClassDescription = x[0] as ClassDescription;

        // assert
        expect(classDescription.depsCallsAndTypes).toBeDefined();

        const returnTypes = classDescription.depsCallsAndTypes;
        expect(returnTypes).toEqual(
            new Map([
                [
                    'ServiceWithMethods',
                    new Map<string, DependencyCallDescription | string>([
                        [
                            'aVoidMethod',
                            {
                                kind: 'other',
                                name: 'aVoidMethod',
                                signature: 'function',
                                type: 'void',
                                typeParams: [],
                            },
                        ],
                        [
                            'justAMethod',
                            {
                                kind: 'other',
                                name: 'justAMethod',
                                signature: 'function',
                                type: 'ClassDescription',
                                typeParams: [],
                            },
                        ],
                        [
                            'observableReturning',
                            {
                                kind: 'observable',
                                name: 'observableReturning',
                                signature: 'function',
                                type: 'Observable<string>',
                                typeParams: ['string'],
                            },
                        ],
                        [
                            'promiseReturning',
                            {
                                kind: 'promise',
                                name: 'promiseReturning',
                                signature: 'function',
                                type: 'Promise<string>',
                                typeParams: ['string'],
                            },
                        ],
                        [
                            'property$',
                            {
                                kind: 'observable',
                                name: 'property$',
                                signature: 'property',
                                type: 'BehaviorSubject<string>',
                                typeParams: ['string'],
                            },
                        ],
                        [
                            'promiseProp',
                            {
                                kind: 'promise',
                                name: 'promiseProp',
                                signature: 'property',
                                type: 'Promise<string>',
                                typeParams: ['string'],
                            },
                        ],
                        [
                            'observable$',
                            {
                                kind: 'observable',
                                name: 'observable$',
                                signature: 'property',
                                type: 'Observable<ClassDescription[]>',
                                typeParams: ['ClassDescription[]'],
                            },
                        ],
                        [
                            'subject$',
                            {
                                kind: 'observable',
                                name: 'subject$',
                                signature: 'property',
                                type: 'Subject<string>',
                                typeParams: ['string'],
                            },
                        ],
                        [
                            'aNeverMethod',
                            {
                                kind: 'other',
                                name: 'aNeverMethod',
                                signature: 'function',
                                type: 'void',
                                typeParams: [],
                            },
                        ],
                    ]),
                ],
            ])
        );
    });
});
