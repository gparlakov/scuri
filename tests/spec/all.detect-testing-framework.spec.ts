import { setupBase } from './common';

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
            .add('jest.config.mjs', '');
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
    const testFilesFolder = 'all.detect-testing-framework';
    const defaultFileName = 'component.ts';
    return setupBase(testFilesFolder, defaultFileName)
}
