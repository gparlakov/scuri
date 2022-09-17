import { basename, normalize, strings } from '@angular-devkit/core';
import { Logger } from '@angular-devkit/core/src/logger';
import {
    apply,
    applyTemplates,
    MergeStrategy,
    mergeWith,
    move,
    Rule,
    schematic,
    SchematicContext,
    Source,
    source,
    Tree,
    url,
} from '@angular-devkit/schematics';
import { cosmiconfigSync } from 'cosmiconfig';
import { EOL } from 'os';
import { resolve } from 'path';
import { Change, InsertChange, RemoveChange } from '../../lib/utility/change';
import { addDefaultObservableAndPromiseToSpyJoined } from '../common/add-observable-promise-stubs';
import { getSpecFilePathName } from '../common/get-spec-file-name';
import { paths } from '../common/paths';
import { describeSource } from '../common/read/read';
import { updateCustomTemplateCut } from '../common/scuri-custom-update-template';
import {
    ClassDescription,
    FunctionDescription,
    isClassDescription,
    ClassTemplateData
} from '../types';
import { addMissing, update as doUpdate } from './update/update';
class SpecOptions {
    name: string;
    update?: boolean;
    classTemplate?: string;
    functionTemplate?: string;
    config?: string;
}

type Config = Omit<SpecOptions, 'name' | 'update' | 'config'>;

export function spec({ name, update, classTemplate, functionTemplate, config }: SpecOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const logger = context.logger.createChild('scuri.index');
        logger.debug(
            `Params: name: ${name} update: ${update} classTemplate: ${classTemplate} config: ${config}`
        );
        let c: Config = {};
        try {
            const res = config
                ? cosmiconfigSync('scuri').load(config)
                : cosmiconfigSync('scuri').search();
            c = res?.config ?? {};
        } catch (e) {
            //  the config file is apparently missing/malformed (as per https://www.npmjs.com/package/cosmiconfig#explorersearch)
            logger.debug(e?.stack);
            throw new Error(`Looks like the configuration was missing/malformed. ${e?.message}`);
        }

        classTemplate = classTemplate ?? c.classTemplate;
        if (typeof classTemplate === 'string' && !tree.exists(classTemplate)) {
            throw new Error(
                `Class template configuration was [${resolve(
                    classTemplate
                )}] but that file seems to be missing.`
            );
        }

        functionTemplate = functionTemplate ?? c.functionTemplate;
        if (typeof functionTemplate === 'string' && !tree.exists(functionTemplate)) {
            throw new Error(
                `Function template configuration was [${resolve(
                    functionTemplate
                )}] but that file seems to be missing.`
            );
        }
        try {
            if (update) {
                if (classTemplate) {
                    return schematic('update-custom', { name, classTemplate });
                }
                return updateExistingSpec(name, tree, logger);
            } else {
                return createNewSpec(name, tree, logger, { classTemplate, functionTemplate });
            }
        } catch (e) {
            e = e || {};
            logger.error(e.message || 'An error occurred');
            logger.debug(
                `---Error--- ${EOL}${e.message || 'Empty error message'} ${e.stack || 'Empty stack.'
                }`
            );
        }
    };
}
function sliceSpecFromFileName(path: string) {
    if (path.includes('.spec')) {
        return path.replace('.spec', '');
    } else {
        return path;
    }
}

function updateExistingSpec(fullName: string, tree: Tree, logger: Logger) {
    const specFileName = sliceSpecFromFileName(fullName);
    const content = tree.read(specFileName);
    if (content == null) {
        logger.error(`The file ${specFileName} is missing or empty.`);
    } else {
        // the new spec full file name contents - null if file not exist
        const existingSpecFile = tree.get(getSpecFilePathName(specFileName));
        if (existingSpecFile == null) {
            logger.error(
                `Can not update spec (for ${specFileName}) since it does not exist. Try running without the --update flag.`
            );
        } else {
            const specFilePath = existingSpecFile.path;
            // if a spec exists we'll try to update it
            const { params, name, publicMethods, depsCallsAndTypes } = getFirstClass(specFileName, content);
            const shorthand = typeShorthand(name);
            logger.debug(`Class name ${name} ${EOL}Constructor(${params}) {${publicMethods}}`);

            // start by adding missing things (like the setup function)
            const addMissingChanges = addMissing(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                name
            );
            applyChanges(tree, specFilePath, addMissingChanges, 'add');

            // then on the resulting tree - remove unneeded deps
            const removeChanges = doUpdate(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                name,
                'remove',
                publicMethods,
                shorthand,
                depsCallsAndTypes
            );
            applyChanges(tree, specFilePath, removeChanges, 'remove');

            // then add what needs to be added (new deps in the instantiation, 'it' for new methods, etc.)
            const changesToAdd = doUpdate(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                name,
                'add',
                publicMethods,
                shorthand,
                depsCallsAndTypes
            );
            applyChanges(tree, specFilePath, changesToAdd, 'add');

            return tree;
        }
    }
}

function applyChanges(tree: Tree, specFilePath: string, changes: Change[], act: 'add' | 'remove') {
    const recorder = tree.beginUpdate(specFilePath);

    if (act === 'add') {
        changes
            .filter((c) => c instanceof InsertChange)
            .forEach((change: InsertChange) => {
                recorder.insertLeft(change.order, change.toAdd);
            });
    } else {
        changes
            .filter((c) => c instanceof RemoveChange)
            .forEach((change: RemoveChange) => {
                recorder.remove(change.order, change.toRemove.length);
            });
    }

    tree.commitUpdate(recorder);
}

function createNewSpec(
    fileNameRaw: string,
    tree: Tree,
    logger: Logger,
    o?: { classTemplate?: string; functionTemplate?: string }
) {
    const content = tree.read(fileNameRaw);

    if (content == null) {
        logger.error(`The file ${fileNameRaw} is missing or empty.`);
    } else {
        // we aim at creating a spec from the class/function under test (name)
        // for the spec name we'll need to parse the base file name and its extension and calculate the path

        const {
            specFileName,
            fileName,
            folderPathRaw: path,
            folderPathNormal: folder,
        } = paths(fileNameRaw);
        try {
            const { params, name, publicMethods, depsCallsAndTypes } = getFirstClass(fileNameRaw, content);

            // if there are no methods in the class - let's add one test case anyway
            if (Array.isArray(publicMethods) && publicMethods.length === 0) {
                publicMethods.push('');
            }

            const templateVariables: ClassTemplateData = {
                ...strings,
                // the name of the new spec file
                specFileName,
                normalizedName: fileName,
                name,
                className: name,
                folder,
                publicMethods,
                params,
                declaration: toDeclaration(),
                builderExports: toBuilderExports(),
                constructorParams: toConstructorParams(),
                shorthand: typeShorthand(name)
            };
            const src = maybeUseCustomTemplate(tree, url('./files/class'), o?.classTemplate);

            const templateSource = apply(src, [applyTemplates(templateVariables), move(path)]);

            return mergeWith(templateSource, MergeStrategy.Overwrite);

            /**
             * End of the create function
             * Below are the in-scope functions
             */

            // functions defined in the scope of the else to use params and such
            // for getting called in the template - todo - just call the functions and get the result
            function toConstructorParams() {
                return params.map((p) => p.name).join(',');
            }
            function toDeclaration() {
                return params
                    .map((p) =>
                        p.type === 'string' || p.type === 'number'
                            ? `let ${p.name}:${p.type};`
                            : `const ${p.name} = autoSpy(${p.type});${addDefaultObservableAndPromiseToSpyJoined(p, depsCallsAndTypes, { joiner: EOL, spyReturnType: 'jasmine' })}`
                    )
                    .join(EOL);
            }
            function toBuilderExports() {
                return params.length > 0
                    ? params
                        .map((p) => p.name)
                        .join(',' + EOL)
                        .concat(',')
                    : '';
            }
        } catch (e) {
            if (e != null && e.message === 'No classes found to be spec-ed!') {
                const funktion = getFirstFunction(fileNameRaw, content);
                if (funktion == null) {
                    throw new Error('No exported class or function to be spec-ed!');
                }

                const src = maybeUseCustomTemplate(
                    tree,
                    url('./files/function'),
                    o?.functionTemplate
                );

                const templateSource = apply(src, [
                    applyTemplates({
                        ...strings,
                        // the name of the new spec file
                        specFileName,
                        fileName,
                        normalizedName: fileName,
                        name: funktion.name,
                    }),
                    move(path),
                ]);

                return mergeWith(templateSource);
            } else {
                throw e;
            }
        }
    }
}

function maybeUseCustomTemplate(tree: Tree, src: Source, templateFileName?: string): Source {
    if (typeof templateFileName === 'string' && tree.exists(templateFileName)) {
        const template = tree.read(templateFileName);
        if (template != null) {
            const [rest] = updateCustomTemplateCut(template.toString('utf8'));

            const t = Tree.empty();
            t.create(basename(normalize(templateFileName)), rest);
            src = source(t);
        }
    }
    return src;
}

function getFirstClass(fileName: string, fileContents: Buffer) {
    const descriptions = describeSource(fileName, fileContents.toString('utf8'));

    const classes = descriptions.filter((c) => isClassDescription(c)) as ClassDescription[];
    // we'll take the first class with any number of constructor params or just the first if there are none
    const classWithConstructorParamsOrFirst: ClassDescription =
        classes.filter((c: ClassDescription) => c.constructorParams.length > 0)[0] || classes[0];

    if (classWithConstructorParamsOrFirst == null) {
        throw new Error('No classes found to be spec-ed!');
    }
    const {
        constructorParams: params,
        name,
        publicMethods,
        type,
        depsCallsAndTypes
    } = classWithConstructorParamsOrFirst;

    return { params, name, publicMethods, type, depsCallsAndTypes };
}

function getFirstFunction(fileName: string, fileContents: Buffer) {
    const descriptions = describeSource(fileName, fileContents.toString('utf8'));
    return (descriptions.filter((f) => f.type === 'function') as FunctionDescription[])[0];
}

function typeShorthand(name: string) {
    return typeof name === 'string' && name.length > 0 ? name.toLocaleLowerCase()[0] : 'x';
}
