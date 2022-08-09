import { describeSource } from '../../src/common/read/read';
import { ClassDescription } from '../../src/types';
import { depsCallsReturnTypesFile, depsCallsReturnTypesFileContents } from './common';

describe('Dependency method calls ', () => {
    it('should read the names and return types of dependency methods', async () => {
        const fileName = depsCallsReturnTypesFile;
        // arrange
        const x = describeSource(fileName, depsCallsReturnTypesFileContents());
        // act
        const classDescription: ClassDescription = x[0] as ClassDescription;

        // assert
        expect(classDescription.depsCallsAndTypes).toBeDefined();

        const returnTypes = classDescription.depsCallsAndTypes;
        expect(returnTypes).toEqual(
            new Map([
                [
                    'ServiceWithMethods',
                    new Map([
                        ['justAMethod', 'ClassDescription'],
                        ['observableReturning', 'Observable<string>'],
                        ['promiseReturning', 'Promise<string>'],
                    ]),
                ],
            ])
        );
    });
});
