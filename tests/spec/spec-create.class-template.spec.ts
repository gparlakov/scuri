import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { basename, dirname } from 'path';
import { collectionPath, getTestFile, getTestFileContents, setupBase } from './common';

const folder = 'spec-create.class-template';
const component = 'example.component.ts';

describe('Option: classTemplate', () => {
    let customTemplateName = getTestFile(`${folder}/__specFileName__.template`);

    function templateWithCustomUpdateTemplates() {
        return getTestFile(`${folder}/template-with-custom-updates.ts.template`);
    }

    it('when class template missing it should stop', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        return await runner
            .runSchematicAsync(
                'spec',
                { name: '', classTemplate: 'missing-file-path' },
                Tree.empty()
            )
            .toPromise()
            // assert
            .then(() => fail('should throw since the template file is missing'))
            .catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toMatch('Class template configuration was');
                expect(e.message).toMatch('missing-file-path');
            });
    });

    it('when class template passed in it should use it', async () => {
        // arrange
        const { run, add, testFileName, fullFileName, splitLines } = setupBase(folder, component);
        add(fullFileName);
        add(customTemplateName);

        // act
        const result = await run({ classTemplate: customTemplateName });
        // assert
        expect(result.exists(testFileName)).toBe(true);

        const content = splitLines(result.readContent(testFileName));
        let i = 0;
        expect(content[i++]).toEqual(`import { ADep } from '../my/relative/path';`);
        expect(content[i++]).toEqual(`import { DDep } from '@angular/router';`);
        expect(content[i++]).toEqual(`import { ExampleComponent } from './example.component';`);
        expect(content[i++]).toEqual(`import { autoSpy } from 'autoSpy';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('ExampleComponent', () => {`);
        expect(content[i++]).toEqual(`    it('when aMethod is called it should', () => {`);
        expect(content[i++]).toEqual(`    // arrange`);
        expect(content[i++]).toEqual(`    const { build } = setup().default();`);
        expect(content[i++]).toEqual(`    const e = build();`);
        expect(content[i++]).toEqual(`    // act`);
        expect(content[i++]).toEqual(`    e.aMethod();`);
        expect(content[i++]).toEqual(`    // assert`);
        expect(content[i++]).toEqual(`    // expect(e).toEqual`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`});`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`// add a comment here`);
        expect(content[i++]).toEqual(`function setup() {`);
        expect(content[i++]).toEqual(`    const aDep = autoSpy(ADep);`);
        expect(content[i++]).toEqual(`    const d = autoSpy(DDep);`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`    const builder = {`);
        expect(content[i++]).toMatch(`    aDep,`);
        expect(content[i++]).toEqual(`d,`);
        expect(content[i++]).toEqual(`    default() {`);
        expect(content[i++]).toEqual(`        return builder;`);
        expect(content[i++]).toEqual(`    },`);
        expect(content[i++]).toEqual(`    build() {`);
        expect(content[i++]).toEqual(`        return new ExampleComponent(aDep,d);`);
        expect(content[i++]).toEqual(`    }`);
        expect(content[i++]).toEqual(`    };`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`    return builder;`);
        expect(content[i++]).toEqual(`}`);
    });

    it('when class template in config use it', async () => {
        // arrange
        const { run, add, testFileName, fullFileName, splitLines } = setupBase(folder, component);
        add(fullFileName);

        add(`/${basename(customTemplateName).trim()}`, getTestFileContents(customTemplateName));

        // act
        const result = await run({
            config: getTestFile(configFileName()),
        });
        // assert
        expect(result.exists(testFileName)).toBe(true);

        const content = splitLines(result.readContent(testFileName));
        let i = 0;
        expect(content[i++]).toEqual(`import { ADep } from '../my/relative/path';`);
        expect(content[i++]).toEqual(`import { DDep } from '@angular/router';`);
        expect(content[i++]).toEqual(`import { ExampleComponent } from './example.component';`);
        expect(content[i++]).toEqual(`import { autoSpy } from 'autoSpy';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('ExampleComponent', () => {`);
        expect(content[i++]).toEqual(`    it('when aMethod is called it should', () => {`);
        expect(content[i++]).toEqual(`    // arrange`);
        expect(content[i++]).toEqual(`    const { build } = setup().default();`);
        expect(content[i++]).toEqual(`    const e = build();`);
        expect(content[i++]).toEqual(`    // act`);
        expect(content[i++]).toEqual(`    e.aMethod();`);
        expect(content[i++]).toEqual(`    // assert`);
        expect(content[i++]).toEqual(`    // expect(e).toEqual`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`});`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`// add a comment here`);
        expect(content[i++]).toEqual(`function setup() {`);
        expect(content[i++]).toEqual(`    const aDep = autoSpy(ADep);`);
        expect(content[i++]).toEqual(`    const d = autoSpy(DDep);`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`    const builder = {`);
        expect(content[i++]).toMatch(`    aDep,`);
        expect(content[i++]).toEqual(`d,`);
        expect(content[i++]).toEqual(`    default() {`);
        expect(content[i++]).toEqual(`        return builder;`);
        expect(content[i++]).toEqual(`    },`);
        expect(content[i++]).toEqual(`    build() {`);
        expect(content[i++]).toEqual(`        return new ExampleComponent(aDep,d);`);
        expect(content[i++]).toEqual(`    }`);
        expect(content[i++]).toEqual(`    };`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`    return builder;`);
        expect(content[i++]).toEqual(`}`);
    });

    it('when class template has update templates - skip them from create result', async () => {
        // arrange
        const { run, add, testFileName, fullFileName, splitLines } = setupBase(folder, component);
        add(fullFileName);

        add(
            `/${basename(customTemplateName).trim()}`,
            getTestFileContents(templateWithCustomUpdateTemplates())
        );

        // act
        const result = await run({
            config: getTestFile(configFileName()),
        });
        // assert
        expect(result.exists(testFileName)).toBe(true);

        const content = splitLines(result.readContent(testFileName));
        let i = 0;
        expect(content[i++]).toEqual(`import { ADep } from '../my/relative/path';`);
        expect(content[i++]).toEqual(`import { DDep } from '@angular/router';`);
        expect(content[i++]).toEqual(`import { ExampleComponent } from './example.component';`);
        expect(content[i++]).toEqual(`import { autoSpy } from 'autoSpy';`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`describe('ExampleComponent', () => {`);
        expect(content[i++]).toEqual(`    it('when aMethod is called it should', () => {`);
        expect(content[i++]).toEqual(`    // arrange`);
        expect(content[i++]).toEqual(`    const { build } = setup().default();`);
        expect(content[i++]).toEqual(`    const e = build();`);
        expect(content[i++]).toEqual(`    // act`);
        expect(content[i++]).toEqual(`    e.aMethod();`);
        expect(content[i++]).toEqual(`    // assert`);
        expect(content[i++]).toEqual(`    // expect(e).toEqual`);
        expect(content[i++]).toEqual(`    });`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`});`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`// add a comment here`);
        expect(content[i++]).toEqual(`function setup() {`);
        expect(content[i++]).toEqual(`    const aDep = autoSpy(ADep);`);
        expect(content[i++]).toEqual(`    const d = autoSpy(DDep);`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(`    const builder = {`);
        expect(content[i++]).toMatch(`    aDep,`);
        expect(content[i++]).toEqual(`d,`);
        expect(content[i++]).toEqual(`    default() {`);
        expect(content[i++]).toEqual(`        return builder;`);
        expect(content[i++]).toEqual(`    },`);
        expect(content[i++]).toEqual(`    build() {`);
        expect(content[i++]).toEqual(`        return new ExampleComponent(aDep,d);`);
        expect(content[i++]).toEqual(`    }`);
        expect(content[i++]).toEqual(`    };`);
        expect(content[i++]).toEqual(``);
        expect(content[i++]).toEqual(`    return builder;`);
        expect(content[i++]).toEqual(`}`);
    });

    it('should be able to use functions in the spec file name', async () => {
        // arrange
        const { run, add, testFileName, fullFileName } = setupBase(folder, component);
        add(fullFileName);

        const templateWithFunction = '/__name@dasherize__.spec.ts.template';
        add(templateWithFunction, getTestFileContents(templateWithCustomUpdateTemplates()));

        // act
        const result = await run({ classTemplate: templateWithFunction });
        let files: string[] = [];
        result.visit((f) => files.push(f));
        // assert
        expect(result.exists(`${dirname(testFileName)}/example-component.spec.ts`)).toBe(true);
    });

    it('should be able to use multiple functions in the spec file name', async () => {
        // arrange
        const { run, add, testFileName, fullFileName } = setupBase(folder, component);
        add(fullFileName);

        const templateWithFunction = '/__name@dasherize@camelize__.spec.ts.template';
        add(templateWithFunction, getTestFileContents(templateWithCustomUpdateTemplates()));

        // act
        const result = await run({ classTemplate: templateWithFunction });
        // assert
        expect(result.exists(`${dirname(testFileName)}/exampleComponent.spec.ts`)).toBe(true);
    });

    it('when both config classTemplate and command line arg classTemplate passed in it should use CLI arg', async () => {
        // arrange
        const { run, add, fullFileName, testFilesFolder } = setupBase(folder, component);
        add(fullFileName);
        add('just.template', 'CLI Args take precedence');
        add(`/${basename(customTemplateName).trim()}`, getTestFileContents(customTemplateName));

        // act
        const result = await run({
            config: getTestFile(configFileName()),
            classTemplate: 'just.template',
        });
        const resFile = getTestFile(`${testFilesFolder}/just`);
        // assert
        expect(result.exists(resFile)).toBe(true);
        expect(result.readContent(resFile)).toEqual('CLI Args take precedence');
    });
});
function configFileName(): string {
    return `${folder}/valid-config-valid-class-template.json`;
}
