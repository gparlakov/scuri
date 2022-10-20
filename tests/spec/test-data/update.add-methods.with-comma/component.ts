/** starts on next line*/
import { switchMap, switchMapTo, tap } from 'rxjs/operators';
import { ServiceWithMethods } from './dependency';

export class ExampleComponent {
    constructor(private readonly service:ServiceWithMethods) {}

    async aMethod() {
        const d = this.service.justAMethod();

        return this.service.observableReturning().pipe(
            switchMap(v => this.service.promiseReturning())
        );
    }

    async anotherMethod() {
        this.service.aVoidMethod();
        this.service.property$.pipe(
            switchMap(v => this.service.promiseProp),
            switchMapTo(this.service.observable$),
            switchMapTo(this.service.subject$),
            tap({error: () => this.service.aNeverMethod()})
        )
    }
}
