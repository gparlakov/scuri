import { setupBase, splitLines } from '../spec/common';

describe('update-custom', () => {
    const name = 'example.ts';
    const folder = 'update-custom-green-path';
    const classTemplate = '__specFileName__.template';

    it('should add new and not repeat existing lines', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, name);
        add(fullFileName);
        add(testFileName);
        add(classTemplate, template());
        // act
        const r = await run({ name: fullFileName, classTemplate }, 'update-custom');

        // assert
        const specFile = r!.readContent(testFileName);
        const lines = splitLines(specFile);

        let i = 0;

        expect(lines[i++]).toEqual("import { MyDirective } from './directive';");
        expect(lines[i++]).toEqual("import { autoSpy, spyInject } from 'jasmine-auto-spies';");
        expect(lines[i++]).toEqual('');
        expect(lines[i++]).toEqual("describe('ExampleComponent', () => {");
        expect(lines[i++]).toEqual('    let serviceSpy: Service;');
        expect(lines[i++]).toEqual('    let routerSpy: Router;');
        expect(lines[i++]).toEqual('    let justSpy: Just;');
        expect(lines[i++]).toEqual('    // scuri:lets');
        expect(lines[i++]).toEqual('');
        expect(lines[i++]).toEqual('    beforeEach(');
        expect(lines[i++]).toEqual('        waitForAsync(() => {');
        expect(lines[i++]).toEqual('            TestBed.configureTestingModule({');
        expect(lines[i++]).toEqual('                providers: [');
        expect(lines[i++]).toEqual('                    MyDirective,');
        expect(lines[i++]).toEqual(
            "                    { provide: Service, useClass: autoSpy(Service, 'Service') },"
        );
        expect(lines[i++]).toEqual(
            "                    { provide: Router, useClass: autoSpy(Router, 'Router') },"
        );
        expect(lines[i++]).toEqual(
            "                    { provide: Just, useClass: autoSpy(Just, 'Just') },"
        );
        expect(lines[i++]).toEqual('                    // scuri:injectables');
        expect(lines[i++]).toEqual('                ]');
        expect(lines[i++]).toEqual('            });');
        expect(lines[i++]).toEqual('');
        expect(lines[i++]).toEqual('            directive = TestBed.inject(MyDirective);');
        expect(lines[i++]).toEqual(
            '            serviceSpy = spyInject<Service>(TestBed.inject(Service));'
        );
        expect(lines[i++]).toEqual(
            '            routerSpy = spyInject<Router>(TestBed.inject(Router));'
        );
        expect(lines[i++]).toEqual('            justSpy = spyInject<Just>(TestBed.inject(Just));');
        expect(lines[i++]).toEqual('            // scuri:get-instances');
        expect(lines[i++]).toEqual('        })');
        expect(lines[i++]).toEqual('    );');
        expect(lines[i++]).toEqual('');
        expect(lines[i++]).toEqual("    it('when myMethod is called it should', () => {");
        expect(lines[i++]).toEqual('        // arrange');
        expect(lines[i++]).toEqual('        // act');
        expect(lines[i++]).toEqual('        e.myMethod();');
        expect(lines[i++]).toEqual('        // assert');
        expect(lines[i++]).toEqual('        // expect(e).toEqual');
        expect(lines[i++]).toEqual('    });');
        expect(lines[i++]).toEqual('');
        expect(lines[i++]).toEqual("    it('when yourMethod is called it should', () => {");
        expect(lines[i++]).toEqual('        // arrange');
        expect(lines[i++]).toEqual('        // act');
        expect(lines[i++]).toEqual('        e.yourMethod();');
        expect(lines[i++]).toEqual('        // assert');
        expect(lines[i++]).toEqual('        // expect(e).toEqual');
        expect(lines[i++]).toEqual('    });');
        expect(lines[i++]).toEqual("    it('when theirMethod is called it should', () => {");
        expect(lines[i++]).toEqual('        // arrange');
        expect(lines[i++]).toEqual('        // act');
        expect(lines[i++]).toEqual('        e.theirMethod();');
        expect(lines[i++]).toEqual('        // assert');
        expect(lines[i++]).toEqual('        // expect(e).toEqual');
        expect(lines[i++]).toEqual('    });');
        expect(lines[i++]).toEqual('    ');
        expect(lines[i++]).toEqual('    // scuri:methods');
        expect(lines[i++]).toEqual('});');
    });
});

function template() {
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
