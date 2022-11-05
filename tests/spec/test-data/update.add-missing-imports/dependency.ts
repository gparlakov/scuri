/** starts on next line*/
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
export interface ClassDescription {
    name: string;
    constructorParams: string[];
    publicMethods: string[];
    type: string;
}

export class ServiceWithMethods {

    observable$: Observable<Array<ClassDescription>>;
    subject$: Subject<string>;
    property$: BehaviorSubject<string>;
    promiseProp: Promise<string>;

    constructor() {}

    observableReturning(): Observable<number>
    observableReturning(a: string): Observable<string>
    observableReturning(a?: string | undefined): Observable<string | number> {
        return of(a ? a : 1);
    }
    promiseReturning() {
        return Promise.resolve('resolved')
    }
    justAMethod() {
        return <ClassDescription>{constructorParams: [], name: 'a name', publicMethods: ['asdad'], type: 'class'}
    }

    aVoidMethod() {
        this['test'] = 1;
    }

    aNeverMethod() {
        throw new Error('test')
    }

}
