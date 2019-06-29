"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const path = require("path");
const collectionPath = path.join(__dirname, "../../src/collection.json");
function file(name) {
    return path.join(__dirname, "files", name);
}
describe("spec", () => {
    it("throws when name is not passed in", () => {
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        expect(() => runner.runSchematic("spec", {}, schematics_1.Tree.empty())).toThrow();
    });
    it("creates a file when name is passed in", () => {
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        const result = runner.runSchematic("spec", { name: file("empty-class.ts") }, schematics_1.Tree.empty());
        expect(result.files[0]).toMatch("empty-class.spec.ts");
    });
    it("creates a file with a non-empty content ", () => {
        // arrange
        const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
        // act
        const result = runner.runSchematic("spec", { name: file("empty-class.ts") }, schematics_1.Tree.empty());
        // assert
        expect(result.readContent(result.files[0]).length).toBeGreaterThan(0);
    });
    describe("targeting the EmptyClass", () => {
        it("creates a file with the boilerplate setup method ", () => {
            // arrange
            const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic("spec", { name: file("empty-class.ts") }, schematics_1.Tree.empty());
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/function setup\(\) {/);
            expect(contents).toMatch(/const builder = {/);
            expect(contents).toMatch(/return new EmptyClass\(\);/);
        });
    });
    describe("targeting the has-one-constructor-param class", () => {
        it("it creates boilerplate with a new instance with one matching constructor parameter ", () => {
            // arrange
            const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic("spec", { name: file("has-one-constructor-parameter.ts") }, schematics_1.Tree.empty());
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/return new HasOneConstructorParameter\(service\);/);
        });
    });
    describe("targeting the example component class", () => {
        it("creates a file with matching number of `it` calls for each public method ", () => {
            // arrange
            const runner = new testing_1.SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic("spec", { name: file("example.component.ts") }, schematics_1.Tree.empty());
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/it\('when aMethod is called/);
            expect(contents).toMatch(/it\('when anotherMethod is called/);
        });
    });
});
//# sourceMappingURL=index_spec.js.map