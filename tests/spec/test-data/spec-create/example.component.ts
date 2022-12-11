export class ExampleComponent {
    publicProperty: boolean;

    private privateProperty: string;

    aMethod(dep: string, service: Service) {}

    //a constructor comment
    constructor(/** shows in full text and is hidden in text */ dep: string, service: Service) {}

    // an async public method
    async anotherMethod() {}
    private third() {}
    public fourth() {}
    protected protectedMethod() {}
}
