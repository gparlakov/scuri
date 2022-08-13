import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from '../spec/common';

describe('spec', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = Tree.empty();
    });

    it('creates one file - auto-spy.ts', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = await runner.runSchematicAsync('autospy', {}, tree).toPromise();
        expect(res.files.length).toBe(1);
        expect(res.files[0]).toEqual('/auto-spy.ts');
    });

    it('creates one file at given path - auto-spy.ts', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = await runner.runSchematicAsync('autospy', { path: './folder/' }, tree).toPromise();
        expect(res.files.length).toBe(1);
        expect(res.files[0]).toEqual('/folder/auto-spy.ts');
    });

    it('creates jasmine-style auto-spy by default', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = await runner.runSchematicAsync('autospy', {}, tree).toPromise();
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jasmine.Spy');
        expect(generatedContent).not.toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
    });

    it('creates jasmine-style auto-spy when user opted for jasmine', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = await runner.runSchematicAsync('autospy', { for: 'jasmine' }, tree).toPromise();
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jasmine.Spy');
        expect(generatedContent).not.toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
    });

    it('creates jest-style auto-spy when user opted for jest', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const res = await runner.runSchematicAsync('autospy', { for: 'jest' }, tree).toPromise();
        const generatedContent = res.readContent('/auto-spy.ts');
        expect(generatedContent).toMatch('jest.fn');
        expect(generatedContent).toMatch('export function autoSpy');
        expect(generatedContent).not.toMatch('jasmine.Spy');
    });

    describe('with --legacy flag', () => {
        it('creates jasmine-style auto-spy by default without using conditional types', async  () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = await runner.runSchematicAsync('autospy', { legacy: true }, tree).toPromise();
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('jest.fn');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });

        it('creates jasmine-style auto-spy with `--for jasmine` without using conditional types', async  () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = await runner.runSchematicAsync('autospy', { for: 'jasmine', legacy: true }, tree).toPromise();
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('jest.fn');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });

        it('creates jest-style auto-spy with `--for jest` without using conditional types', async  () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const res = await runner.runSchematicAsync('autospy', { for: 'jest', legacy: true }, tree).toPromise();
            const generatedContent = res.readContent('/auto-spy.ts');
            expect(generatedContent).toMatch('jest.fn');
            expect(generatedContent).not.toMatch('jasmine.Spy');
            expect(generatedContent).not.toMatch('T[k] extends');
            expect(generatedContent).toMatch('export function autoSpy');
        });
    });
});
