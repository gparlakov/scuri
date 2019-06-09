import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import * as path from "path";

const collectionPath = path.join(__dirname, "../collection.json");

describe("spec", () => {
  it("throws when name is not passed in", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    expect(() => runner.runSchematic("spec", {}, Tree.empty())).toThrow();
  });

  it("creates a file with dasherized name passed in", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    const result = runner.runSchematic(
      "spec",
      { name: "VirtualComponent" },
      Tree.empty()
    );
    expect(result.files).toEqual(["/virtual-component.spec.ts"]);
  });

  it("creates the spec ", () => {
    const runner = new SchematicTestRunner("schematics", collectionPath);
    const result = runner.runSchematic(
      "spec",
      { name: "VirtualComponent" },
      Tree.empty()
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "import { VirtualComponent } from './virtual-component.component';"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "describe('VirtualComponent', () => {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "it('when then should', () => {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "// arrange"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "const { build } = setup().default();"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "const c = build();"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "// act"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "// c.act"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "// assert"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "// expect(c).toEqual"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "function setup() {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "const builder = {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "default() {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "return builder;"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain("},");
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "build() {"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "return new VirtualComponent();"
    );
    expect(result.readContent("./virtual-component.spec.ts")).toContain("}");
    expect(result.readContent("./virtual-component.spec.ts")).toContain("};");
    expect(result.readContent("./virtual-component.spec.ts")).toContain(
      "return builder;"
    );
  });
});
