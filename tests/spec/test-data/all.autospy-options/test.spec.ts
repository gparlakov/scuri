describe('MyClass', () => {
    it('when method is called it should', () => {
        // arrange
        const { build } = setup().default();
        const m = build();
        // act
        m.method();
        // assert
        // expect(m).toEqual
    });
});

function setup() {
    const x = autoSpy(Window)
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new MyClass();
        },
    };

    return builder;
}
