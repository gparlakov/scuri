import * as ts from 'typescript';
import { RemoveChange } from '../../lib/utility/change';
import { update } from '../../src/spec/update/update';
import { setupBase } from './common';

const folder = 'spec-update';

describe('Update a spec', () => {
    it('should return a remove list', async () => {
        const result = update(
            './test',
            ts.createSourceFile('./test', `import { autoSpy } from 'autoSpy';
import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
});

function setup() {
    let dep:string;
    const service = autoSpy(Object);
    const builder = {
        dep,
        service,
        default() {
            return builder;
        },
        build() {
            return new ExampleComponent(dep,service);
        }
    };

    return builder;
}`, {languageVersion: 2}, true),
            [],
            'ExampleComponent',
            'remove',
            [],
            'a',
            undefined,
            {framework: 'jasmine'}
        );

        const removes = result.filter((r) => r instanceof RemoveChange);
        // expecting 6 removes
        expect(removes.length).toBe(6);
        // order is the position of the remove
        expect(removes[0].order).toBe(152); // let dep:string;
        expect(removes[1].order).toBe(172); // const service = autoSpy(Object);
        expect(removes[2].order).toBe(231); // dep in builder
        expect(removes[3].order).toBe(244); // service in builder
        expect(removes[4].order).toBe(379); // dep, in ExampleComponent(dep, service)
        expect(removes[5].order).toBe(383); // service in ExampleComponent(dep, service)
    });

    describe('with pre-exising spec (UPDATE)', () => {
        const component = 'to-update.ts';
        it('removes the removed dependencies', async () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents.includes('ToUpdate(stringDependency, service)')).toBe(false);
        });

        it('adds the added dependencies', async () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents.includes('let anotherStr: string;')).toBe(true);
            expect(contents.includes('const anotherService = autoSpy(Service);')).toBe(true);
        });

        it('adds the added dependencies to builder `exports`', async () => {
            // arrange
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);    expect(contents.includes(' anotherStr,')).toBe(true);
            expect(contents.includes(' anotherService,')).toBe(true);
        });

        it('adds the added dependencies to the class-under-test construction', async () => {
            // arrange

            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents).toMatch(/return new ToUpdate\(anotherStr,\s*anotherService\)/);
        });

        it('Errors if the update flag is not passed in', async () => {
            // arrange
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName, `Some other content`);
            // act
            await run({ name: fullFileName })
                .then(() => fail('should throw'))
            // assert
                .catch((e) => expect(e.message).toMatch('A merge conflicted on path'));
        });
    });

    describe('with pre-existing spec (UPDATE Methods)', () => {
        const component = 'to-update-with-methods.ts';
        it('removes the removed dependencies', async () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents.includes('when newMethod is called it should')).toBe(true);
        });

        it('does not add (would duplicate) the existing public method tests', async () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            // splitting by the expected it description  - if there is one such it -
            // then we'll get 2 results otherwise - 1, 3 or more
            expect(contents.split('when oldMethod is called it should').length).toBe(
                2
                //"We expect to see 2 results because when splitting by the expected it description  - if there is one such it method - then we'll get 2 results otherwise - 1, 3 or more"
            );
        });

        it('adds the it at the correct location after the last it', async () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            add(testFileName);
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents).toMatch(
                /it\('when oldMethod is called it should', \(\) => \{(\r\n|\n\r|\n)\s*c\.oldMethod\(\);(\r\n|\n\r|\n)\s*\}\);(\r\n|\n\r|\n)\s*it\('when newMethod is called it should/
            );
        });

        describe('with no it methods', () => {
            const component = 'to-update-without-methods.ts';
            it('adds the it at the correct location after the last describe', async () => {
                const { run, fullFileName, testFileName, add } = setupBase(folder, component)
                add(fullFileName);
                add(testFileName);
                const result = await run({ name: fullFileName, update: true });
                // assert
                const contents = result.readContent(testFileName);
                // splitting by the expected it description  - if there is one such it -
                // then we'll get 2 results otherwise - 1, 3 or more
                expect(contents).toMatch(
                    /describe\('ToUpdate', \(\) => \{(\r\n|\n\r|\n)\s*it\('when method is called it should/
                );
            });

            it('uses the correct shorthand (ToUpdate shorthand t)', async () => {
                const { run, fullFileName, testFileName, add } = setupBase(folder, component);
                add(fullFileName);
                add(testFileName);
                const result = await run({ name: fullFileName, update: true });
                // assert
                const contents = result.readContent(testFileName);
                // splitting by the expected it description  - if there is one such it -
                // then we'll get 2 results otherwise - 1, 3 or more
                expect(contents).toMatch('t.method();');
                expect(contents).toMatch('expect(t).toEqual');
            });
        });

        describe('when there are existing deps in the class-under-test constructor', () => {

            const forComma = 'for-comma.ts'
            it('should add a comma at the start of the deps list', async () => {
                // arrange
                const { run, fullFileName, testFileName, add } = setupBase(folder, forComma);
                add(fullFileName);
                add(testFileName);
                // act
                const result = await run({ name: fullFileName, update: true });
                // assert
                const content = result.readContent(testFileName);
                expect(content).toMatch(/return new T\(a, b\);/);
            });
        });
    });
});
