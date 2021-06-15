import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { EOL } from 'os';
import { collectionPath } from './common';

describe('Option: classTemplate', () => {
    let treeWithCustomClassTemplate: Tree;
    beforeEach(() => {
        treeWithCustomClassTemplate = Tree.empty();
        treeWithCustomClassTemplate.create(
            'example.component.ts',
            `import { ADep } from '../my/relative/path';
import { DDep } from '@angular/router';

export class ExampleComponent {
    constructor(
        private aDep: ADep,
        private d: DDep,
    ) {}

    aMethod();
}`
        );

        treeWithCustomClassTemplate.create(
            '__specFileName__.template',
            `<% params.forEach(p => { if(p.importPath) {%>import { <%= p.type %> } from '<%= p.importPath %>';
<% }}) %>import { <%= className %> } from './<%= normalizedName %>';
import { autoSpy } from 'autoSpy';

describe('<%= className %>', () => {
    <% publicMethods.forEach(meth=> {if(meth != '') { %>it('when <%= meth %> is called it should', () => {
    // arrange
    const { build } = setup().default();
    const <%= shorthand %> = build();
    // act
    <%= shorthand %>.<%= meth %>();
    // assert
    // expect(<%= shorthand %>).toEqual
    });
    <% } else { %>
    it('it should construct', () => {
    // arrange
    const { build } = setup().default();
    // act
    const <%= shorthand %> = build();
    // assert
    // expect(<%= shorthand %>).toEqual
    });
    <% }}) %>
});

// add a comment here
function setup() {
    <%= declaration %>
    const builder = {
    <%= builderExports %>
    default() {
        return builder;
    },
    build() {
        return new <%= className %>(<%= constructorParams %>);
    }
    };

    return builder;
}
`
        );
    });

    it('when class template missing it should stop', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        return await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.component.ts', classTemplate: 'missing-file-path' },
                treeWithCustomClassTemplate
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
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.component.ts', classTemplate: '__specFileName__.template' },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('example.component.spec.ts')).toBe(true);

        const content = result
            .readContent('example.component.spec.ts')
            .replace(EOL, '\n')
            .split('\n');
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
        expect(content[i++]).toEqual(`const d = autoSpy(DDep);`);
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
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.component.ts', config: 'tests/spec/test-data/valid-config-valid-class-template.json' },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('example.component.spec.ts')).toBe(true);

        const content = result
            .readContent('example.component.spec.ts')
            .replace(EOL, '\n')
            .split('\n');
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
        expect(content[i++]).toEqual(`const d = autoSpy(DDep);`);
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

    it('when both config classTemplate and command line arg classTemplate passed in it should use CLI arg', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);

        treeWithCustomClassTemplate.create('just.template', 'CLI Args take precedence');

        // act
        const result = await runner
            .runSchematicAsync(
                'spec',
                {
                    name: 'example.component.ts',
                    config: 'tests/spec/test-data/valid-config-valid-class-template.json',
                    classTemplate: 'just.template'
                },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('example.component.spec.ts')).toBe(true);

        expect(result.readContent('example.component.spec.ts')).toEqual('CLI Args take precedence');
    });
});
