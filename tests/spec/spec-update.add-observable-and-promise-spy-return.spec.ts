import { setupBase } from './common';

const file = 'deps-calls-with-return-types.ts';
const folder = 'update-add-observable-and-promise-spy-return';

describe('spec for a class with a method calling a dependency method', () => {
    it('should add EMPTY/a Promise for the dep method returning an observable/promise', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);
        expect(specFile).toBeDefined();
        expect(specFile).toMatchInlineSnapshot(`
            "import { ExampleComponent } from './deps-calls-with-return-types';
            import { EMPTY, Observable, ReplaySubject } from 'rxjs';
            import { autoSpy } from 'autoSpy';
            import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';

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
             let resolvePromiseProp: Function;
             let rejectPromiseProp: Function;
             const servicePromiseProp = new Promise((res, rej) => {
                 resolvePromiseProp = res;
                 rejectPromiseProp = rej;
             });
             const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);
             const serviceSubject$ = new ReplaySubject<string>(1);
             const service = autoSpy(ServiceWithMethods, { property$: serviceProperty$, promiseProp: servicePromiseProp, observable$: serviceObservable$, subject$: serviceSubject$ });
                service.observableReturning.and.returnValue(EMPTY);
                service.promiseReturning.and.returnValue(new Promise(res => {}));
                const serviceProperty$ = new ReplaySubject<string>(1);
                const resolveServicePromiseProp: Function;
                const rejectServicePromiseProp: Function;
                const servicePromiseProp = new Promise((res, rej) => {
                    resolvePromiseProp = res;
                    rejectPromiseProp = rej;
                });
                const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);
                const serviceSubject$ = new ReplaySubject<string>(1);
                const service = autoSpy(ServiceWithMethods, {
                    property$: serviceProperty$,
                    promiseProp: servicePromiseProp,
                    observable$: serviceObservable$,
                    subject$: serviceSubject$,
                });
                service.observableReturning.and.returnValue(EMPTY);
                service.promiseReturning.and.returnValue(new Promise((res) => {}));
                const builder = {
                    service,
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
                            complete: () => serviceProperty$.complete(),
                        });
                        return builder;
                    },
                    withServicePromiseProp(p: Promise<string>) {
                        p.then((v) => resolveServicePromiseProp(v)).catch((e) => rejectServicePromiseProp(e));
                        return builder;
                    },
                    withServiceObservable$(o$: Observable<ClassDescription[]>) {
                        o$.subscribe({
                            next: (v) => serviceObservable$.next(v),
                            error: (e) => serviceObservable$.error(e),
                            complete: () => serviceObservable$.complete(),
                        });
                        return builder;
                    },
                    default() {
                        return builder;
                    },
                    build() {
                        return new ExampleComponent(service);
                    },
                withServicePromiseReturningReturn(p: Promise<string>) {
                        service.promiseReturning.and.returnValue(p);
                        return builder;
                    },
                    withServicePromiseProp(p: Promise<string>) {
                        p
                            .then((v) => resolveServicePromiseProp(v))
                            .catch((e) => rejectServicePromiseProp(e));
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
        const { run, fullFileName, add, testFileName, tree } = setupBase(
            folder,
            'deps-calls-with-return-types-dep-included.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);
        expect(specFile).toBeDefined();
        expect(specFile).toMatchSnapshot();
    });

    it('should add methods for changing the property when adding it as a dep', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, tree } = setupBase(
            'update.add-methods',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);
        expect(specFile).toBeDefined();

        expect(specFile).toMatch('withServiceObservableReturningReturn(o: Observable<string>');
        expect(specFile).toMatchSnapshot();
    });

    it('should add methods for changing the property when adding it as a dep when builder ends with comma', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-methods.with-comma',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);
        expect(specFile).toBeDefined();

        expect(specFile).toMatch('withServiceObservableReturningReturn(o: Observable<string>');
        expect(specFile).toMatchSnapshot();
    });

    it('should add properties to added deps', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-methods.add-props',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        const specFile = result!.readContent(testFileName);
        expect(specFile).toBeDefined();

        expect(specFile).toMatch('const serviceProperty$ = new ReplaySubject<string>(1);');
        expect(specFile).toMatch('let resolvePromiseProp: Function;');
        expect(specFile).toMatch('let rejectPromiseProp: Function;');
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
        expect(specFile).toMatch('let resolvePromiseProp: Function;');
        expect(specFile).toMatch('let rejectPromiseProp: Function;');
        expect(specFile).toMatch('const dep1PromiseProp = new Promise((res, rej) => {');
        expect(specFile).toMatch('    resolvePromiseProp = res;');
        expect(specFile).toMatch('    rejectPromiseProp = rej;');
        expect(specFile).toMatch('});');
        // prettier-ignore
        expect(specFile).toMatch('const dep1 = autoSpy(JustADep, { observable$: dep1Observable$, promiseProp: dep1PromiseProp });');
    });

    it('should only add properties that are not added yet (should not duplicate props)', async () => {
        // arrange

        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-methods.add-props-no-duplication',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });
        const specFile = result.readContent(testFileName).toString();
        expect(specFile).toBeDefined();
        expect(specFile).toMatch(
            'const service = autoSpy(ServiceWithMethods, {observable$: someOther$, property$: serviceProperty$, promiseProp: servicePromiseProp, subject$: serviceSubject$});'
        );
    });

    it('should only declare properties that are not declared yet (should not duplicate props for observables)', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-methods.add-props-no-duplication',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);

        expect(specFile).toBeDefined();
        expect(specFile).toMatch('const someOther$ = new BehaviorSubject(null);');
        // don't add the same property mock 👇 as it already exists 👆
        expect(specFile).not.toMatch(
            'const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);'
        );
    });

    it('should only declare properties that are not declared yet (should not duplicate props for promises)', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-methods.add-props-no-duplication',
            'component.ts'
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });

        // assert
        const specFile = result!.readContent(testFileName);
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
