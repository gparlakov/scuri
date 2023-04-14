
describe('ExampleComponentForIfExpressions', () => {
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
    const serviceObservable$ = new ReplaySubject<ClassDescription[]>(1);
    const service = autoSpy(ServiceWithMethods, { observable$: serviceObservable$ });
    service.observableReturning.and.returnValue(EMPTY);
    const builder = {
        service,
        withServiceObservableReturningReturn(o: Observable<string>) {
            service.observableReturning.and.returnValue(o);
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
            return new ExampleComponentForIfExpressions(service);
        },
    };
    return builder;
}
