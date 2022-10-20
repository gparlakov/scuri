
import { ExampleComponent } from './component';
import { autoSpy } from 'autoSpy';
import { ServiceWithMethods } from './dependency';
import { BehaviorSubject } from 'rxjs';

describe('ExampleComponent', () => {


});

function setup() {

  const serviceObservable$ = new BehaviorSubject(null);
  const service = autoSpy(ServiceWithMethods, {observable$: serviceObservable$});
  service.promiseReturning.and.returnValue(Promise.resolve('some other thing'));

  const builder = {
    withPromiseProp() {
      // this should still be in for the promise prop method
      return builder;
    },
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent(service);
    },
  };

  return builder;
}
