import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Options } from '../../src/update-custom/index';
import { listenLogger, subscribe } from '../get-logger-errors';

const collectionPath = path.join(__dirname, '../../src/collection.json');

describe('update-custom', () => {
    let tree: Tree;
    const name = 'example.ts';
    const classTemplate = 'result.ts.template';

    beforeEach(() => {
        tree = Tree.empty();
    });

    it('should signal missing file when the provide file name by the `--name` is missing', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger), 1);
        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate }, tree)
            .toPromise();

        expect(logs).toEqual(['Looks like the file example.ts is missing or invalid.']);
    });

    it('should signal missing template when the provide file name by the `--className` is missing and the file is present', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger), 1);
        tree.create(name, 'My spec file');
        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate }, tree)
            .toPromise();

        expect(logs).toEqual(['Looks like the file result.ts.template is missing or invalid.']);
    });

    it('should signal no class when its missing from the file when the provide file name by the `--name`', async () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const logs = subscribe(listenLogger(runner.logger), 1);
        tree.create(name, 'My spec file');
        tree.create(classTemplate, 'my template');
        await runner
            .runSchematicAsync('update-custom', <Options>{ name, classTemplate }, tree)
            .toPromise();

        expect(logs).toEqual(['Looks like there was no class in example.ts']);
    });
});

