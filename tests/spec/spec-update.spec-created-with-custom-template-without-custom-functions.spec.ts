import { setupBase } from '../spec/common';

describe('update', () => {

    const folder = 'spec-create-with-custom-template-without-custom-function';
    const file = 'example.ts';

    const classTemplate = '__specFileName__.template';

    it('should run standard update', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        add(classTemplate, template());

        const result = await run({
            name: fullFileName,
            classTemplate,
            update: true,
        });

        expect(result.read(testFileName)?.toString()).toMatchSnapshot();
    });
});

function template() {
    return `<% params.forEach(p => { if(p.importPath) {%>import { <%= p.type %> } from '<%= p.importPath %>';
<% }}) %>import { <%= className %> } from './<%= normalizedName %>';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('<%= className %>', () => {
  <%params.forEach(p => {%> let <%= p.type %>Spy: <%= p.type %>;
      <% }) %>
  beforeEach(
  waitForAsync(() => {
      TestBed.configureTestingModule({
      providers: [
              MyDirective,
          <%params.forEach(p => {%> { provide: <%= p.type %>, useClass: autoSpy(<%= p.type %>, '<%= p.type %>') },
          <% }) %>      ]
      });

      directive = TestBed.inject(MyDirective);
      <%params.forEach(p => {%> <%= p.type %>Spy = spyInject<<%= p.type %>>(TestBed.inject(<%= p.type %>));
      <% }) %>
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
});
`;
}
