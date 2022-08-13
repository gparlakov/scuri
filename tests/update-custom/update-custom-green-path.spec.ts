import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Options } from '../../src/update-custom/index';
import { collectionPath } from '../spec/common';

describe('update-custom', () => {
    let tree: Tree;
    const name = 'example.ts';
    const specFileName = 'example.spec.ts';
    const classTemplate = '__specFileName__.template';

    beforeEach(() => {
        tree = Tree.empty();

        tree.create(name, fileContent());
        tree.create(specFileName, specFileContent());
        tree.create(classTemplate, template());
    });

    it('should add new and not repeat existing lines', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const treeAfter = await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate }, tree)
            .toPromise();
        const result = treeAfter?.read(specFileName)?.toString('utf8').split(/\r\n|\r|\n/g)!;
        expect(treeAfter.files.length).toEqual(3);
        let i = 0;

        expect(result[i++]).toEqual("import { MyDirective } from './directive';")
        expect(result[i++]).toEqual("import { autoSpy, spyInject } from 'jasmine-auto-spies';")
        expect(result[i++]).toEqual('')
        expect(result[i++]).toEqual("describe('ExampleComponent', () => {")
        expect(result[i++]).toEqual('    let serviceSpy: Service;')
        expect(result[i++]).toEqual('    let routerSpy: Router;')
        expect(result[i++]).toEqual('    let justSpy: Just;')
        expect(result[i++]).toEqual('    // scuri:lets')
        expect(result[i++]).toEqual('')
        expect(result[i++]).toEqual('    beforeEach(')
        expect(result[i++]).toEqual('        waitForAsync(() => {')
        expect(result[i++]).toEqual('            TestBed.configureTestingModule({')
        expect(result[i++]).toEqual('                providers: [')
        expect(result[i++]).toEqual('                    MyDirective,')
        expect(result[i++]).toEqual("                    { provide: Service, useClass: autoSpy(Service, 'Service') },")
        expect(result[i++]).toEqual("                    { provide: Router, useClass: autoSpy(Router, 'Router') },")
        expect(result[i++]).toEqual("                    { provide: Just, useClass: autoSpy(Just, 'Just') },")
        expect(result[i++]).toEqual('                    // scuri:injectables')
        expect(result[i++]).toEqual('                ]')
        expect(result[i++]).toEqual('            });')
        expect(result[i++]).toEqual('')
        expect(result[i++]).toEqual('            directive = TestBed.inject(MyDirective);')
        expect(result[i++]).toEqual('            serviceSpy = spyInject<Service>(TestBed.inject(Service));')
        expect(result[i++]).toEqual('            routerSpy = spyInject<Router>(TestBed.inject(Router));')
        expect(result[i++]).toEqual('            justSpy = spyInject<Just>(TestBed.inject(Just));')
        expect(result[i++]).toEqual('            // scuri:get-instances')
        expect(result[i++]).toEqual('        })')
        expect(result[i++]).toEqual('    );')
        expect(result[i++]).toEqual('')
        expect(result[i++]).toEqual("    it('when myMethod is called it should', () => {")
        expect(result[i++]).toEqual('        // arrange')
        expect(result[i++]).toEqual('        // act')
        expect(result[i++]).toEqual('        e.myMethod();')
        expect(result[i++]).toEqual('        // assert')
        expect(result[i++]).toEqual('        // expect(e).toEqual')
        expect(result[i++]).toEqual('    });')
        expect(result[i++]).toEqual('')
        expect(result[i++]).toEqual("    it('when yourMethod is called it should', () => {")
        expect(result[i++]).toEqual('        // arrange')
        expect(result[i++]).toEqual('        // act')
        expect(result[i++]).toEqual('        e.yourMethod();')
        expect(result[i++]).toEqual('        // assert')
        expect(result[i++]).toEqual('        // expect(e).toEqual')
        expect(result[i++]).toEqual('    });')
        expect(result[i++]).toEqual("    it('when theirMethod is called it should', () => {")
        expect(result[i++]).toEqual('        // arrange')
        expect(result[i++]).toEqual('        // act')
        expect(result[i++]).toEqual('        e.theirMethod();')
        expect(result[i++]).toEqual('        // assert')
        expect(result[i++]).toEqual('        // expect(e).toEqual')
        expect(result[i++]).toEqual('    });')
        expect(result[i++]).toEqual('    ')
        expect(result[i++]).toEqual('    // scuri:methods')
        expect(result[i++]).toEqual('});')
    });
});

function fileContent(): string {
    return `import { Router } from "@the/router";
import { Just } from "maybe";
import { Service } from "./service";
export class ExampleComponent {
    constructor(service: Service, router: Router, just: Just) {}

    myMethod() {}

    yourMethod() {}

    theirMethod() {}
}
`;
}

function specFileContent(): string {
    return `import { MyDirective } from './directive';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ExampleComponent', () => {
    // scuri:lets

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                providers: [
                    MyDirective,
                    { provide: Service, useClass: autoSpy(Service, 'Service') },
                    // scuri:injectables
                ]
            });

            directive = TestBed.inject(MyDirective);
            // scuri:get-instances
        })
    );

    it('when myMethod is called it should', () => {
        // arrange
        // act
        e.myMethod();
        // assert
        // expect(e).toEqual
    });

    // scuri:methods
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
