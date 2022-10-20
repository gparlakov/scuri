/** starts on next line*/
import { switchMap, switchMapTo, tap } from 'rxjs/operators';
import { JustADep, ServiceWithMethods } from './dependency';

export class ExampleComponent {
    constructor(private readonly service: ServiceWithMethods, private readonly dep1: JustADep) { }

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
            tap({ error: () => this.service.aNeverMethod() })
        )
    }

    async onButtonClick() {
        if (this.dep1.getMyObject()) {
            this.dep1.observable$.pipe(
                switchMapTo(this.dep1.promiseProp)
            );
        }
    }
}
