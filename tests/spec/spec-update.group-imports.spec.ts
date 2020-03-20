import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { filter } from 'rxjs/operators';
import { collectionPath } from './common';

describe('Calling update on existing specs without setup function', () => {
    let tree = Tree.empty();

    beforeEach(() => {
        tree = Tree.empty();
        tree.create(
            'c.ts',
            `import { MyDep } from '@angular/Common';
import { LibraryClass, LibraryClass1 } from '../shared/library';
import { LogService, BDep, CDep } from '@angular/core';

export class C  {
    constructor(
        private aDep: BDep,
        private bDep: BDep,
        private cDep: BDep,
        private dDep: CDep,
        private eDep: MyDep,
        private fDep: LibraryClass,
        private gDep: LibraryClass1,
        private logger: LogService
    ) {}
}`
        );

        tree.create(
            'c.spec.ts',
            `import { BDep, LogService } from '@angular/core';
import { other } from 'other';
import { some } from '..\\util';

describe('C', () => {
});`
        );
    });

    it('should pass successfully', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const errors = [];
        runner.logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v));
        runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        // assert
        expect(errors.length).toBe(0);
    });

    it('should import only missing deps and not duplicate deps (BDep is used multiple times), ', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        // assert
        // @ts-ignore
        const contents = result.readContent('./c.spec.ts');
        expect(contents).toMatchInlineSnapshot(`
            "import { BDep, LogService, CDep } from '@angular/core';
            import { other } from 'other';
            import { some } from '..\\\\util';
            import { MyDep } from '@angular/Common';
            import { LibraryClass } from '../shared/library';
            import { LibraryClass1 } from '../shared/library';

            describe('C', () => {
            });
            function setup() {
                const aDep = autoSpy(BDep);
                const bDep = autoSpy(BDep);
                const cDep = autoSpy(BDep);
                const dDep = autoSpy(CDep);
                const eDep = autoSpy(MyDep);
                const fDep = autoSpy(LibraryClass);
                const gDep = autoSpy(LibraryClass1);
                const logger = autoSpy(LogService);
                const builder = {
                    aDep,
                    bDep,
                    cDep,
                    dDep,
                    eDep,
                    fDep,
                    gDep,
                    logger,
                    default() {
                        return builder;
                    },
                    build() {
                        return new C(aDep, bDep, cDep, dDep, eDep, fDep, gDep, logger);
                    }
                }
                return builder;
            }"
        `);
    });

    it('should not import deps with no path i.e. from dom or other tslibs, Object, Event', () => {
        // arrange
        const t = Tree.empty();
        t.create(
            'c.ts',
            `export class C  {
    constructor(
        private aDep: Event,
        private bDep: Object,
        private cDep: Window,
    ) {}
}`
        );

        t.create(
            'c.spec.ts',
            `describe('C', () => {
});`
        );
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, t);
        // assert
        // @ts-ignore
        const contents = result.readContent('./c.spec.ts');
        expect(contents).toMatchInlineSnapshot(`
            "describe('C', () => {
            });
            function setup() {
                const aDep = autoSpy(Event);
                let bDep: Object;
                const cDep = autoSpy(Window);
                const builder = {
                    aDep,
                    bDep,
                    cDep,
                    default() {
                        return builder;
                    },
                    build() {
                        return new C(aDep, bDep, cDep);
                    }
                }
                return builder;
            }"
        `);
    });
});
