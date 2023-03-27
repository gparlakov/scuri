import { ExampleComponent } from './deps-calls-with-return-types';

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
  const x: Observable<void> = EMPTY;
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
