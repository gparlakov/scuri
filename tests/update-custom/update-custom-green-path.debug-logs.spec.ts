import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Options } from '../../src/update-custom/index';
import { listenLogger, subscribe } from '../get-logger-errors';
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

    it('should debug-output the skipped methods and the template results prior to dedupe', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger, { level: 'debug' }), 5); // expecting 5 entries

        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate, specFileContents: specFileContent() }, tree)
            .toPromise();

        // skipping methods
        expect(logs[0]).toEqual('Skipping methods: [myMethod] as they seem to be already in the spec.');

        // dedupe lets
        expect(logs[1]).toEqual(`Template result before de-duplication: [let serviceSpy: Service;
let routerSpy: Router;
let justSpy: Just;
]`);

        // dedupe providers
        expect(logs[2]).toEqual(`Template result before de-duplication: [{ provide: Service, useClass: autoSpy(Service, 'Service') },
{ provide: Router, useClass: autoSpy(Router, 'Router') },
{ provide: Just, useClass: autoSpy(Just, 'Just') },
]`);

        // dedupe instances
        expect(logs[3]).toEqual(`Template result before de-duplication: [serviceSpy = spyInject<Service>(TestBed.inject(Service));
routerSpy = spyInject<Router>(TestBed.inject(Router));
justSpy = spyInject<Just>(TestBed.inject(Just));
]`);

        // dedupe methods
        expect(logs[4]).toEqual(`Template result before de-duplication: [it('when yourMethod is called it should', () => {
    // arrange
    // act
    e.yourMethod();
    // assert
    // expect(e).toEqual
});
it('when theirMethod is called it should', () => {
    // arrange
    // act
    e.theirMethod();
    // assert
    // expect(e).toEqual
});
]`);
    });

    it('should debug-output the empty template results', async () => {
        const r = tree.beginUpdate(classTemplate)
        r.insertRight(1813, '/**scuri:template:empty-template:*/');
        tree.commitUpdate(r);
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger, { level: 'debug' }), 6); // expecting 5 entries

        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate, specFileContents: specFileContent() }, tree)
            .toPromise();

        expect(logs[5]).toEqual('No result from applying template for empty-template.');
    });

    it('should error on failed template', async () => {
        const r = tree.beginUpdate(classTemplate)
        r.insertRight(1813, '/**scuri:template:empty-template:<%= test.forEach %> <% sharans.forEach(s => {%> tt<%=s <% }%>*/');
        tree.commitUpdate(r);
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger, { level: 'error' }), 5); // expecting 5 entries

        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate, specFileContents: specFileContent() }, tree)
            .toPromise()
            .catch(e => {
                expect(logs).toEqual([]);
                expect(e).toEqual(new SyntaxError('Unexpected token \'%\''));
            })
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
