import { setupBase, splitLines } from '../spec/common';

const folder = 'spec-with-custom-template-and-update';
describe('spec with customTemplate and update ("update-custom" called from "spec")', () => {
    const name = 'example-swctau.component.ts';
    const classTemplate = '__specFileName__.template';

    it('should add new and not repeat existing lines', async () => {

        const { run, fullFileName, add, testFileName } = setupBase(folder, name);
        add(fullFileName);
        add(testFileName);
        add(classTemplate, templateContent());

        // act
        const result = await run({ name: fullFileName, classTemplate, update: true })

        // assert
        const lines = splitLines(result.readContent(testFileName).toString())
        let i = 0;

        expect(lines[i++]).toEqual("import { MyDirective } from './directive';")
        expect(lines[i++]).toEqual("import { autoSpy, spyInject } from 'jasmine-auto-spies';")
        expect(lines[i++]).toEqual('')
        expect(lines[i++]).toEqual("describe('ExampleComponent', () => {")
        expect(lines[i++]).toEqual('    let serviceSpy: Service;')
        expect(lines[i++]).toEqual('    let routerSpy: Router;')
        expect(lines[i++]).toEqual('    let justSpy: Just;')
        expect(lines[i++]).toEqual('    // scuri:lets')
        expect(lines[i++]).toEqual('')
        expect(lines[i++]).toEqual('    beforeEach(')
        expect(lines[i++]).toEqual('        waitForAsync(() => {')
        expect(lines[i++]).toEqual('            TestBed.configureTestingModule({')
        expect(lines[i++]).toEqual('                providers: [')
        expect(lines[i++]).toEqual('                    MyDirective,')
        expect(lines[i++]).toEqual("                    { provide: Service, useClass: autoSpy(Service, 'Service') },")
        expect(lines[i++]).toEqual("                    { provide: Router, useClass: autoSpy(Router, 'Router') },")
        expect(lines[i++]).toEqual("                    { provide: Just, useClass: autoSpy(Just, 'Just') },")
        expect(lines[i++]).toEqual('                    // scuri:injectables')
        expect(lines[i++]).toEqual('                ]')
        expect(lines[i++]).toEqual('            });')
        expect(lines[i++]).toEqual('')
        expect(lines[i++]).toEqual('            directive = TestBed.inject(MyDirective);')
        expect(lines[i++]).toEqual('            serviceSpy = spyInject<Service>(TestBed.inject(Service));')
        expect(lines[i++]).toEqual('            routerSpy = spyInject<Router>(TestBed.inject(Router));')
        expect(lines[i++]).toEqual('            justSpy = spyInject<Just>(TestBed.inject(Just));')
        expect(lines[i++]).toEqual('            // scuri:get-instances')
        expect(lines[i++]).toEqual('        })')
        expect(lines[i++]).toEqual('    );')
        expect(lines[i++]).toEqual('')
        expect(lines[i++]).toEqual("    it('when myMethod is called it should', () => {")
        expect(lines[i++]).toEqual('        // arrange')
        expect(lines[i++]).toEqual('        // act')
        expect(lines[i++]).toEqual('        e.myMethod();')
        expect(lines[i++]).toEqual('        // assert')
        expect(lines[i++]).toEqual('        // expect(e).toEqual')
        expect(lines[i++]).toEqual('    });')
        expect(lines[i++]).toEqual('')
        expect(lines[i++]).toEqual("    it('when yourMethod is called it should', () => {")
        expect(lines[i++]).toEqual('        // arrange')
        expect(lines[i++]).toEqual('        // act')
        expect(lines[i++]).toEqual('        e.yourMethod();')
        expect(lines[i++]).toEqual('        // assert')
        expect(lines[i++]).toEqual('        // expect(e).toEqual')
        expect(lines[i++]).toEqual('    });')
        expect(lines[i++]).toEqual("    it('when theirMethod is called it should', () => {")
        expect(lines[i++]).toEqual('        // arrange')
        expect(lines[i++]).toEqual('        // act')
        expect(lines[i++]).toEqual('        e.theirMethod();')
        expect(lines[i++]).toEqual('        // assert')
        expect(lines[i++]).toEqual('        // expect(e).toEqual')
        expect(lines[i++]).toEqual('    });')
        expect(lines[i++]).toEqual('    ')
        expect(lines[i++]).toEqual('    // scuri:methods')
        expect(lines[i++]).toEqual('});')
    });


    it('should search for the spec file by the classTemplate name - plain', async () => {
        const classTemplate = 'demo.ts.template';

        const { run, fullFileName, add, getFilePath } = setupBase(folder, name);
        const specFileName = getFilePath('demo.ts');
        add(fullFileName);
        add(specFileName);
        add(classTemplate, templateContent());

        // act
        const result = await run({ name: fullFileName, classTemplate, update: true })

        const lines = splitLines(result.readContent(specFileName).toString());
        validateContents(lines);
    });

    it('should search for the spec file by the classTemplate name - property', async () => {
        const classTemplate = '__specFileName__.custom-spec.ts.template';
        const specFileName = 'example-swctau.component.spec.ts.custom-spec.ts';
        await validateCustomSpecName(name, specFileName, classTemplate);
    });

    it('should search for the spec file by the classTemplate name - property and function', async () => {
        const classTemplate = '__name@dasherize__.custom-spec.ts.template';
        const specFileName = 'example-component.custom-spec.ts';
        await validateCustomSpecName(name, specFileName, classTemplate);
    });

    it('should search for the spec file by the classTemplate name - nested template path, property and function', async () => {
        const classTemplate = './deep/path/__name@dasherize__.custom-spec.ts.template';
        const specFileName = 'example-component.custom-spec.ts';
        await validateCustomSpecName(name, specFileName, classTemplate);
    });

    it('should search for the spec file by the classTemplate name - nested template and spec paths, property, and function', async () => {
        const name = 'my/path/example-swctau.component.ts'
        const classTemplate = './deep/path/__name@dasherize__.custom-spec.ts.template';
        const specFileName = 'my/path/example-component.custom-spec.ts';
        await validateCustomSpecName(name, specFileName, classTemplate);
    });

    it('should search for the spec file by the classTemplate name - className', async () => {
        const name = 'my/path/example-swctau.component.ts'
        const classTemplate = './deep/path/__className__.spec.ts.template';
        const specFileName = 'my/path/ExampleComponent.spec.ts';
        await validateCustomSpecName(name, specFileName, classTemplate);
    });
});


function templateContent() {
    return `<% params.forEach(p => { if(p.importPath) {%>import { <%= p.type %> } from '<%= p.importPath %>';
<% }}) %>import { <%= className %> } from './<%= normalizedName %>';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('<%= className %>', () => {
  <%params.forEach(p => {%> let <%= p.type %>Spy: <%= p.type %>;
      <% }) %>
    // scuri:lets

  beforeEach(
  waitForAsync(() => {
      TestBed.configureTestingModule({
      providers: [
              MyDirective,
          <%params.forEach(p => {%> { provide: <%= p.type %>, useClass: autoSpy(<%= p.type %>, '<%= p.type %>') },
          <% }) %>
          // scuri:injectables
      ]
      });

      directive = TestBed.inject(MyDirective);
      <%params.forEach(p => {%> <%= p.type %>Spy = spyInject<<%= p.type %>>(TestBed.inject(<%= p.type %>));
      <% }) %>
      // scuri:get-instances

  })
  );

  <% publicMethods.forEach(meth=> {if(meth != '') { %>it('when <%= meth %> is called it should', () => {
  // arrange
  // act
  <%= shorthand %>.<%= meth %>();
  // assert
  // expect(<%= shorthand %>).toEqual
  });
  <% }}) %>

  // scuri:methods
});

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
<% }}) %>*/
`;
}

function validateContents(result: string[]) {
    let i = 0;

    expect(result[i++]).toEqual("import { MyDirective } from './directive';");
    expect(result[i++]).toEqual("import { autoSpy, spyInject } from 'jasmine-auto-spies';");
    expect(result[i++]).toEqual('');
    expect(result[i++]).toEqual("describe('ExampleComponent', () => {");
    expect(result[i++]).toEqual('    let serviceSpy: Service;');
    expect(result[i++]).toEqual('    let routerSpy: Router;');
    expect(result[i++]).toEqual('    let justSpy: Just;');
    expect(result[i++]).toEqual('    // scuri:lets');
    expect(result[i++]).toEqual('');
    expect(result[i++]).toEqual('    beforeEach(');
    expect(result[i++]).toEqual('        waitForAsync(() => {');
    expect(result[i++]).toEqual('            TestBed.configureTestingModule({');
    expect(result[i++]).toEqual('                providers: [');
    expect(result[i++]).toEqual('                    MyDirective,');
    expect(result[i++]).toEqual("                    { provide: Service, useClass: autoSpy(Service, 'Service') },");
    expect(result[i++]).toEqual("                    { provide: Router, useClass: autoSpy(Router, 'Router') },");
    expect(result[i++]).toEqual("                    { provide: Just, useClass: autoSpy(Just, 'Just') },");
    expect(result[i++]).toEqual('                    // scuri:injectables');
    expect(result[i++]).toEqual('                ]');
    expect(result[i++]).toEqual('            });');
    expect(result[i++]).toEqual('');
    expect(result[i++]).toEqual('            directive = TestBed.inject(MyDirective);');
    expect(result[i++]).toEqual('            serviceSpy = spyInject<Service>(TestBed.inject(Service));');
    expect(result[i++]).toEqual('            routerSpy = spyInject<Router>(TestBed.inject(Router));');
    expect(result[i++]).toEqual('            justSpy = spyInject<Just>(TestBed.inject(Just));');
    expect(result[i++]).toEqual('            // scuri:get-instances');
    expect(result[i++]).toEqual('        })');
    expect(result[i++]).toEqual('    );');
    expect(result[i++]).toEqual('');
    expect(result[i++]).toEqual("    it('when myMethod is called it should', () => {");
    expect(result[i++]).toEqual('        // arrange');
    expect(result[i++]).toEqual('        // act');
    expect(result[i++]).toEqual('        e.myMethod();');
    expect(result[i++]).toEqual('        // assert');
    expect(result[i++]).toEqual('        // expect(e).toEqual');
    expect(result[i++]).toEqual('    });');
    expect(result[i++]).toEqual('');
    expect(result[i++]).toEqual("    it('when yourMethod is called it should', () => {");
    expect(result[i++]).toEqual('        // arrange');
    expect(result[i++]).toEqual('        // act');
    expect(result[i++]).toEqual('        e.yourMethod();');
    expect(result[i++]).toEqual('        // assert');
    expect(result[i++]).toEqual('        // expect(e).toEqual');
    expect(result[i++]).toEqual('    });');
    expect(result[i++]).toEqual("    it('when theirMethod is called it should', () => {");
    expect(result[i++]).toEqual('        // arrange');
    expect(result[i++]).toEqual('        // act');
    expect(result[i++]).toEqual('        e.theirMethod();');
    expect(result[i++]).toEqual('        // assert');
    expect(result[i++]).toEqual('        // expect(e).toEqual');
    expect(result[i++]).toEqual('    });');
    expect(result[i++]).toEqual('    ');
    expect(result[i++]).toEqual('    // scuri:methods');
    expect(result[i++]).toEqual('});');
}

async function validateCustomSpecName(name: string, specFileName: string, classTemplate: string) {

    const { run, fullFileName, add, getFilePath } = setupBase(folder, name);
    const fullSpecFileName = getFilePath(specFileName);
    add(fullFileName);
    add(fullSpecFileName);
    add(classTemplate, templateContent());

    const treeAfter = await run({ name: fullFileName, classTemplate, update: true });

    const result = splitLines(treeAfter?.read(fullSpecFileName)?.toString('utf8') ?? '');
    validateContents(result);
}
