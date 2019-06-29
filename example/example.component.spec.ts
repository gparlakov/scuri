import { autoSpy } from 'autoSpy';
import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
  it('when aMethod is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    // c.act
    // assert
    // expect(c).toEqual
  });

  it('when anotherMethod is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    // c.act
    // assert
    // expect(c).toEqual
  });

  it('when fourth is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    // c.act
    // assert
    // expect(c).toEqual
  });

  
});

function setup() {
  let dep:string;
const service = autoSpy(Object);
  const builder = {
    dep,
service,
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent(dep,service);
    }
  };

  return builder;
}
