import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('autoSpy options', () => {
    let tree = Tree.empty();
    const fileName = 'test.ts';
    const testFileName = 'test.spec.ts'

    beforeEach(() => {
        tree = Tree.empty();
    })

    it('when creating a new spec it should use the autospy options from command line overwriting the option file', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree.create(fileName, fileContents());
        // act
        const r = await runner.runSchematicAsync(
            'spec',
            { name: fileName, config: 'tests/spec/test-data/config-autospy.json', autoSpyLocation:'@testing/autospy' },
            tree
        ).toPromise();
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@testing/autospy';`);
    });

    it('when creating a new spec it should use the autospy options from option file', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree.create(fileName, fileContents());
        // act
        const r = await runner.runSchematicAsync(
            'spec',
            { name: fileName, config: 'tests/spec/test-data/config-autospy.json' },
            tree
        ).toPromise();
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@some/path';`);
    });

    it('when updating a spec it should use the autospy options from command line overwriting the option file', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree.create(fileName, fileContents());
        tree.create(testFileName, testFileContents());
        // act
        const r = await runner.runSchematicAsync(
            'spec',
            { name: fileName, update: true, config: 'tests/spec/test-data/config-autospy.json', autoSpyLocation:'@testing/autospy' },
            tree
        ).toPromise()
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@testing/autospy';`);
    });

    it('when updating a spec it should use the autospy options from the option file', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree.create(fileName, fileContents());
        tree.create(testFileName, testFileContents());
        // act
        const r = await runner.runSchematicAsync(
            'spec',
            { name: fileName, update: true, config: 'tests/spec/test-data/config-autospy.json' },
            tree
        ).toPromise()
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@some/path';`);
    });

});


function fileContents() {
    return `import {Dep} from './dep';
    class MyClass {
        constructor(v: Dep) {}
        method() {
            return 'result'
        }
    }`
}

function testFileContents() {
    return `';
    import { MyClass } from './test';

    describe('MyClass', () => {
      it('when method is called it should', () => {
        // arrange
        const { build } = setup().default();
        const m = build();
        // act
        m.method();
        // assert
        // expect(m).toEqual
      });

    });

    function setup() {
      const builder = {
        default() {
          return builder;
        },
        build() {
          return new MyClass();
        }
      };

      return builder;
    }`
}
