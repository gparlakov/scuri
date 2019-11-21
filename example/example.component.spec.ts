import { ExampleComponent } from './example.component';
import { autoSpy } from 'autoSpy';

describe('ExampleComponent', () => {
  it('when aMethod is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.aMethod();
    // assert
    // expect(c).toEqual
  });

  it('when anotherMethod is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.anotherMethod();
    // assert
    // expect(c).toEqual
  });

  it('when fourth is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.fourth();
    // assert
    // expect(c).toEqual
  });

  
});

function setup() {
  let mep:string;
const service1: Object = autoSpy<Object>(Object, 'Object');
  const builder = {
    mep,
service1,
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent(mep,service1);
    }
  };

  return builder;
}
