import { autoSpy } from 'autoSpy';
import { ./example/example.Component.Ts } from '././example/example.component.ts.component';

describe('./example/example.Component.Ts', () => {
  it('when then should', () => {
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
  const dep = autoSpy(string)/nconst service = autoSpy(Object)
  const builder = {
    dep,/nservice,
    default() {
      return builder;
    },
    build() {
      return new ./example/example.Component.Ts(dep,service);
    }
  };

  return builder;
}
