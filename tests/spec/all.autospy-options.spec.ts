import { setupBase } from './common';

describe('autoSpy options', () => {
    const file = 'test.ts';
    const folder = 'all.autospy-options';

    it('when creating a new spec it should use the autospy options from command line overwriting the option file', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, getFilePath } = setupBase(folder, file);
        add(fullFileName);
        // act
        const result = await run({
            name: fullFileName,
            config: getFilePath('config-autospy.json'),
            autoSpyLocation: '@testing/autospy',
        });
        // assert
        const res = result.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@testing/autospy';`);
    });

    it('when creating a new spec it should use the autospy options from option file', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, getFilePath } = setupBase(folder, file);
        add(fullFileName);
        //act
        const r = await run({ name: fullFileName, config: getFilePath('config-autospy.json') });
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@some/path';`);
    });

    it('when updating a spec it should use the autospy options from command line overwriting the option file', async () => {
        // arrange
        // arrange
        const { run, fullFileName, add, testFileName, getFilePath } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        //act
        const r = await run({
            name: fullFileName,
            update: true,
            config: getFilePath('config-autospy.json'),
            autoSpyLocation: '@testing/autospy',
        });
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@testing/autospy';`);
    });

    it('when updating a spec it should use the autospy options from the option file', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, getFilePath } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        //act
        const r = await run({
            name: fullFileName,
            config: getFilePath('config-autospy.json'),
            update: true,
        });
        // assert
        const res = r.read(testFileName)?.toString();
        expect(res).toMatch(`import { autoSpy } from '@some/path';`);
    });
});
