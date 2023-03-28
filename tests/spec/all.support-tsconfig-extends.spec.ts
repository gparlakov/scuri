import { getTestFile, setupBase } from './common';

describe('spec', () => {
    it('support tsconfig extends', async () => {
        // arrange

        const { add, run, testFileName, testFilesFolder, splitLines } = setupBase(
            'all.support-tsconfig-extends',
            'app/component.ts'
        )
        .default();

        add(getTestFile(`${testFilesFolder}/app/tsconfig.json`));
        add(getTestFile(`${testFilesFolder}/tsconfig.base.json`));
        add(getTestFile(`${testFilesFolder}/lib/index.ts`));

        // act
        const result = await run();
        // assert
        const spec = result.readContent(testFileName);
        const lines = splitLines(spec);

        let i = lines.findIndex(l => l.includes('function setup'));
        expect(lines[++i]).toMatch('  ');
        expect(lines[++i]).toMatch('    const dep = autoSpy(Dep);\r');
        expect(lines[++i]).toMatch('    ');
        expect(lines[++i]).toMatch('  const builder = {');
        expect(lines[++i]).toMatch('    dep,');
        expect(lines[++i]).toMatch('    withDepProperty(p: string) {');
        expect(lines[++i]).toMatch('        dep.property = p;');
        expect(lines[++i]).toMatch('        return builder;');
        expect(lines[++i]).toMatch('    },');
        expect(lines[++i]).toMatch('    withDepMethodReturn(m: string) {');
        expect(lines[++i]).toMatch('        dep.method.and.returnValue(m);');
        expect(lines[++i]).toMatch('        return builder;');
        expect(lines[++i]).toMatch('    },');
        expect(lines[++i]).toMatch('    default() {');
        expect(lines[++i]).toMatch('      return builder;');
        expect(lines[++i]).toMatch('    },');
        expect(lines[++i]).toMatch('    build() {');
        expect(lines[++i]).toMatch('      return new Component(dep);');
        expect(lines[++i]).toMatch('    }');
        expect(lines[++i]).toMatch('  };');
        expect(lines[++i]).toMatch('');
        expect(lines[++i]).toMatch('  return builder;');
        expect(lines[++i]).toMatch('}');
    });
});
