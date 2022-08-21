import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';
import { ExampleComponent } from './deps-calls-with-return-types';
import { autoSpy } from 'autoSpy';

describe('ExampleComponent', () => {

  
});

function setup() {
  const service = autoSpy(ServiceWithMethods);
  const builder = {
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent(service);
    }
  };

  return builder;
}
