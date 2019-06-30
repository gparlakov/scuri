export class ExampleComponent {
    publicProperty: boolean;

    private privateProperty: string;

    aMethod(dep: string, service: Object) {}

    //a constructor comment
    constructor(/** shows in full text and is hidden in text */mep: string, service1: Object) {}

    // a comment
    async anotherMethod() {}
    private third() {}
    public fourth() {}
  }
