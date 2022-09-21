import { normalize, strings } from '@angular-devkit/core';
import {
    applyContentTemplate,
    FileEntry,
    Rule,
    SchematicContext,
    Tree
} from '@angular-devkit/schematics';
import { EOL } from 'os';
import { getSpecFileCustomName } from '../common/get-spec-file-name';
import { paths } from '../common/paths';
import { describeSource } from '../common/read/read';
import { scuriTemplateMark, updateCustomTemplateCut } from '../common/scuri-custom-update-template';
import { ClassTemplateData, Description, isClassDescription } from '../types';

export type Options = {
    name: string;
    classTemplate: string;
};

export function updateCustom(o: Options): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const template = tree.read(o.classTemplate)?.toString('utf8');
        const fileUnderTestContent = tree.read(o.name)?.toString('utf8');

        if (typeof fileUnderTestContent === 'string' && typeof template === 'string') {
            const r = describeSource(o.name, fileUnderTestContent);
            const topClass = Array.isArray(r) ? r[0] : <Description>{};
            if (isClassDescription(topClass)) {
                const { constructorParams, publicMethods } = topClass;
                const {
                    specFileName,
                    fileName: normalizedName,
                    folderPathNormal: folder
                } = paths(o.name);

                const classData: ClassTemplateData = {
                    ...strings,
                    className: topClass.name,
                    name: topClass.name,
                    specFileName,
                    normalizedName: normalizedName,
                    folder,
                    constructorParams: 'not available for update - please use `params`',
                    declaration:
                        'not available for update - specific for scuri original style testing',
                    builderExports:
                        'not available for update - builder is specific for scuri original style testing - the setup function with a builder',
                    params: constructorParams,
                    publicMethods: publicMethods,
                    shorthand: (normalizedName ?? '')[0].toLowerCase(),
                }

                const customSpecFileName = getSpecFileCustomName(classData, o.classTemplate);
                const customSpecFileContents = customSpecFileName != null ? tree.read(customSpecFileName) : null;
                if (customSpecFileContents != null) {
                    const inserts = updateWithCustomTemplate(
                        {
                            ...classData,
                            specFileContents: customSpecFileContents.toString(
                                'utf8'
                            ),
                            templateContents: template,
                        },
                        context
                    );

                    const recorder = tree.beginUpdate(customSpecFileName!);
                    inserts.forEach((a) => {
                        recorder.insertLeft(a.position, a.content);
                    });
                    tree.commitUpdate(recorder);

                } else {
                    context.logger.error(`Looks like the custom spec file ${customSpecFileName} does not exist. Try creating the file before updating it.`)
                }
            } else {
                context.logger.error(`Looks like there was no class in ${o.name}`);
            }
        } else {
            if (typeof fileUnderTestContent !== 'string') {
                context.logger.error(`Looks like the file ${o?.name} is missing or invalid.`);
            }
            if (typeof template !== 'string') {
                context.logger.error(`Looks like the file ${o?.classTemplate} is missing or invalid.`);
            }
        }
        return tree;
    };
}

const skip = '-skipDeDupe';
// todo - check for each error condition and report
export function updateWithCustomTemplate(
    templateData: ClassTemplateData & { templateContents: string; specFileContents: string },
    context: SchematicContext
): { position: number; content: string }[] {
    const [_, parts] = updateCustomTemplateCut(templateData.templateContents);
    context.logger.debug(`Cut the template to parts ${JSON.stringify(parts)}`);
    if(parts == null || parts.length === 0) {
        throw new Error(`The custom template seems to be missing the ${scuriTemplateMark} mark. Perhaps you need the standard update?`)
    }
    
    const originalMethods = templateData.publicMethods;
    // skip methods that already have tests
    templateData.publicMethods = originalMethods.filter(
        (pm) => !templateData.specFileContents.includes(pm)
    );

    if (templateData.publicMethods.length !== originalMethods.length) {
        context.logger.debug(
            `Skipping methods: [${originalMethods
                .filter((m) => !templateData.publicMethods.includes(m))
                .join(',')}] as they seem to be already in the spec.`
        );
    }

    // curry (e.g. prepare) the template fn with the context (templateData)
    const templateFn = applyContentTemplate(templateData);

    return parts
        .map((p) => {
            const mark = `// scuri:${p.mark.replace(new RegExp(skip, 'i'), '')}`.toLowerCase();
            const template: FileEntry = {
                path: normalize('.'),
                content: Buffer.from(p.template),
            };
            const templateResult = templateFn(template)?.content.toString('utf8') ?? '';

            if (templateResult === '') {
                context.logger.debug(`No result from applying template for ${p.mark}.`);
            } else {
                context.logger.debug(`Template result before de-duplication: [${templateResult}]`);
            }
            
            const spaces = getWhitespaceBefore(templateData.specFileContents, mark);
            // skip de-duplication for the whole section (mark)
            const skipDeDupe = p.mark.toLowerCase().includes(skip.toLowerCase());
            const deDupedContent = templateResult
                .split(/\r\n|\r|\n/g)
                // remove lines of code that are already in the spec
                .filter((c) => skipDeDupe || !templateData.specFileContents.includes(c))
                .join(`${EOL}${spaces}`);

            const position = templateData.specFileContents.toLowerCase().indexOf(mark);
            context.logger.debug(`Mark ${mark} (original ${p.mark}) found at position(${position})`)
            // add the space at the end
            return { position, content: `${deDupedContent}${EOL}${spaces}` };
        })
        .filter((a) => !templateData.specFileContents.includes(a.content));
}
function getWhitespaceBefore(content: string, mark: string) {
    const spacesOrEmpty = content.match(new RegExp(`^.*${mark}`, 'gm')) ?? [''];
    return spacesOrEmpty[0].replace(mark, '');
}
