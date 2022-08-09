/** starts on next line*/
import { switchMap } from 'rxjs/operators';
import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';


export class ExampleComponent {
    constructor(private readonly service:ServiceWithMethods) {}

    async aMethod() {
        const d = this.service.justAMethod();

        return this.service.observableReturning().pipe(
            switchMap(v => this.service.promiseReturning())
        );
    }
}
