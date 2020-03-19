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

    it('creates one file at given path - auto-spy.ts', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', { path: './folder/' }, tree);
        expect(res.files.length).toBe(1);
        expect(res.files[0]).toEqual('/folder/auto-spy.ts');
    });

    it('creates jasmine-style auto-spy by default', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', {}, tree);
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jasmine.Spy');
        expect(generatedContent).not.toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
    });

    it('creates jasmine-style auto-spy when user opted for jasmine', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', { for: 'jasmine' }, tree);
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jasmine.Spy');
        expect(generatedContent).not.toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
    });

    it('creates jest-style auto-spy when user opted for jest', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = runner.runSchematic('autospy', { for: 'jest' }, tree);
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
        expect(generatedContent).not.toMatch('jasmine.Spy');
    });

    describe('with --legacy flag', () => {
        it('creates jasmine-style auto-spy by default without using conditional types', () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = runner.runSchematic('autospy', { legacy: true }, tree);
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('jest.fn');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });

        it('creates jasmine-style auto-spy with `--for jasmine` without using conditional types', () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = runner.runSchematic('autospy', { for: 'jasmine', legacy: true }, tree);
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('jest.fn');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });

        it('creates jest-style auto-spy with `--for jest` without using conditional types', () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = runner.runSchematic('autospy', { for: 'jest', legacy: true }, tree);
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jest.fn');
            expect(generatedContent).not.toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });
    });
});
