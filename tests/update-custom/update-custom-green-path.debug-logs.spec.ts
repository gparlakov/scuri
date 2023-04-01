import { Subject } from 'rxjs';
import { listenLogger, subscribe } from '../get-logger-errors';
import { setupBase } from '../spec/common';
describe('update-custom', () => {

    const file = 'for-debug-logs.ts';
    const classTemplate = '__specFileName__.template';
    const folder = 'debug-logs';
    let stop$: Subject<void>;

    beforeEach(() => {
        stop$ = new Subject<void>();
    });

    afterEach(() => {
        stop$.next();
    });

    // this fails on linux/mac
    xit('should debug-output the skipped methods and the template results prior to dedupe', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        add(classTemplate, template());
        // act
        let logs: string[] = [];
        letLogger(l => logs = subscribe(listenLogger(l, { level: 'debug' }), stop$));
        await run({ name: fullFileName, update: true, classTemplate }, 'update-custom');

        // skipping methods
        expect(logs).toMatchSnapshot();
    });

    it('should debug-output the empty template results', async () => {

        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        add(classTemplate, template('/**scuri:template:empty-template:*/'));

        let logs: string[] = [];
        letLogger(l => logs = subscribe(listenLogger(l, { level: 'debug' }), stop$));

        await run({ name: fullFileName, classTemplate },'update-custom');

        expect(logs).toContain('No result from applying template for empty-template.');
    });

    it('should error on failed template', async () => {
     // arrange
     const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
     add(fullFileName);
     add(testFileName);
     add(classTemplate, template('/**scuri:template:empty-template:<%= test.forEach %> <% sharans.forEach(s => {%> tt<%=s <% }%>*/'));

     await run({ name: fullFileName, classTemplate },'update-custom')
           .catch((e) => {
                expect(e).toEqual(new SyntaxError("Unexpected token '%'"));
            });
    });
});


function template(addition: string = '') {
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
${addition}
`;
}
