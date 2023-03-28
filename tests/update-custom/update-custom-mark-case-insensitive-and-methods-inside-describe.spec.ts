import { setupBase } from '../spec/common';

describe('update-custom', () => {
    const name = 'to-update.component.ts';
    const folder = 'update-custom-mark'
    const specFileName = 'to-update.component.custom.spec.ts';
    const classTemplate = '__normalizedName__.custom.spec.ts.template';


    it('should add new and not repeat existing lines', async () => {

        // arrange
        const { run, fullFileName, add, getFilePath } = setupBase(folder, name);
        add(fullFileName);
        const testFileName = getFilePath(specFileName);
        add(testFileName);
        add(classTemplate, template());
        // act
        const result = await run({ name: fullFileName, classTemplate }, 'update-custom');

        // assert
        const specFile = result!.readContent(testFileName).toString();
        expect(specFile).toMatchInlineSnapshot(`
            "import { ToUpdateComponent } from './to-update.component';
            import { autoSpy, spyInject } from 'jasmine-auto-spies';

            describe('ToUpdateComponent', () => {

                let serviceSpy: Service;
                let routerSpy: Router;
                let justSpy: Just;
                // scuri:lets

                beforeEach(
                    waitForAsync(() => {
                        TestBed.configureTestingModule({
                            providers: [
                                MyDirective,

                                { provide: Service, useClass: autoSpy(Service, 'Service') },
                                { provide: Router, useClass: autoSpy(Router, 'Router') },
                                { provide: Just, useClass: autoSpy(Just, 'Just') },
                                // scuri:injectables
                            ]
                        });

                        directive = TestBed.inject(MyDirective);

                        serviceSpy = spyInject<Service>(TestBed.inject(Service));
                        routerSpy = spyInject<Router>(TestBed.inject(Router));
                        justSpy = spyInject<Just>(TestBed.inject(Just));
                        // scuri:get-instances

                    })
                );

                it('when myMethod is called it should', () => {
                    // arrange
                    // act
                    t.myMethod();
                    // assert
                    // expect(t).toEqual
                });


                it('when mySecondMethod is called it should', () => {
                    // arrange
                    // act
                    t.mySecondMethod();
                    // assert
                    // expect(t).toEqual
                });

            // scuri:Methods

            });

            "
        `);
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
    /** scuri:template:methods-skipDedupe:<% publicMethods.forEach(meth=> {if(meth != '') { %>it('when <%= meth %> is called it should', () => {
        // arrange
        // act
        <%= shorthand %>.<%= meth %>();
        // assert
        // expect(<%= shorthand %>).toEqual
    });
<% }}) %>*/
`;
}
