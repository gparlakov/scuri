import { LogEntry } from '@angular-devkit/core/src/logger';
import { Tree } from '@angular-devkit/schematics';
import { filter } from 'rxjs/operators';
import { setupBase } from './common';

const folder = 'only-add-missing-method-test-cases';
const file = 'c.ts';

describe('Calling update', () => {
    let tree = Tree.empty();

    beforeEach(() => {
        tree = Tree.empty();
    });

    it('should work and not throw errors', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName)
        // act
        await run({ name: fullFileName, update: false });
        // act
        const errors: LogEntry[] = [];
        letLogger(logger => logger.pipe(filter((v) => v.level === 'error')).subscribe((v) => errors.push(v)));
        await run({ name: './c.spec.ts', update: true }).catch(e => {
            fail('Failing the test on purpose: There should not be any errors thrown here. ')
        });
        // assert
        expect(errors.length).toBe(0);
    });

    it('should update the spec file', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName)
        // act
        const result = await run({ name: fullFileName, update: false });
        const contents = result.readContent(testFileName);
        // assert
        expect(contents).toEqual(`import { bDep } from '@angular/core';

describe('C', () => {
    it('existing method one test', () => {
        c.methodOne();
    })
    it('existing test case with name of methodTwo in the spec title', () => {
        c.methodTwo();
    })
    it('just any name', () => {
        c.methodThree();
    })
});
function setup() {
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new C();
        }
    }
    return builder;
}`);
    });
});
