export class ExampleComponent {
    publicProperty: boolean;

    private privateProperty: string;

    aMethod(dep: string, service: Object) {}

    //a constructor comment
    constructor(/** shows in full text and is hidden in text */dep: string, service: Object) {}

    // a comment
    anotherMethod() {}
  }
