import { Tree } from '@angular-devkit/schematics';
import { log } from 'console';
import { setupBase, splitLines } from './common';

const file = 'starter-demo-class.ts';
const folder = 'spec-create-starter-demo-class-template';
const templateFileName = '__specFileName__-or-__normalizedName__.custom-spec.ts.template';
describe('Option: classTemplate', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
    });

    it('should create the spec with the custom template from the https://gist.github.com/gparlakov/f299011829e229c9d37cf0cb38506d97#file-my-tmpl', async () => {
        // arrange
        const { run, fullFileName, add, getFilePath } = setupBase(folder, file);
        add(fullFileName);
        add(templateFileName, theDemoTemplate());
const newSpecFile = getFilePath('starter-demo-class.spec.ts-or-starter-demo-class.custom-spec.ts');
        // act

        const result = await run({ name: fullFileName, classTemplate: templateFileName });
        // assert
        expect(result.exists(newSpecFile)).toBe(
            true
        );

        const content = splitLines(result
            .readContent(newSpecFile));
        let i = 0;

        expect(content[i++]).toEqual(`/**`);
        expect(content[i++]).toEqual(` *  CUSTOM TEMPLATE`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *  AVAILABLE PROPERTIES:`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *  params: {importPath: string, type: string} `);
        expect(content[i++]).toEqual(` *  name: aDep`);
        expect(content[i++]).toEqual(` *  importPath: ../my/relative/path`);
        expect(content[i++]).toEqual(` *  type: ADep`);
        expect(content[i++]).toEqual(` *  `);
        expect(content[i++]).toEqual(` *  name: d`);
        expect(content[i++]).toEqual(` *  importPath: @angular/router`);
        expect(content[i++]).toEqual(` *  type: DDep`);
        expect(content[i++]).toEqual(` *  `);
        expect(content[i++]).toEqual(` *  specFileName: starter-demo-class.spec.ts`);
        expect(content[i++]).toEqual(` *  normalizedName: starter-demo-class`);
        expect(content[i++]).toEqual(` *  className: ExampleComponent`);
        expect(content[i++]).toEqual(` *  publicMethods: aMethod`);
        expect(content[i++]).toEqual(` *  declaration: const aDep = autoSpy(ADep);`);
        expect(content[i++]).toEqual(`    const d = autoSpy(DDep);`);
        expect(content[i++]).toEqual(`    `);
        expect(content[i++]).toEqual(` *  builderExports: aDep,`);
        expect(content[i++]).toEqual(`d,`);
        expect(content[i++]).toEqual(` *  constructorParams: aDep,d`);
        expect(content[i++]).toEqual(` *  shorthand: e`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *  AVAILABLE FUNCTIONS`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *  classify: ExampleComponent`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *  decamelize: example_component`);
        expect(content[i++]).toEqual(` *  dasherize: example-component`);
        expect(content[i++]).toEqual(` *  camelize: exampleComponent`);
        expect(content[i++]).toEqual(` *  classify: ExampleComponent`);
        expect(content[i++]).toEqual(` *  underscore: example_component`);
        expect(content[i++]).toEqual(` *  capitalize: ExampleComponent`);
        expect(content[i++]).toEqual(` *  levenshtein(name, specFileName): 21`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` *`);
        expect(content[i++]).toEqual(` */`);
        expect(content[i++]).toEqual(`import { ADep } from '../my/relative/path';`);
        expect(content[i++]).toEqual(`import { DDep } from '@angular/router';`);
        expect(content[i++]).toEqual(`import { ExampleComponent } from './starter-demo-class';`);
        expect(content[i++]).toEqual(`import { autoSpy } from 'autoSpy';`);
        expect(content[i++]).toEqual('');
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
        expect(content[i++]).toEqual('    ');
        expect(content[i++]).toEqual(`});`);
        expect(content[i++]).toEqual('');
        expect(content[i++]).toEqual(`// tslint-disable-type`);
        expect(content[i++]).toEqual(`function setup() {`);
        expect(content[i++]).toEqual(`    const aDep = autoSpy(ADep);`);
        expect(content[i++]).toEqual(`    const d = autoSpy(DDep);`);
        expect(content[i++]).toEqual(`    const builder = {`);
        expect(content[i++]).toEqual(`    aDep,`);
        expect(content[i++]).toEqual(`d,default() {`);
        expect(content[i++]).toEqual(`        return builder;`);
        expect(content[i++]).toEqual(`    },`);
        expect(content[i++]).toEqual(`    build() {`);
        expect(content[i++]).toEqual(`        return new ExampleComponent(aDep,d);`);
        expect(content[i++]).toEqual(`    }`);
        expect(content[i++]).toEqual(`    };`);
        expect(content[i++]).toEqual('');
        expect(content[i++]).toEqual(`    return builder;`);
        expect(content[i++]).toEqual(`}`);
    });
});

function theDemoTemplate() {
    return `/**
 *  CUSTOM TEMPLATE
 *
 *  AVAILABLE PROPERTIES:
 *
 *  params: {importPath: string, type: string} <% params.forEach(p => { %>
 *  name: <%= p.name %>
 *  importPath: <%= p.importPath %>
 *  type: <%= p.type %>
 *  <% }) %>
 *  specFileName: <%= specFileName %>
 *  normalizedName: <%= normalizedName %>
 *  className: <%= className %>
 *  publicMethods: <%= publicMethods %>
 *  declaration: <%= declaration %>
 *  builderExports: <%= builderExports %>
 *  constructorParams: <%= constructorParams %>
 *  shorthand: <%= shorthand %>
 *
 *  AVAILABLE FUNCTIONS
 *
 *  classify: <%=classify(name)%>
 *
 *  decamelize: <%= decamelize(name) %>
 *  dasherize: <%= dasherize(name) %>
 *  camelize: <%= camelize(name) %>
 *  classify: <%= classify(name) %>
 *  underscore: <%= underscore(name) %>
 *  capitalize: <%= capitalize(name) %>
 *  levenshtein(name, specFileName): <%= levenshtein(name, specFileName) %>
 *
 *
 */
<% params.forEach(p => { if(p.importPath) {%>import { <%= p.type %> } from '<%= p.importPath %>';
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

// tslint-disable-type
function setup() {
    <%= declaration %>const builder = {
    <%= builderExports %>default() {
        return builder;
    },
    build() {
        return new <%= className %>(<%= constructorParams %>);
    }
    };

    return builder;
}`;
}
