import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import {
    collectionPath,
    depsCallsReturnTypesFile,
    depsCallsReturnTypesFileContents,
} from './common';

describe('spec for a class with a method calling a dependency method', () => {
    it('should add EMPTY for the dep method returning an observable', async () => {
        // arrange
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents());
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: false }, tree)
            .toPromise();

        // assert

        const specFile = result!.readContent(depsCallsReturnTypesFile.replace('.ts', '.spec.ts'));
        expect(specFile).toBeDefined();
        expect(specFile).toMatch('service.observableReturning.and.returnValue(EMPTY)')
        expect(specFile).toMatch('service.promiseReturning.and.returnValue(new Promise(res => {}))');
    });

    fit('should add EMPTY for the dep property of types observable and promise', async () => {
        // arrange
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents());
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: false }, tree)
            .toPromise();

        // assert

        const specFile = result!.readContent(depsCallsReturnTypesFile.replace('.ts', '.spec.ts'));
        expect(specFile).toBeDefined();
        expect('fail').toBe('testing')
        // console.log()
        // expect(specFile).toMatch('service = autoSpy(ServiceWithMethods, {property$: property$, promiseProp: promiseProp');
    });
});
