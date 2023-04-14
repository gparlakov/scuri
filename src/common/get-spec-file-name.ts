import { basename as ngBasename, Path } from '@angular-devkit/core';
import { join, normalize } from 'path';
import { applyPathTemplate, FileEntry, TEMPLATE_FILENAME_RE } from '@angular-devkit/schematics';
import { ClassTemplateData } from '../types';
import { getLogger } from './logger';

export function getSpecFilePathName(name: string) {
    return name.replace('.ts', '.spec.ts');
}

export function getSpecFileCustomName(
    classData: Omit<ClassTemplateData, 'levenshtein' | 'params' | 'publicMethods' | 'setupMethods'>,
    templateName: string
): string | undefined {
    const l = getLogger(getSpecFileCustomName.name)
    l.debug(`entering for classData ${JSON.stringify(classData)} templateName ${templateName}`)
    const templateFile: FileEntry = {
        // it's all right to lie to FileEntry as it only uses it to get the file name and not the folder
        // folder is added with folderfy below
        path: ngBasename(<Path><unknown>templateName),
        content: Buffer.from(''),
    };

    const fileResult = applyPathTemplate(classData)(templateFile);

    l.debug(`looking for templateFile ${templateFile.path} result in ${fileResult}`)

    const folderfyFn = folderfy(classData.folder);

    const result = typeof fileResult?.path === 'string'
        ? folderfyFn(
              fileResult.path
                  // remove template if any
                  .replace(TEMPLATE_FILENAME_RE, '')
          )
        : undefined;

    l.debug(`returning ${result}`);
    return result;
}

function folderfy(folder: string) {
    return (fileName: string) => {
        return join(
            normalize(folder),
            fileName
                // remove the path as a possible duplicate
                .replace(folder, '')
        );
    };
}
