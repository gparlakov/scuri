import { ServiceWithMethods } from './dependency';

export class ExampleComponentForDetectingFrameworkTestRunner {
    constructor(private readonly service: ServiceWithMethods) {}

    async aMethod() {
        this.service.observableReturning().subscribe();
    }
}
