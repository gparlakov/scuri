import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import {
    collectionPath,
    depsCallsReturnTypesFile,
    depsCallsReturnTypesFileContents,
    splitLines,
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
        expect(specFile).toMatch('service.observableReturning.and.returnValue(EMPTY)');
        expect(specFile).toMatch(
            'service.promiseReturning.and.returnValue(new Promise(res => {}))'
        );
    });

    it('should add ReplaySubject/Promise for the dep property of types observable/promise', async () => {
        // arrange
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents());
        const specName = depsCallsReturnTypesFile.replace('.ts', '.spec.ts');
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: false }, tree)
            .toPromise();

        // assert
        const specFile = result.readContent(specName);
        expect(specFile).toBeDefined();
        const ls = splitLines(specFile);

        // start at line below setup function
        let i = ls.findIndex((l) => l.includes('function setup')) + 1;
        expect(ls[i++]).toEqual('  const serviceProperty$ = new ReplaySubject<string>(1);');
        expect(ls[i++]).toEqual('    const resolveServicePromiseProp: Function;');
        expect(ls[i++]).toEqual('    const rejectServicePromiseProp: Function;');
        expect(ls[i++]).toEqual('    const servicePromiseProp = new Promise((res, rej) => {');
        expect(ls[i++]).toEqual('        resolvePromiseProp = res;');
        expect(ls[i++]).toEqual('        rejectPromiseProp = rej;');
        expect(ls[i++]).toEqual('    });');
        // prettier-ignore
        expect(ls[i++]).toEqual('    const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);');
        expect(ls[i++]).toEqual('    const serviceSubject$ = new ReplaySubject<string>(1);');
        // prettier-ignore
        expect(ls[i++]).toEqual('    const service = autoSpy(ServiceWithMethods, { property$: serviceProperty$, promiseProp: servicePromiseProp, observable$: serviceObservable$, subject$: serviceSubject$ });');
    });

    it('should add methods for emitting from observable and promise deps calls and props', async () => {
        // arrange
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents());
        const specName = depsCallsReturnTypesFile.replace('.ts', '.spec.ts');
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: false }, tree)
            .toPromise();

        // assert
        const specFile = result!.readContent(specName);
        expect(specFile).toBeDefined();

        const ls = splitLines(specFile);

        // start at 2 lines below setup function
        let i = ls.findIndex((l) => l.includes('const builder')) + 2;
        // console.log(ls.slice(i));
        expect(ls[i++]).toEqual(`    withServiceJustAMethodReturn(j: ClassDescription) {`);
        expect(ls[i++]).toEqual('        service.justAMethod.and.returnValue(j);');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        expect(ls[i++]).toEqual(
            `    withServiceObservableReturningReturn(o: Observable<string>) {`
        );
        expect(ls[i++]).toEqual('        service.observableReturning.and.returnValue(o);');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        expect(ls[i++]).toEqual(`    withServicePromiseReturningReturn(p: Promise<string>) {`);
        expect(ls[i++]).toEqual('        service.promiseReturning.and.returnValue(p);');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        // prettier-ignore
        expect(ls[i++]).toEqual(`    withServiceProperty$Emit(p: string | Error, action: 'emit' | 'error' | 'complete' = 'emit') {`
        );
        expect(ls[i++]).toEqual(`        if (action === 'emit') {`);
        expect(ls[i++]).toEqual('            property$.next(p);');
        expect(ls[i++]).toEqual(`        } else if (action === 'error') {`);
        expect(ls[i++]).toEqual('            property$.error(p);');
        expect(ls[i++]).toEqual(`        } else {`);
        expect(ls[i++]).toEqual('            property$.complete();');
        expect(ls[i++]).toEqual('        }');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        expect(ls[i++]).toEqual(
            `    withServicePromiseProp(p: string | Error, action: 'resolve' | 'reject' = 'resolve') {`
        );
        expect(ls[i++]).toEqual(`        if (action === 'resolve') {`);
        expect(ls[i++]).toEqual('            resolvePromiseProp(p);');
        expect(ls[i++]).toEqual(`        } else {`);
        expect(ls[i++]).toEqual('            rejectPromiseProp(p);');
        expect(ls[i++]).toEqual('        }');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        expect(ls[i++]).toEqual(
            `    withServiceObservable$Emit(o: ClassDescription[] | Error, action: 'emit' | 'error' | 'complete' = 'emit') {`
        );
        expect(ls[i++]).toEqual(`        if (action === 'emit') {`);
        expect(ls[i++]).toEqual('            observable$.next(o);');
        expect(ls[i++]).toEqual(`        } else if (action === 'error') {`);
        expect(ls[i++]).toEqual('            observable$.error(o);');
        expect(ls[i++]).toEqual(`        } else {`);
        expect(ls[i++]).toEqual('            observable$.complete();');
        expect(ls[i++]).toEqual('        }');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        expect(ls[i++]).toEqual(
            `    withServiceSubject$Emit(s: string | Error, action: 'emit' | 'error' | 'complete' = 'emit') {`
        );
        expect(ls[i++]).toEqual(`        if (action === 'emit') {`);
        expect(ls[i++]).toEqual('            subject$.next(s);');
        expect(ls[i++]).toEqual(`        } else if (action === 'error') {`);
        expect(ls[i++]).toEqual('            subject$.error(s);');
        expect(ls[i++]).toEqual(`        } else {`);
        expect(ls[i++]).toEqual('            subject$.complete();');
        expect(ls[i++]).toEqual('        }');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');
    });

    it('should align with snapshot', async () => {
        // arrange
        const tree = Tree.empty();
        tree.create(depsCallsReturnTypesFile, depsCallsReturnTypesFileContents());
        const specName = depsCallsReturnTypesFile.replace('.ts', '.spec.ts');
        const runner = new SchematicTestRunner('schematics', collectionPath);

        // act
        const result = await runner
            .runSchematicAsync('spec', { name: depsCallsReturnTypesFile, update: false }, tree)
            .toPromise();

        // assert
        const specFile = result!.readContent(specName);
        expect(specFile).toMatchInlineSnapshot(`
            "import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';
            import { ExampleComponent } from './deps-calls-with-return-types';
            import { autoSpy } from 'autoSpy';
            import { EMPTY } from 'rxjs';

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
              it('when anotherMethod is called it should', () => {
                // arrange
                const { build } = setup().default();
                const e = build();
                // act
                e.anotherMethod();
                // assert
                // expect(e).toEqual
              });
              
            });

            function setup() {
              const serviceProperty$ = new ReplaySubject<string>(1);
                const resolveServicePromiseProp: Function;
                const rejectServicePromiseProp: Function;
                const servicePromiseProp = new Promise((res, rej) => {
                    resolvePromiseProp = res;
                    rejectPromiseProp = rej;
                });
                const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);
                const serviceSubject$ = new ReplaySubject<string>(1);
                const service = autoSpy(ServiceWithMethods, { property$: serviceProperty$, promiseProp: servicePromiseProp, observable$: serviceObservable$, subject$: serviceSubject$ });
                service.observableReturning.and.returnValue(EMPTY);
                service.promiseReturning.and.returnValue(new Promise(res => {}));
              const builder = {
                service,
                withServiceJustAMethodReturn(j: ClassDescription) {
                    service.justAMethod.and.returnValue(j);
                    return builder;
                },
                withServiceObservableReturningReturn(o: Observable<string>) {
                    service.observableReturning.and.returnValue(o);
                    return builder;
                },
                withServicePromiseReturningReturn(p: Promise<string>) {
                    service.promiseReturning.and.returnValue(p);
                    return builder;
                },
                withServiceProperty$Emit(p: string | Error, action: 'emit' | 'error' | 'complete' = 'emit') {
                    if (action === 'emit') {
                        property$.next(p);
                    } else if (action === 'error') {
                        property$.error(p);
                    } else {
                        property$.complete();
                    }
                    return builder;
                },
                withServicePromiseProp(p: string | Error, action: 'resolve' | 'reject' = 'resolve') {
                    if (action === 'resolve') {
                        resolvePromiseProp(p);
                    } else {
                        rejectPromiseProp(p);
                    }
                    return builder;
                },
                withServiceObservable$Emit(o: ClassDescription[] | Error, action: 'emit' | 'error' | 'complete' = 'emit') {
                    if (action === 'emit') {
                        observable$.next(o);
                    } else if (action === 'error') {
                        observable$.error(o);
                    } else {
                        observable$.complete();
                    }
                    return builder;
                },
                withServiceSubject$Emit(s: string | Error, action: 'emit' | 'error' | 'complete' = 'emit') {
                    if (action === 'emit') {
                        subject$.next(s);
                    } else if (action === 'error') {
                        subject$.error(s);
                    } else {
                        subject$.complete();
                    }
                    return builder;
                },
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
