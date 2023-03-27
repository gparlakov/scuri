import { normalize, basename, extname } from 'path';
import { getLogger } from './logger';
import { normalize as ngNormalize } from '@angular-devkit/core';

/**
 * Holds the folder, fileName and specFileName:
 *
 * @example for `./my/example/example.component.ts`
 * {
 *  folderPathRaw: './my/example/',
 *  folderPath: './my/example/,
 *  fileName: 'example.component.ts'
 *  specFileName: 'example.component.spec.ts'
 * }
 *
 * @example for `.\my\example\example.component.ts`
 * {
 *  folderPathRaw: '.\my\example\',,
 *  folderPath: './my/example/,
 *  testTarge
 *  fileName: 'example.component.ts',
 *  specFileName: 'example.component.spec.ts',
 * }
 *
 */
export type Paths = {
    /**
     * The file name path excluded
     * @example
     * --name = ./example/example.component.ts -> `example.component.spec.ts`
     */
    specFileName: string;

    /**
     * Import path with normalized slashes (/ and \ according to local OS)
     * @example
     * --name = ./example/example.component.ts -> `example.component` (notice the lack of extension)
     */
    fileName: string;

    /**
     * The folder containing the target under test, verbatim as the user specified.
     *
     * @example
     * --name = ./example/example.component.ts -> ./example/example.component
     *
     * @example
     * --name = .\example\example.component.ts -> .\example\example.component
     */
    folderPathRaw: string;
    /**
     * The folder containing the target under test, normalized to forward slash path.
     *
     * @example
     * --name = .\example\example.component.ts -> ./example/example.component
     *
     */
    folderPathNormal: string;
};

export function paths(name: string): Paths {
    const logger = getLogger(paths.name);
    logger.debug(`entering for ${name}`);
    // --name=./example/example.component.ts -> example.component.ts
    const fileName = basename(normalize(name));

    // normalize the / and \ according to local OS
    // --name = ./example/example.component.ts -> ./example/example.component and the ext name -> .ts
    // for import { ExampleComponent } from "./example/example.component"
    const fileNameSansExtension = fileName.slice(0, fileName.length - extname(fileName).length);

    // the new spec file name
    const specFileName = `${fileNameSansExtension}.spec.ts`;

    // the folder verbatim as the user specified
    const folderPathRaw = name.split(fileName)[0]; // split on the filename - so we get only an array of one item

    const folderPathNormal = ngNormalize(folderPathRaw);
    const r = {
        specFileName,
        fileName: fileNameSansExtension,
        folderPathRaw,
        folderPathNormal,
    };

    logger.debug(`returning ${JSON.stringify(r)}`)
    return r;
}
