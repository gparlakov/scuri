import { autoSpy } from "autoSpy";
import { ExampleComponent } from "./example.component";

describe("./example/example.Component.Ts", () => {
  it("when then should", () => {
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
  let dep: string;
  const service = autoSpy(Object);
  const builder = {
    dep,
    service,
    default() {
      return builder;
    },
    build() {
      return new ExampleComponent(dep, service);
    }
  };

  return builder;
}
