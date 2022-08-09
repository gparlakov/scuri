/** starts on next line*/
import { of } from 'rxjs';
import { ClassDescription } from '../../../src/types'

export class ServiceWithMethods {
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
