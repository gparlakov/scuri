import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

const source = 'add.ts';
const spec = 'add.spec.ts';
describe('When source file has only function', () => {
    let tree = Tree.empty();
    tree.create(
        source,
        `
export function add(a: number, b: number) {
    return a + b;
}`
    );

    it('create should create a describe and one test case for the function', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: source, update: false }, tree);
        // assert
        const contents = result.readContent(spec);
        expect(contents).toMatch(`import { add } from './add';`);
        expect(contents).toMatch(`import { autoSpy } from 'autoSpy';`);
        expect(contents).toMatch(`describe('add', () => {`);
        expect(contents).toMatch(`  it('it should', () => {`);
        expect(contents).toMatch(`    // arrange`);
        expect(contents).toMatch(`    // act`);
        expect(contents).toMatch(`    const x = add();`);
        expect(contents).toMatch(`    // assert`);
        expect(contents).toMatch(`    // expect(x).toEqual()`);
        expect(contents).toMatch(`  });`);
        expect(contents).toMatch(`});`);
    });
});
