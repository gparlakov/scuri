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

    it('update should throw and not update', async  () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        // assert
        await runner.runSchematicAsync('spec', { name: source, update: true }, tree)
            .toPromise()
            // assert
            .catch(e => expect(e?.message).toEqual('No classes found to be spec-ed!'));
    });
});
