import { basename, join, normalize } from '@angular-devkit/core';
import { applyPathTemplate, FileEntry, TEMPLATE_FILENAME_RE } from '@angular-devkit/schematics';
import { ClassTemplateData } from '../types';

export function getSpecFilePathName(name: string) {
    return name.replace('.ts', '.spec.ts');
    // const normalizedName = normalize(name);
    // const ext = extname(basename(normalizedName));

    // return name.split(ext)[0] + '.spec' + ext;
}

export function getSpecFileCustomName(
    classData: Omit<ClassTemplateData, 'levenshtein' | 'params' | 'publicMethods' | 'setupMethods'>,
    templateName: string
): string | undefined {
    const templateFile: FileEntry = {
        path: basename(normalize(templateName)),
        content: Buffer.from(''),
    };

    const fileResult = applyPathTemplate(classData)(templateFile);

    const folderfyFn = folderfy(classData.folder);

    return typeof fileResult?.path === 'string'
        ? folderfyFn(
              fileResult.path
                  // remove template if any
                  .replace(TEMPLATE_FILENAME_RE, '')
          )
        : undefined;
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
