"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const path = require("path");
const collectionPath = path.join(__dirname, "../../src/collection.json");
const exampleComponentPath = path.join(__dirname, "../../example/example.component.ts");
const exampleComponentSpec = path.join(__dirname, "../../example/example.component.ts");
function file(name) {
    return path.join(__dirname, 'files', name);
}
describe("spec", () => {
    it("throws when name is not passed in", () => {
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        expect(() => runner.runSchematic("spec", {}, schematics_1.Tree.empty())).toThrow();
    });
    it("creates a file with dasherized name passed in", () => {
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        const result = runner.runSchematic("spec", { name: file('empty-class.ts') }, schematics_1.Tree.empty());
        expect(result.files[0]).toMatch("empty-class.spec.ts");
    });
    it("creates the spec ", () => {
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        const result = runner.runSchematic("spec", { name: exampleComponentPath }, schematics_1.Tree.empty());
        expect(result.readContent(exampleComponentSpec)).not.toBeNull();
    });
});
//# sourceMappingURL=index_spec.js.map