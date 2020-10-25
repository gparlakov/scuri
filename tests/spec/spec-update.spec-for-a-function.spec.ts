import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';
import { filter } from 'rxjs/operators';

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

    tree.create(
        spec,
        `import { add } from './add';
import { autoSpy } from 'autoSpy';
describe('add', () => {
  it('it should', () => {
    // arrange
    // act
    const x = add();
    // assert
    // expect(x).toEqual()
  });
});
`
    );

    it('update should throw and not update', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        // assert
        const errors: Error[] = [];
        runner.logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v));
        runner.runSchematic('spec', { name: source, update: true }, tree);
        // assert
        expect(errors.length).toBe(1);
        expect(errors[0].message).toEqual('No classes found to be spec-ed!');
    });
});
