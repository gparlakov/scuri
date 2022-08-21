import { ServiceWithMethods } from './deps-calls-with-return-types.dependency';
import { ExampleComponent } from './deps-calls-with-return-types';
import { autoSpy } from 'autoSpy';

describe('ExampleComponent', () => {
    it('when aMethod is called it should', () => {
        // arrange
        const { build } = setup().default();
        const e = build();
        // act
        e.aMethod();
        // assert
        // expect(e).toEqual
    });
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
