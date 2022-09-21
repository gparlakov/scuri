import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Options } from '../../src/update-custom/index';
import { collectionPath } from '../spec/common';

describe('update-custom without scuri:template: ', () => {
    let tree: Tree;
    const name = 'to-update.component.ts';
    const specFileName = 'to-update.component.custom.spec.ts';
    const classTemplate = '__normalizedName__.custom.spec.ts.template';

    beforeEach(() => {
        tree = Tree.empty();

        tree.create(name, fileContent());
        tree.create(specFileName, specFileContent());
        tree.create(classTemplate, template());
    });

    it('should throw error', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate }, tree)
            .toPromise()
            .catch(e => {
                expect(e).toEqual(
                    new Error('The custom template seems to be missing the scuri:template: mark. Perhaps you need the standard update?')
                );
            });
        });
    });

    function fileContent(): string {
        return `import { Router } from '@the/router';
import { Just } from 'maybe';
import { Service } from './service';
export class ToUpdateComponent {
  constructor(service: Service, router: Router, just: Just) {}

  myMethod() {}

  mySecondMethod() {}
}

`;
    }

    function specFileContent(): string {
        return `import { ToUpdateComponent } from './to-update.component';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ToUpdateComponent', () => {

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                providers: [
                    MyDirective,
                ]
            });

            directive = TestBed.inject(MyDirective);
        })
    );

    it('when myMethod is called it should', () => {
        // arrange
        // act
        t.myMethod();
        // assert
        // expect(t).toEqual
    });

});

`;
    }

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
          <% }) %>
      ]
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
