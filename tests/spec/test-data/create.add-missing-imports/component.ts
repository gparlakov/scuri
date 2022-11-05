import { switchMapTo, tap } from 'rxjs/operators';
import { ServiceWithMethods } from './dependency';

export class ExampleComponentForIfExpressions {
    constructor(private readonly service: ServiceWithMethods) {}

    async aMethod() {
        if (this.service) {
            this.service.aVoidMethod();
            this.service['aVoidMethod']();
            this.service.observableReturning();
            this.service['observableReturning']();

            // tslint:disable-next-line
            this.service.observable$.subscribe(console.log);
            // tslint:disable-next-line
            this.service['observable$'].subscribe(console.log);
        }
    }
}
