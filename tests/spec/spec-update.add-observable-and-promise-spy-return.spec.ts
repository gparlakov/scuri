import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath, getTestFile, getTestFileContents } from './common';

describe('spec for a class with a method calling a dependency method', () => {
    it('should add EMPTY for the dep method returning an observable', async () => {
        // arrange
        const depsCallsReturnTypesFile = getTestFile('deps-calls-with-return-types.ts');
        const specFileName = depsCallsReturnTypesFile.replace('.ts', '.spec.ts');
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, getTestFileContents(depsCallsReturnTypesFile));
        tree.create(specFileName, getTestFileContents(specFileName));
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: true }, tree)
            .toPromise();

        // assert
        const specFile = result!.readContent(depsCallsReturnTypesFile.replace('.ts', '.spec.ts'));
        expect(specFile).toBeDefined();
        expect(specFile).toMatchInlineSnapshot(`
            "import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';
            import { ExampleComponent } from './deps-calls-with-return-types';
            import { autoSpy } from 'autoSpy';

            describe('ExampleComponent', () => {
                it('when aMethod is called it should', () => {
                    // arrange
                    const { build } = setup().default();
                    const e = build();
                    // act
                    e.aMethod();
                    // assert
                    // expect(e).toEqual
                });

              
            });

            function setup() {

              const service = autoSpy(ServiceWithMethods);
              service.observableReturning.and.returnValue(EMPTY);
              service.promiseReturning.and.returnValue(new Promise(res => {}));
              const builder = {
                service,
                default() {
                  return builder;
                },
                build() {
                  return new ExampleComponent(service);
                }
              };

              return builder;
            }
            "
        `);
    });

    it('should add EMPTY for the dep method returning an observable when dependency is already part of the spec', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('deps-calls-with-return-types-dep-included.ts');
        const specFileName = fileName.replace('.ts', '.spec.ts');
        tree.create(fileName, getTestFileContents(fileName));
        tree.create(specFileName, getTestFileContents(specFileName));
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: fileName, update: true }, tree)
            .toPromise();

        // assert
        const specFile = result!.readContent(fileName.replace('.ts', '.spec.ts'));
        expect(specFile).toBeDefined();
        expect(specFile).toMatchInlineSnapshot(`
            "import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';
            import { ExampleComponent } from './deps-calls-with-return-types';
            import { autoSpy } from 'autoSpy';

            describe('ExampleComponent', () => {
                it('when aMethod is called it should', () => {
                    // arrange
                    const { build } = setup().default();
                    const e = build();
                    // act
                    e.aMethod();
                    // assert
                    // expect(e).toEqual
                });
            });

            function setup() {
              const service = autoSpy(ServiceWithMethods);
              service.observableReturning.and.returnValue(EMPTY);
              service.promiseReturning.and.returnValue(new Promise(res => {}));
              
              const builder = {
                default() {
                  return builder;
                },
                build() {
                  return new ExampleComponent(service);
                }
              };

              return builder;
            }
            "
        `);
    });
});
