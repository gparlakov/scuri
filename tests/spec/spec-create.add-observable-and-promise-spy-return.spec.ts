import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import {
    collectionPath,
    depsCallsReturnTypesFile,
    depsCallsReturnTypesFileContents,
    getTestFile,
    getTestFileContents,
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
        // prettier-ignore
        expect(specFile).toMatch('service.promiseReturning.and.returnValue(new Promise(res => {}))');
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
        expect(ls[i++]).toEqual(`    withServiceProperty$(p$: Observable<string>) {`);
        expect(ls[i++]).toEqual(`        p$.subscribe({`);
        expect(ls[i++]).toEqual('            next: (v) => serviceProperty$.next(v),');
        expect(ls[i++]).toEqual('            error: (e) => serviceProperty$.error(e),');
        expect(ls[i++]).toEqual('            complete: () => serviceProperty$.complete()');
        expect(ls[i++]).toEqual('        });');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        // prettier-ignore
        expect(ls[i++]).toEqual(`    withServicePromiseProp(p: Promise<string>) {`);
        expect(ls[i++]).toEqual(`        p`);
        expect(ls[i++]).toEqual('            .then((v) => resolveServicePromiseProp(v))');
        expect(ls[i++]).toEqual('            .catch((e) => rejectServicePromiseProp(e));');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        // prettier-ignore
        expect(ls[i++]).toEqual(`    withServiceObservable$(o$: Observable<ClassDescription[]>) {`);
        expect(ls[i++]).toEqual(`        o$.subscribe({`);
        expect(ls[i++]).toEqual('            next: (v) => serviceObservable$.next(v),');
        expect(ls[i++]).toEqual('            error: (e) => serviceObservable$.error(e),');
        expect(ls[i++]).toEqual('            complete: () => serviceObservable$.complete()');
        expect(ls[i++]).toEqual('        });');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');

        // prettier-ignore
        expect(ls[i++]).toEqual(`    withServiceSubject$(s$: Observable<string>) {`);
        expect(ls[i++]).toEqual(`        s$.subscribe({`);
        expect(ls[i++]).toEqual('            next: (v) => serviceSubject$.next(v),');
        expect(ls[i++]).toEqual('            error: (e) => serviceSubject$.error(e),');
        expect(ls[i++]).toEqual('            complete: () => serviceSubject$.complete()');
        expect(ls[i++]).toEqual('        });');
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
            import { EMPTY, Observable, ReplaySubject } from 'rxjs';
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
                withServiceProperty$(p$: Observable<string>) {
                    p$.subscribe({
                        next: (v) => serviceProperty$.next(v),
                        error: (e) => serviceProperty$.error(e),
                        complete: () => serviceProperty$.complete()
                    });
                    return builder;
                },
                withServicePromiseProp(p: Promise<string>) {
                    p
                        .then((v) => resolveServicePromiseProp(v))
                        .catch((e) => rejectServicePromiseProp(e));
                    return builder;
                },
                withServiceObservable$(o$: Observable<ClassDescription[]>) {
                    o$.subscribe({
                        next: (v) => serviceObservable$.next(v),
                        error: (e) => serviceObservable$.error(e),
                        complete: () => serviceObservable$.complete()
                    });
                    return builder;
                },
                withServiceSubject$(s$: Observable<string>) {
                    s$.subscribe({
                        next: (v) => serviceSubject$.next(v),
                        error: (e) => serviceSubject$.error(e),
                        complete: () => serviceSubject$.complete()
                    });
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

    it('when dependencies used without accessing props or methods it should not throw and add properties and methods for dependency params of type <Observable>  and <Promise> not having undefined as prop name and dep name', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('create.when-used-in-if-expressions/component.ts');
        const specName = fileName.replace('.ts', '.spec.ts');

        tree.create(fileName, getTestFileContents(fileName));
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner
            .runSchematicAsync('spec', { name: fileName, update: false }, tree)
            .toPromise();

        // assert
        const specFile = result.readContent(specName);
        expect(specFile).toBeDefined();

        const ls = splitLines(specFile);

        let i = ls.findIndex((l) => l.includes('function setup()')) + 1;

        expect(ls[i++]).toEqual(
            '  const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);'
        );
        expect(ls[i++]).toEqual(
            '    const service = autoSpy(ServiceWithMethods, { observable$: serviceObservable$ });'
        );
        expect(ls[i++]).toEqual('    service.observableReturning.and.returnValue(EMPTY);');
        expect(ls[i++]).toEqual('  const builder = {');
        expect(ls[i++]).toEqual('    service,');
        expect(ls[i++]).toEqual(
            '    withServiceObservableReturningReturn(o: Observable<string>) {'
        );
        expect(ls[i++]).toEqual('        service.observableReturning.and.returnValue(o);');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');
        expect(ls[i++]).toEqual('    withServiceObservable$(o$: Observable<ClassDescription[]>) {');
        expect(ls[i++]).toEqual('        o$.subscribe({');
        expect(ls[i++]).toEqual('            next: (v) => serviceObservable$.next(v),');
        expect(ls[i++]).toEqual('            error: (e) => serviceObservable$.error(e),');
        expect(ls[i++]).toEqual('            complete: () => serviceObservable$.complete()');
        expect(ls[i++]).toEqual('        });');
        expect(ls[i++]).toEqual('        return builder;');
        expect(ls[i++]).toEqual('    },');
        expect(ls[i++]).toEqual('    default() {');
        expect(ls[i++]).toEqual('      return builder;');
        expect(ls[i++]).toEqual('    },');
        expect(ls[i++]).toEqual('    build() {');
        expect(ls[i++]).toEqual('      return new ExampleComponentForIfExpressions(service);');
        expect(ls[i++]).toEqual('    }');
        expect(ls[i++]).toEqual('  };');
        expect(ls[i++]).toEqual('');
        expect(ls[i++]).toEqual('  return builder;');
        expect(ls[i++]).toEqual('}');
    });
});
