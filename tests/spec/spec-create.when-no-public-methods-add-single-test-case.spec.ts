import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('spec', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
        tree.create('empty-class.ts', 'export class EmptyClass {}');
    });
    it('creates a file with the boilerplate setup method ', async  () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner.runSchematicAsync('spec', { name: 'empty-class.ts' }, tree).toPromise();
        // assert
        const contents = result.readContent('empty-class.spec.ts');

        const eol = '(\\r\\n|\\n)\\s*';
        expect(contents).toMatch(
            new RegExp(
                `it\\('it should construct', \\(\\) => \\{${eol}` +
                    `\\/\\/ arrange${eol}` +
                    `const \\{ build \\} = setup\\(\\).default\\(\\);${eol}` +
                    `\\/\\/ act${eol}` +
                    `const e = build\\(\\);${eol}` +
                    `\\/\\/ assert${eol}` +
                    `\\/\\/ expect\\(e\\).toEqual${eol}`
            )
        );
    });
});
