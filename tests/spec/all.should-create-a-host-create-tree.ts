import { normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { ScopedHost } from '@angular-devkit/core/src/virtual-fs/host';
import { HostCreateTree, Tree } from '@angular-devkit/schematics';
import { getTestFile } from './common';

// this is more of a reminder than an actual test
describe('HostCreateTree works', () => {
    const root = normalize(getTestFile(''));
    let tree: Tree;
    beforeEach(() => {
        tree = new HostCreateTree(new ScopedHost(new NodeJsSyncHost(), root));

        tree.create('empty-class.ts', 'export class EmptyClass {}');
    });

    it('has one file', () => {
        const files: string[] = [];
        tree.visit(f => files.push(f));
        expect(files.includes('all.detect-testing-framework/component.ts'))
    });
});
