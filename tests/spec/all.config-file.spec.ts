import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('when config file is missing', () => {
    let emptyTree = Tree.empty();

    it('when malformed should stop', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        return await runner.runSchematicAsync(
            'spec',
            { name: '', config: 'tests/spec/test-data/malformed-config.json' },
            emptyTree
        ).toPromise()
        // assert
        .then(() => fail('config malformed - should throw'))
        .catch(e => {
            expect(e).toBeDefined();
            expect(e.message).toMatch('Looks like the configuration was missing/malformed.');
        })
    });
    it('when missing should stop', async () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        return await runner.runSchematicAsync(
            'spec',
            { name: '', config: './missing-config-file.json' },
            emptyTree
        ).toPromise()
        // assert
        .then(() => fail('it should throw if config missing'))
        .catch(e => {
            expect(e).toBeDefined();
            expect(e.message).toMatch('Looks like the configuration was missing/malformed.');
            expect(e.message).toMatch('no such file or directory,');
        });
    });
});
