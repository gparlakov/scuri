import { Tree } from '@angular-devkit/schematics';
import { describeSource } from '../../src/common/read/read';
import { ClassDescription, DependencyCallDescription } from '../../src/types';
import {
    getTestDataAbsoluteTree, getTestFile, getTestFileContents,
} from './common';

const depsCallsReturnTypesFile = 'deps-calls-with-return-types.ts';
const folder = 'all-deps-calls-with-return-types';

describe('Dependency method calls ', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = getTestDataAbsoluteTree(`${folder}/`);
    });

    fit('should read the names and return types of dependency methods', async () => {
        const fullFileName = getTestFile(`${folder}/${depsCallsReturnTypesFile}`);
        console.log(fullFileName)
        // arrange
        const x = describeSource(
            fullFileName,
            getTestFileContents(fullFileName),
            tree
        );
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
