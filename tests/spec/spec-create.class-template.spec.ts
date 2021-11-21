import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { EOL } from 'os';
import { collectionPath } from './common';

const templateFileName = '__specFileName__.template';
describe('Option: classTemplate', () => {
    let treeWithCustomClassTemplate: Tree;
    beforeEach(() => {
        treeWithCustomClassTemplate = Tree.empty();
        treeWithCustomClassTemplate.create(
            'example.component.ts',
            classContent()
        );

        treeWithCustomClassTemplate.create(
            templateFileName,
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

    it('when class template has update templates - skip them from create result', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        treeWithCustomClassTemplate.overwrite(templateFileName, templateWithCustomUpdateTemplates());

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

    it('should be able to use functions in the spec file name', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const templateFile = 'templates/spec/__name@dasherize__.spec.ts.template';
        // act
        treeWithCustomClassTemplate.create(templateFile, templateWithCustomUpdateTemplates());

        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.component.ts', classTemplate: templateFile },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('./example-component.spec.ts')).toBe(true);

    });

    it('should be able to use multiple functions in the spec file name', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const templateFile = 'templates/spec/__name@dasherize@camelize__.spec.ts.template';
        // act
        treeWithCustomClassTemplate.create(templateFile, templateWithCustomUpdateTemplates());

        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: 'example.component.ts', classTemplate: templateFile },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists('./exampleComponent.spec.ts')).toBe(true);
    });

    it('should be able to use folderfy to match the file path', async () => {
        // arrange
        const className = '.\\my\\class\\location\\example-test.component.ts';
        const specName = './my/class/location/example_component.custom.ts'
        const templateName = 'templates/spec/__name@underscore__.custom.ts.template';
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        treeWithCustomClassTemplate.create(className, classContent())
        treeWithCustomClassTemplate.create(templateName, templateWithCustomUpdateTemplates());

        const result = await runner
            .runSchematicAsync(
                'spec',
                { name: className, classTemplate: templateName },
                treeWithCustomClassTemplate
            )
            .toPromise();
        // assert
        expect(result.exists(specName)).toBe(true);
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
        expect(result.exists('just')).toBe(true);

        expect(result.readContent('just')).toEqual('CLI Args take precedence');
    });
});


function classContent(): string | Buffer {
    return `import { ADep } from '../my/relative/path';
import { DDep } from '@angular/router';

export class ExampleComponent {
    constructor(
        private aDep: ADep,
        private d: DDep,
    ) {}

    aMethod();
}`;
}

function templateWithCustomUpdateTemplates() {
    return `<% params.forEach(p => { if(p.importPath) {%>import { <%= p.type %> } from '<%= p.importPath %>';
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
/** scuri:template:lets:<%params.forEach(p => {%>let <%= camelize(p.type) %>Spy: <%= p.type %>;
 <% }) %>*/
/** scuri:template:injectables:<%params.forEach(p => {%>{ provide: <%= p.type %>, useClass: autoSpy(<%= p.type %>, '<%= p.type %>') },
 <% }) %>*/
/** scuri:template:get-instances:<%params.forEach(p => {%><%= camelize(p.type) %>Spy = spyInject<<%= p.type %>>(TestBed.inject(<%= p.type %>));
 <% }) %>*/
/** scuri:template:methods-skipDeDupe:<% publicMethods.forEach(meth=> {if(meth != '') { %>it('when <%= meth %> is called it should', () => {
    // arrange
    // act
    <%= shorthand %>.<%= meth %>();
    // assert
    // expect(<%= shorthand %>).toEqual
});
<% }}) %>*/`
}
