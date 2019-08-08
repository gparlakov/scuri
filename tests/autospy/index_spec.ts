import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../src/collection.json');

describe('spec', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = Tree.empty();
    });

    it('creates one file - auto-spy.ts', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', {}, tree);
        expect(res.files.length).toBe(1);
        expect(res.files[0]).toEqual('/auto-spy.ts');
    });

    it('creates jasmine-style auto-spy', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', {}, tree);
        expect(res.readContent('/auto-spy.ts')).toMatch('jasmine.Spy');
        expect(res.readContent('/auto-spy.ts')).not.toMatch('jest.fn');
    });

    it('creates jasmine-style auto-spy', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', { for: 'jasmine' }, tree);
        expect(res.readContent('/auto-spy.ts')).toMatch('jasmine.Spy');
        expect(res.readContent('/auto-spy.ts')).not.toMatch('jest.fn');
    });

    it('creates jest-style auto-spy when jest', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', { for: 'jest' }, tree);
        expect(res.readContent('/auto-spy.ts')).toMatch('jest.fn');
        expect(res.readContent('/auto-spy.ts')).not.toMatch('jasmine.Spy');
    });
});
