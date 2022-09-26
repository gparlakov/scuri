/** starts on next line*/
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { ClassDescription } from '../../../src/types';

export class ServiceWithMethods {

    observable$: Observable<string>;
    subject$: Subject<string>;
    property$: BehaviorSubject<string>;
    promiseProp: Promise<string>;

    constructor() {}

    observableReturning() {
        return of('emit-and-complete');
    }
    promiseReturning() {
        return Promise.resolve('resolved')
    }
    justAMethod() {
        return <ClassDescription>{constructorParams: [], name: 'a name', publicMethods: ['asdad'], type: 'class'}
    }


}
