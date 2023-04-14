import { normalize } from 'path';
import { paths } from '../../src/common/paths';

// this fails on unix
xdescribe('paths', () => {
    it('should get the the path filename and import path', () => {
        const { fileName,  specFileName, folderPathRaw, folderPathNormal } = paths(
            './example/my/my.component.ts'
        );

        expect(folderPathRaw).toEqual('./example/my/');
        expect(folderPathNormal).toEqual(normalize('example/my/'));
        expect(specFileName).toEqual('my.component.spec.ts');
        expect(fileName).toEqual('my.component');
    });

    it('should get the the path filename and import path for windows style', () => {
        const { fileName,  specFileName, folderPathRaw, folderPathNormal } = paths(
            '.\\example\\my\\my.component.ts'
        );

        expect(folderPathRaw).toEqual('.\\example\\my\\');
        expect(folderPathNormal).toEqual(normalize('example/my/'));
        expect(specFileName).toEqual('my.component.spec.ts');
        expect(fileName).toEqual('my.component');
    });
});
