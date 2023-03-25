

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
            return new ExampleComponent();
        },
    };

    return builder;
}
