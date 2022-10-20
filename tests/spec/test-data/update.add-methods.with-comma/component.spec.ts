
import { ExampleComponent } from './component';
import { autoSpy } from 'autoSpy';
import { ServiceWithMethods } from './dependency';

describe('ExampleComponent', () => {


});

function setup() {
  const service = autoSpy(ServiceWithMethods);

  const builder = {
    withJustReturns(j: ClassDescription) {
      // this should still be in for the just-a-method method
      service.justAMethod.and.returnValue(j);
      return builder;
    },
    withPromiseProp() {
      // this should still be in for the promise prop method
      return builder;
    },
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent();
    },
  };

  return builder;
}
