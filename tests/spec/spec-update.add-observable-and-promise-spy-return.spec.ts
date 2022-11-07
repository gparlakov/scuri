import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath, getTestFile, getTestFileContents } from './common';

describe('spec for a class with a method calling a dependency method', () => {
    it('should add EMPTY/a Promise for the dep method returning an observable/promise', async () => {
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
            import { EMPTY, Observable, ReplaySubject } from 'rxjs';

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
                default() {
                  return builder;
                },
                build() {
                  return new ExampleComponent(service);
                },
                
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
                },};

              return builder;
            }
            "
        `);
    });

    it('should add EMPTY/a Promise for the dep method returning an observable/Promise when dependency is already part of the spec', async () => {
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
            import { EMPTY, Observable } from 'rxjs';

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
                },
                
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
                },};

              return builder;
            }
            "
        `);
    });

    it('should add methods for changing the property when adding it as a dep', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods/component.ts');
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

        expect(specFile).toMatch('withServiceObservableReturningReturn(o: Observable<string>');
        expect(specFile).toMatchInlineSnapshot(`
            "
            import { ExampleComponent } from './component';
            import { autoSpy } from 'autoSpy';
            import { ServiceWithMethods } from './dependency';
            import { EMPTY, Observable, ReplaySubject } from 'rxjs';

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
              const service = autoSpy(ServiceWithMethods);

              const builder = {
                service,
                withJustReturns(j: ClassDescription) {
                  // this should still be in for the just-a-method method
                  service.justAMethod.and.returnValue(j);
                  return builder;
                },
                withPromiseProp() {
                  // this should still be in for the promise prop method
                  return builder;
                },
                default() {
                  return builder;
                },
                build() {
                  return new ExampleComponent(service);
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
                },};

              return builder;
            }
            "
        `);
    });

    it('should add methods for changing the property when adding it as a dep when builder ends with comma', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods.with-comma/component.ts');
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

        expect(specFile).toMatch('withServiceObservableReturningReturn(o: Observable<string>');
        expect(specFile).toMatchInlineSnapshot(`
            "
            import { ExampleComponent } from './component';
            import { autoSpy } from 'autoSpy';
            import { ServiceWithMethods } from './dependency';
            import { EMPTY, Observable, ReplaySubject } from 'rxjs';

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
              const service = autoSpy(ServiceWithMethods);

              const builder = {
                service,
                withJustReturns(j: ClassDescription) {
                  // this should still be in for the just-a-method method
                  service.justAMethod.and.returnValue(j);
                  return builder;
                },
                withPromiseProp() {
                  // this should still be in for the promise prop method
                  return builder;
                },
                default() {
                  return builder;
                },
                build() {
                  return new ExampleComponent(service);
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
                },};

              return builder;
            }
            "
        `);
    });

    it('should add properties to added deps', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods.add-props/component.ts');
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

        expect(specFile).toMatch('const serviceProperty$ = new ReplaySubject<string>(1);');
        expect(specFile).toMatch('const resolveServicePromiseProp: Function;');
        expect(specFile).toMatch('const rejectServicePromiseProp: Function;');
        expect(specFile).toMatch('const servicePromiseProp = new Promise((res, rej) => {');
        expect(specFile).toMatch('    resolvePromiseProp = res;');
        expect(specFile).toMatch('    rejectPromiseProp = rej;');
        expect(specFile).toMatch('});');
        expect(specFile).toMatch(
            'const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);'
        );
        expect(specFile).toMatch('const serviceSubject$ = new ReplaySubject<string>(1);');
        // prettier-ignore
        expect(specFile).toMatch('const service = autoSpy(ServiceWithMethods, { property$: serviceProperty$, promiseProp: servicePromiseProp, observable$: serviceObservable$, subject$: serviceSubject$ });');
        expect(specFile).toMatch(
            ' const dep1Observable$ = new ReplaySubject<ClassDescription[]>(1);'
        );
        expect(specFile).toMatch('const resolveDep1PromiseProp: Function;');
        expect(specFile).toMatch('const rejectDep1PromiseProp: Function;');
        expect(specFile).toMatch('const dep1PromiseProp = new Promise((res, rej) => {');
        expect(specFile).toMatch('    resolvePromiseProp = res;');
        expect(specFile).toMatch('    rejectPromiseProp = rej;');
        expect(specFile).toMatch('});');
        // prettier-ignore
        expect(specFile).toMatch('const dep1 = autoSpy(JustADep, { observable$: dep1Observable$, promiseProp: dep1PromiseProp });');
    });

    it('should only add properties that are not added yet (should not duplicate props)', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods.add-props-no-duplication/component.ts');
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
        expect(specFile).toMatch(
            'const service = autoSpy(ServiceWithMethods, {observable$: someOther$, property$: serviceProperty$, promiseProp: servicePromiseProp, subject$: serviceSubject$});'
        );
    });

    it('should only declare properties that are not declared yet (should not duplicate props)', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods.add-props-no-duplication/component.ts');
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
        expect(specFile).toMatch('const someOther$ = new BehaviorSubject(null);');
        // don't add the same property mock 👇 as it already exists 👆
        expect(specFile).not.toMatch(
            'const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);'
        );
    });

    it('should only declare properties that are not declared yet (should not duplicate props)', async () => {
        // arrange
        const tree = Tree.empty();
        const fileName = getTestFile('update.add-methods.add-props-no-duplication/component.ts');
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

        expect(specFile).toMatch(
            `service.promiseReturning.and.returnValue(Promise.resolve('some other thing'));`
        );
        // don't add the same method spy 👇 as it already exists 👆
        expect(specFile).not.toMatch(
            'service.promiseReturning.and.returnValue(new Promise(res => {}));'
        );
    });
});
