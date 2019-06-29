import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import * as path from "path";

const collectionPath = path.join(__dirname, "../../src/collection.json");
const exampleComponentPath = path.join(
  __dirname,
  "../../example/example.component.ts"
);
const exampleComponentSpec = path.join(
  __dirname,
  "../../example/example.component.ts"
);

function file(name: string) {
  return path.join(__dirname, 'files', name);
}

describe("spec", () => {
  it("throws when name is not passed in", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    expect(() => runner.runSchematic("spec", {}, Tree.empty())).toThrow();
  });

  it("creates a file with dasherized name passed in", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    const result = runner.runSchematic(
      "spec",
      { name: file('empty-class.ts') },
      Tree.empty()
    );
    expect(result.files[0]).toMatch("empty-class.spec.ts");
  });

  it("creates the spec ", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    const result = runner.runSchematic(
      "spec",
      { name: exampleComponentPath },
      Tree.empty()
    );
    expect(result.readContent(exampleComponentSpec)).not.toBeNull();
  });
});
