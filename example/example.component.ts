export class ExampleComponent {
    publicProperty: boolean;

    private privateProperty: string;

    aMethod(dep: string, service: Object): Object {
        return service;
    }

    //a constructor comment
    constructor(/** shows in full text and is hidden in text */mep: string, service1: Object) {}

    // a comment
    async anotherMethod(param1 : string, parame2: Object, param3: any) {

    }
    private third() {}
    public fourth(): string {
        return 'hello'
    }
  }
