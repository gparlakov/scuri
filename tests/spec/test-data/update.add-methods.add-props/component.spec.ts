
import { ExampleComponent } from './component';
import { autoSpy } from 'autoSpy';
import { ServiceWithMethods } from './dependency';

describe('ExampleComponent', () => {


});

function setup() {

  const builder = {
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
