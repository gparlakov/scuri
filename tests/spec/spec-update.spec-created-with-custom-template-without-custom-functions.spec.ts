import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Subject } from 'rxjs';
import { Options } from '../../src/update-custom/index';
import { collectionPath } from '../spec/common';
describe('update', () => {
    let tree: Tree;
    const name = 'example.ts';
    const specFileName = 'example.spec.ts';
    const classTemplate = '__specFileName__.template';
    let stop$: Subject<void>;

    beforeEach(() => {
        tree = Tree.empty();

        tree.create(name, fileContent());
        tree.create(specFileName, specFileContent());
        tree.create(classTemplate, template());

        stop$ = new Subject<void>();
    });

    afterEach(() => {
        stop$.next();
    });

    it('should run standard update', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);

        await runner
            .runSchematicAsync(
                'spec',
                <Options>{ name, classTemplate, specFileContents: specFileContent(), update: true },
                tree
            )
            .toPromise();

        expect(tree.read(specFileName)?.toString()).toMatchInlineSnapshot(`
            "import { MyDirective } from './directive';
            import { autoSpy, spyInject } from 'jasmine-auto-spies';
            import { Service } from './service';
            import { Router } from '@the/router';
            import { Just } from 'maybe';

            describe('ExampleComponent', () => {

                beforeEach(async(() => {
                    const a = setup().default();
                    TestBed.configureTestingModule({
                        providers: [
                            MyDirective,
                            { provide: Service, useClass: autoSpy(Service, 'Service') },
                        ]
                    }).configureTestingModule({ providers: [{ provide: Router, useValue: a.router },
                        { provide: Just, useValue: a.just }] });

                    directive = TestBed.inject(MyDirective);
                }));

                it('when myMethod is called it should', () => {
                    // arrange
                    // act
                    e.myMethod();
                    // assert
                    // expect(e).toEqual
                });
                it('when yourMethod is called it should', () => {
                    // arrange
                    const { build } = setup().default();
                    const e = build();
                    // act
                    e.yourMethod();
                    // assert
                    // expect(e).toEqual
                });
                it('when theirMethod is called it should', () => {
                    // arrange
                    const { build } = setup().default();
                    const e = build();
                    // act
                    e.theirMethod();
                    // assert
                    // expect(e).toEqual
                });
            });

            function setup() {
                const service = autoSpy(Service);
                const router = autoSpy(Router);
                const just = autoSpy(Just);
                const builder = {
                    service,
                    router,
                    just,
                    default() {
                        return builder;
                    },
                    build() {
                        return new ExampleComponent(service, router, just);
                    }
                }
                return builder;
            }"
        `);
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

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            providers: [
                MyDirective,
                { provide: Service, useClass: autoSpy(Service, 'Service') },
            ]
        });

        directive = TestBed.inject(MyDirective);
    }));

    it('when myMethod is called it should', () => {
        // arrange
        // act
        e.myMethod();
        // assert
        // expect(e).toEqual
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
