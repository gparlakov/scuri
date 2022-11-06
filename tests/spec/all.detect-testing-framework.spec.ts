import { LogEntry } from '@angular-devkit/core/src/logger';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { filter } from 'rxjs/operators';
import { collectionPath, getTestFile, getTestFileContents } from './common';
import { getSpecFilePathName } from '../../src/common/get-spec-file-name';

describe('Framework test runner config', () => {
    it('should detect jasmine when karma.conf.js present', async () => {
        // arrange
        const { run, testFileName } = setup().default().add('karma.conf.js', '');
        // act
        const result = await run();
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.and.returnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.and.returnValue(o);');
    });

    it('should detect jasmine when jasmine-core in package.json', async () => {
        // arrange
        const { run, testFileName } = setup()
            .default()
            .add('package.json', '{"deps": {"jasmine-core":"13.non-existent-version"}}');
        // act
        const result = await run();
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.and.returnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.and.returnValue(o);');
    });

    it('should detect jasmine when karma.conf even if multiple package.json-s in node_modules have jest in them', async () => {
        // arrange
        const { run, testFileName } = setup()
            .default()
            .add('karma.conf.js', '')
            .add('node_modules/package1/package.json', '{"deps": {"jest":"13.non-existent-version"}}')
            .add('node_modules/package2/package.json', '{"deps": {"jest":"13.non-existent-version"}}')
            .add('node_modules/package3/package.json', '{"deps": {"jest":"13.non-existent-version"}}')
            ;
        // act
        const result = await run();
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.and.returnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.and.returnValue(o);');
    });


    it('should use jasmine whn passed on the cli even if jest.config present', async () => {
        // arrange
        const { run, testFileName } = setup().default().add('jest.config.js', '');
        // act
        const result = await run({ framework: 'jasmine' });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.and.returnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.and.returnValue(o);');
    });

    it('should detect jest when jest.config present', async () => {
        // arrange
        const { run, testFileName } = setup()
            .default()
            .add('jest.config.mjs', '')
            .log({ filter: 'determine----' });
        // act
        const result = await run();
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.mockReturnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.mockReturnValue(o);');
    });

    it('should detect jest when jest in package.json', async () => {
        // arrange
        const { run, testFileName } = setup()
            .default()
            .add('package.json', '{"deps": {"jest":"13.non-existent-version"}}');
        // act
        const result = await run();
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.mockReturnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.mockReturnValue(o);');
    });

    it('should use jest when passed in the cli args even if karma.conf present', async () => {
        // arrange
        const { run, testFileName } = setup()
            .default()
            .add('karma.conf', '{"deps": {"jest":"13.non-existent-version"}}');
        // act
        const result = await run({ framework: 'jest' });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch('service.observableReturning.mockReturnValue(EMPTY);');
        expect(contents).toMatch('service.observableReturning.mockReturnValue(o);');
    });
});

function setup() {
    const tree = Tree.empty();
    const testFilesFolder = 'all.detect-testing-framework';
    const defaultFileName = getTestFile(`${testFilesFolder}/component.ts`);
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const builder = {
        testFilesFolder,
        defaultFileName,
        testFileName: getSpecFilePathName(defaultFileName),
        tree,
        runner,
        log(o?: { map?: (l: LogEntry) => unknown; filter?: string | ((l: LogEntry) => boolean) }) {
            const mapFn = typeof o?.map === 'function' ? o.map : (m: LogEntry) => m;
            const filterFn =
                typeof o?.filter === 'function'
                    ? o.filter
                    : typeof o?.filter === 'string'
                    ? (m: LogEntry) =>
                          m.name.includes(o.filter as string) ||
                          m.message.includes(o.filter as string)
                    : () => true;

            const c = console; // hide from tslint
            runner.logger.pipe(filter((f) => filterFn(f))).subscribe((l) => c.log(mapFn(l)));

            return builder;
        },
        add(name: string, contents: string) {
            tree.create(name, contents);
            return builder;
        },
        default() {
            return builder.add(defaultFileName, getTestFileContents(defaultFileName));
        },
        build() {
            return tree;
        },
        async run(o?: { framework?: string }) {
            return runner
                .runSchematicAsync('spec', { ...o, name: defaultFileName }, tree)
                .toPromise();
        },
    };

    return builder;
}
