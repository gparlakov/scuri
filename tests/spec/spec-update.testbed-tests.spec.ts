import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('Calling update on existing spec with the TestBed.configureTestingModule', () => {
    let tree = Tree.empty();
    beforeEach(() => {
        tree = Tree.empty();

        tree.create(
            'c.ts',
            `import { LogService, BDep } from '@angular/core';

        export class C  {
            constructor(
                private bDep: bDep,
                private logger: LogService
            ) {}
        `
        );

        tree.create(
            'c.spec.ts',
            `
import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: 'someValue', useValue: 'other value' }]
        }).compileComponents();
    }));
});

function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    }
    return builder;
}
        `
        );
    });

    it('when setup function call missing should add a the setup function call with appropriate indendtation', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act

        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        const contents = result.readContent('c.spec.ts');
        // assert
        expect(contents).toContain('        const a = setup().default();\n        TestBed');
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: a.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: a.logger }] })`);
    });

    it('when setup function call existing should use that and add missing dependencies', () => {
        // arrange
        tree.overwrite(
            'c.spec.ts',
            `
import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        const setupInstance = setup().default();
        // does this appear
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: 'someValue', useValue: 'other value' }]
        }).compileComponents();
    }));
});

function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    }
    return builder;
}
        `
        );

        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act

        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        const contents = result.readContent('c.spec.ts');
        // assert
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: setupInstance.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: setupInstance.logger }] })`);
    });

    it('when one of the providers is already provided and the other is not it should add the other provider to configureTestingModule providers', () => {
        // arrange
        tree.overwrite(
            'c.spec.ts',
            `
import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        const a = setup().default();
        // does this appear
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: bDep, useValue: a.bDep }]
        }).compileComponents();
    }));
});

function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    }
    return builder;
}
        `
        );

        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act

        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        const contents = result.readContent('c.spec.ts');
        // assert
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: LogService, useValue: a.logger }] })`
        );
    });

    it('when setup function call existing is destructured it should add a new call to setup and use that for the providers', () => {
        // arrange
        tree.overwrite(
            'c.spec.ts',
            `
import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        const {logger, bDep} = setup().default();
        // does this appear
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: 'someValue', useValue: 'other value' }]
        }).compileComponents();
    }));
});

function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    }
    return builder;
}
        `
        );

        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act

        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        const contents = result.readContent('c.spec.ts');
        // assert
        expect(contents).toContain('const a = setup().default();');
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: a.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: a.logger }] })`);
    });
});
