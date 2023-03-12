import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { EOL } from 'os';
import { collectionPath, setupBase, splitLines } from './common';

describe('Option: functionTemplate', () => {
    const treeWithCustomFunctionTemplate= Tree.empty();

    const folder = 'spec-create.function-template';
    const fn = 'function-for-template.ts';
    const functionTemplate = '__specFileName__.template';
    it('when function template missing it should stop', async () => {
        // arrange
        const { run, fullFileName, add } = setupBase(folder, fn);
        add(fullFileName);
        // add(testFileName);
        return await run({ name: fullFileName, functionTemplate:'missing-file-path' })
            // assert
            .then(() => fail('should throw since the template file is missing'))
            .catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toMatch('Function template configuration was');
                expect(e.message).toMatch('missing-file-path');
            });
    });

    fit('when function template passed in it should use it', async () => {
        // arrange
        const { run, fullFileName, testFileName, add, getFilePath } = setupBase(folder, fn);
        const templatePath = getFilePath(functionTemplate);
        add(fullFileName);
        add(templatePath)
        const result =  await run({ name: fullFileName, functionTemplate: templatePath })
        // assert
        expect(result.exists(testFileName)).toBe(true);

        const content = splitLines(result.readContent(testFileName));
        let i = 0;

        expect(content[i++]).toEqual(`import { exampleFunction } from './function-for-template';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('my function is exampleFunction', () => {`);
        expect(content[i++]).toEqual(`    it('it should', () => {`);
        expect(content[i++]).toEqual(`    // arrange`);
        expect(content[i++]).toEqual(`    // act`);
        expect(content[i++]).toEqual(`    const x = exampleFunction();`);
        expect(content[i++]).toEqual(`    // assert`);
        expect(content[i++]).toEqual(`    // expect(x).toEqual`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`});`);
    });

    it('when function template in config use it', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                {
                    name: 'example.ts',
                    config: 'tests/spec/test-data/valid-config-valid-function-template.json',
                },
                treeWithCustomFunctionTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('example.spec.ts')).toBe(true);

        const content = result.readContent('example.spec.ts').replace(EOL, '\n').split('\n');

        let i = 0;
        expect(content[i++]).toEqual(`import { exampleFunction } from './example';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('my function is exampleFunction', () => {`);
        expect(content[i++]).toEqual(`    it('it should', () => {`);
        expect(content[i++]).toEqual(`    // arrange`);
        expect(content[i++]).toEqual(`    // act`);
        expect(content[i++]).toEqual(`    const x = exampleFunction();`);
        expect(content[i++]).toEqual(`    // assert`);
        expect(content[i++]).toEqual(`    // expect(x).toEqual`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`});`);
    });

    it('when both config classTemplate and command line arg classTemplate passed in it should use CLI arg', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // create the just.template
        treeWithCustomFunctionTemplate.create('just.template', 'CLI Args take precedence');

        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                {
                    name: 'example.ts',
                    config: 'tests/spec/test-data/valid-config-valid-function-template.json',
                    functionTemplate: 'just.template',
                },
                treeWithCustomFunctionTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('just')).toBe(true);

        expect(result.readContent('just')).toEqual('CLI Args take precedence');
    });

    it('function template can use these props demo and functions ', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        treeWithCustomFunctionTemplate.create(
            '__name@dasherize__.function-spec.ts.template',
            `CUSTOM FUNCTION TEMPLATE
AVAILABLE PROPERTIES:
specFileName: <%= specFileName %>
normalizedName: <%= normalizedName %> (fileName.ext) ->normalize-> fileName
name: <%= name %>,
`
        );
        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.ts', functionTemplate: '__name@dasherize__.function-spec.ts.template' },
                treeWithCustomFunctionTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('example-function.function-spec.ts')).toBe(true);

        const content = result.readContent('example-function.function-spec.ts').replace(EOL, '\n').split('\n');
        let i = 0;
        expect(content[i++]).toEqual(`CUSTOM FUNCTION TEMPLATE`);
        expect(content[i++]).toEqual(`AVAILABLE PROPERTIES:`);
        expect(content[i++]).toEqual(`specFileName: example.spec.ts`);
        expect(content[i++]).toEqual(
            `normalizedName: example (fileName.ext) ->normalize-> fileName`
        );
        expect(content[i++]).toEqual(`name: exampleFunction,`);
    });

    it('function template demo', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        treeWithCustomFunctionTemplate.create(
            'demo.template',
            `
import { <%= name %> } from './<%= normalizedName %>';

describe('<%= name %> (is a function!)', () => {
    it('should mostly work', () => {
        const result = <%= name %>();

        expect(result).toBe(42);
    });
});
`
        );
        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.ts', functionTemplate: 'demo.template' },
                treeWithCustomFunctionTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('demo')).toBe(true);

        const content = result.readContent('demo').replace(EOL, '\n').split('\n');
        let i = 0;
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`import { exampleFunction } from './example';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('exampleFunction (is a function!)', () => {`);
        expect(content[i++]).toEqual(`    it('should mostly work', () => {`);
        expect(content[i++]).toEqual(`        const result = exampleFunction();`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`        expect(result).toBe(42);`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`});`);
    });
});
