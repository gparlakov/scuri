import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { EOL } from 'os';
import { normalize } from 'path';
import { collectionPath, getTestFileContents, setupBase, splitLines } from './common';

describe('Option: functionTemplate', () => {
    const treeWithCustomFunctionTemplate= Tree.empty();

    const folder = 'spec-create.function-template';
    const fn = 'function-for-template.ts';
    const functionTemplate = '__specFileName__.template';
    const functionTemplateConfig = 'valid-config-valid-function-template.json';
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

    it('when function template passed in it should use it', async () => {
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
        const { run, fullFileName, testFileName, add, getFilePath, tree } = setupBase(folder, fn);
        const templatePath = getFilePath(functionTemplate);
        const treeTemplatePath = normalize(`tests/spec/test-data/${folder}/${functionTemplate}`)
        const configPath = getFilePath(functionTemplateConfig);
        add(fullFileName);
        add(treeTemplatePath, getTestFileContents(templatePath));
        const result =  await run({ name: fullFileName, config: configPath });
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

    it('when both config classTemplate and command line arg classTemplate passed in it should use CLI arg', async () => {
        // arrange
        const { run, fullFileName, add, getFilePath } = setupBase(folder, fn);
        const templatePath = getFilePath(functionTemplate);
        add(fullFileName);
        add(templatePath);
        add('just.template', 'CLI Args take precedence');
        const configPath = getFilePath(functionTemplateConfig);
        const result =  await run({ name: fullFileName, functionTemplate: 'just.template', config: configPath })
        // assert
        expect(result.exists(getFilePath('just'))).toBe(true);

        expect(result.readContent(getFilePath('just'))).toEqual('CLI Args take precedence');
    });

    it('function template can use these props demo and functions ', async () => {
        // arrange
        const { run, fullFileName, add, getFilePath } = setupBase(folder, fn);
        const templatePath = getFilePath(functionTemplate);
        add(fullFileName);
        add(templatePath);
        add(
            '__name@dasherize__.function-spec.ts.template',
            `CUSTOM FUNCTION TEMPLATE
AVAILABLE PROPERTIES:
specFileName: <%= specFileName %>
normalizedName: <%= normalizedName %> (fileName.ext) ->normalize-> fileName
name: <%= name %>,
`);
        const result =  await run({ name: fullFileName, functionTemplate: '__name@dasherize__.function-spec.ts.template' })
        const specFile = getFilePath('example-function.function-spec.ts');

        // act
        // assert
        expect(result.exists(specFile)).toBe(true);

        const content = result.readContent(specFile).replace(EOL, '\n').split('\n');
        let i = 0;
        expect(content[i++]).toEqual(`CUSTOM FUNCTION TEMPLATE`);
        expect(content[i++]).toEqual(`AVAILABLE PROPERTIES:`);
        expect(content[i++]).toEqual(`specFileName: function-for-template.spec.ts`);
        expect(content[i++]).toEqual(
            `normalizedName: function-for-template (fileName.ext) ->normalize-> fileName`
        );
        expect(content[i++]).toEqual(`name: exampleFunction,`);
    });

    it('function template demo', async () => {
        const { run, fullFileName, add, getFilePath } = setupBase(folder, fn);
        const templatePath = getFilePath(functionTemplate);
        add(fullFileName);
        add(templatePath);
        const demoTemplate = 'demo.template'
        add(
            demoTemplate,
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
        const result =  await run({ name: fullFileName, functionTemplate: demoTemplate })
        const specFile = getFilePath('demo');
        // assert
        expect(result.exists(specFile)).toBe(true);

        const content = result.readContent(specFile).replace(EOL, '\n').split('\n');
        let i = 0;
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`import { exampleFunction } from './function-for-template';`);
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
