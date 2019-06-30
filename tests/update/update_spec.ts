import { update } from "../../src/update/update";
import { RemoveChange } from "../../lib/utility/change";

describe("Update a spec", () => {
  it("should return a remove list", () => {
    const result = update(
      "./test",
      `import { autoSpy } from 'autoSpy';
        import { ExampleComponent } from './example.component';

        describe('ExampleComponent', () => {
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
        `,
      [],
      "ExampleComponent"
    );

    const removes = result.filter(r => r instanceof RemoveChange);
    expect(removes.length).toBe(6);
    // order is the position of the remove
    expect(removes[0].order).toBe(184) // let dep:string;
    expect(removes[1].order).toBe(212) // const service = autoSpy(Object);
    expect(removes[2].order).toBe(287) // dep in builder
    expect(removes[3].order).toBe(308) // service in builder
    expect(removes[4].order).toBe(491) // dep, in ExampleComponent(dep, service)
    expect(removes[5].order).toBe(495) // service in ExampleComponent(dep, service)
  });
});
