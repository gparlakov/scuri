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

    observableReturning() {
        return of('emit-and-complete');
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
export class JustADep {

    observable$: Observable<Array<ClassDescription>>;
    promiseProp: Promise<string>;

    constructor() {}

    getMyObject() {
        return <ClassDescription>{constructorParams: [], name: 'a name', publicMethods: ['asdad'], type: 'class'}
    }

    doAVoidThing() {
        this['test'] = 1;
    }

    doAThingThatThrows() {
        throw new Error('test')
    }

}
