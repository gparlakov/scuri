import { basename, normalize, strings } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    chain,
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
import { Change, InsertChange, RemoveChange } from '../../lib/utility/change';
import {
    addDefaultObservableAndPromiseToSpyJoined,
    includePropertyMocks,
    propertyMocks,
    createSetupMethodsFn,
} from '../common/add-observable-promise-stubs';
import { getSpecFilePathName } from '../common/get-spec-file-name';
import { getLogger, setLogger } from '../common/logger';
import { paths } from '../common/paths';
import { describeSource } from '../common/read/read';
import { scuriTemplateMark, updateCustomTemplateCut } from '../common/scuri-custom-update-template';
import {
    ClassDescription,
    ClassTemplateData,
    FunctionDescription,
    isClassDescription,
} from '../types';
import { addMissingImports } from './add-missing-imports/add-missing-imports.rule';
import { addMissing, update as doUpdate, UpdateOptions } from './update/update';
import {
    detectTestingFramework,
    Supported,
    Supported as SupportedFrameworks,
} from '../common/detect-testing-framework';
import { getSourceFile } from '../common/create-ts-program';

export class SpecOptions {
    name: string;
    update?: boolean;
    classTemplate?: string;
    functionTemplate?: string;
    config?: string;
    framework?: SupportedFrameworks;
    autoSpyLocation?: string;
}

type Config = Omit<SpecOptions, 'name' | 'update' | 'config'>;

export function spec({
    name,
    update,
    classTemplate,
    functionTemplate,
    config,
    framework,
    autoSpyLocation
}: SpecOptions): Rule {
    const isForce = process.argv.find((e) => e === 'force' || e === '--force') != null;

    return (tree: Tree, context: SchematicContext) => {
        // nothing before this line as it will have no access to logger
        const logger = context.logger.createChild('scuri.index');
        setLogger(logger);

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
                `Class template configuration was [${normalize(
                    classTemplate
                )}] but that file seems to be missing.`
            );
        }

        functionTemplate = functionTemplate ?? c.functionTemplate;
        if (typeof functionTemplate === 'string' && !tree.exists(functionTemplate)) {
            throw new Error(
                `Function template configuration was [${normalize(
                    functionTemplate
                )}] but that file seems to be missing.`
            );
        }

        const frm = detectTestingFramework(framework, c?.framework, tree, 'jasmine');
        const autoSpyPath = (autoSpyLocation ?? c.autoSpyLocation) ?? 'autoSpy';

        try {
            if (update) {
                if (
                    classTemplate &&
                    tree.exists(classTemplate) &&
                    tree.read(classTemplate)?.toString()?.includes(scuriTemplateMark)
                ) {
                    logger.debug(`Switching to update custom ${classTemplate}`);
                    return schematic('update-custom', { name, classTemplate });
                }
                logger.debug(`Updating spec for [${name}]`);
                return chain([
                    updateExistingSpec(name, { framework: frm }),
                    addMissingImports(getSpecFilePathName(name), {autoSpyPath}),
                ]);
            } else {
                logger.debug(`creating a new spec for file: [${name}]`);
                return chain([
                    createNewSpec(name, {
                        classTemplate,
                        functionTemplate,
                        force: isForce,
                        framework: frm,
                    }),
                    addMissingImports(getSpecFilePathName(name), {autoSpyPath}),
                ]);
            }
        } catch (e) {
            e = e || {};
            logger.error(e.message || 'An error occurred');
            logger.debug(
                `---Error--- ${EOL}${e.message || 'Empty error message'} ${
                    e.stack || 'Empty stack.'
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

function updateExistingSpec(fullName: string, o: UpdateOptions): Rule {
    const specFileName = sliceSpecFromFileName(fullName);
    const logger = getLogger(updateExistingSpec.name);
    return (tree, _context) => {
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
                logger.debug(`found [${existingSpecFile.path}]`)
                const specFilePath = existingSpecFile.path;
                // if a spec exists we'll try to update it
                const { params, name, publicMethods, depsCallsAndTypes } = getFirstClass(
                    specFileName,
                    content,
                    tree
                );
                const shorthand = typeShorthand(name);
                logger.debug(`Class name ${name} | constructor(${params.map(p => `${p.name}: ${p.type}`).join()}) methods: ${publicMethods}`);
                const sourceFile = getSourceFile(specFilePath, tree);
                if(sourceFile == null) {
                    logger.error(`Can't find the source for ${specFilePath}. File is probably missing.`);
                    throw new Error(`Can't find the source for ${specFilePath}. File is probably missing.`);
                }
                // logger.debug(`Source file ${sourceFile.getFullText()}`)
                // start by adding missing things (like the setup function)
                const addMissingChanges = addMissing(
                    specFilePath,
                    sourceFile,
                    params,
                    name
                );
                logger.debug(`addMissing(${addMissingChanges?.length}): ${addMissingChanges?.map(c => c.path).join('||')}`)
                applyChanges(tree, specFilePath, addMissingChanges, 'add');

                // then on the resulting tree - remove unneeded deps
                const removeChanges = doUpdate(
                    specFilePath,
                    getSourceFile(specFilePath, tree)!,
                    params,
                    name,
                    'remove',
                    publicMethods,
                    shorthand,
                    depsCallsAndTypes,
                    o
                );
                logger.debug(`remove changes(${removeChanges.length}): ${removeChanges.map(r => r.description).join()}}`)
                applyChanges(tree, specFilePath, removeChanges, 'remove');

                // then add what needs to be added (new deps in the instantiation, 'it' for new methods, etc.)
                const changesToAdd = doUpdate(
                    specFilePath,
                    getSourceFile(specFilePath, tree)!,
                    params,
                    name,
                    'add',
                    publicMethods,
                    shorthand,
                    depsCallsAndTypes,
                    o
                );
                logger.debug(`add changes(${changesToAdd.length}): ${changesToAdd.map(c => c.description).join()}`)
                applyChanges(tree, specFilePath, changesToAdd, 'add');

                const changesToAddAdditional = doUpdate(
                    specFilePath,
                    getSourceFile(specFilePath, tree)!,
                    params,
                    name,
                    'add-spy-methods-and-props',
                    publicMethods,
                    shorthand,
                    depsCallsAndTypes,
                    o
                );
                logger.debug(`add additional changes(${changesToAddAdditional.length}): ${changesToAddAdditional.map(c => c.description).join(',')}`)
                applyChanges(tree, specFilePath, changesToAddAdditional, 'add');

                return tree;
            }
        }
    };
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
    o?: {
        classTemplate?: string;
        functionTemplate?: string;
        force?: boolean;
        framework?: Supported;
    }
): Rule {
    const logger = getLogger(createNewSpec.name);
    logger.debug('called and returning a function Rule')

    return (tree, _context) => {
        const content = tree.read(fileNameRaw);
        if (content == null) {
            logger.error(`The file ${fileNameRaw} is missing or empty.`);
            return tree;
        } else {
            // we aim at creating a spec from the class/function under test (name)
            // for the spec name we'll need to parse the base file name and its extension and calculate the path

            logger.debug(`entering`)
            const {
                specFileName,
                fileName,
                folderPathRaw: path,
                folderPathNormal: folder,
            } = paths(fileNameRaw);

            logger.debug(`specFileName ${specFileName},fileName ${fileName}, folderPathRaw ${path}, folderPathNormal ${folder},`)
            try {
                const { params, name, publicMethods, depsCallsAndTypes } = getFirstClass(
                    fileNameRaw,
                    content,
                    tree
                );

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
                    shorthand: typeShorthand(name),
                    setupMethods: createSetupMethodsFn(params, depsCallsAndTypes, {
                        spyReturnType: o?.framework,
                    }),
                };
                const src = maybeUseCustomTemplate(tree, url('./files/class'), o?.classTemplate);

                const templateSource = apply(src, [applyTemplates(templateVariables), move(path)]);

                return mergeWith(
                    templateSource,
                    o?.force ? MergeStrategy.AllowCreationConflict : undefined
                );

                /**
                 * End of the create function
                 * Below are the in-scope functions
                 */

                // functions defined in the scope of the else to use params and such
                // for getting called in the template - todo - just call the functions and get the result
                function toConstructorParams() {
                    return params.map((p) => p.name).join(',');
                }
                function toDeclaration(joiner?: string) {
                    joiner = joiner ?? `${EOL}    `
                    return params
                        .map((p) =>
                            p.type === 'string' || p.type === 'number'
                                ? `let ${p.name}:${p.type};`
                                : `${propertyMocks(p, depsCallsAndTypes, {
                                      joiner,
                                  })}const ${p.name} = autoSpy(${p.type}${includePropertyMocks(
                                      p,
                                      depsCallsAndTypes
                                  )});${addDefaultObservableAndPromiseToSpyJoined(
                                      p,
                                      depsCallsAndTypes,
                                      { joiner, spyReturnType: o?.framework }
                                  )}${joiner}`
                        )
                        .join('');
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
                logger.debug(`caught an error ${e?.message ? e.message : e?.stackTrace? e?.stackTrace : JSON.stringify(e, null, 2)}`)
                if (e != null && e.message === 'No classes found to be spec-ed!') {
                    const fun = getFirstFunction(fileNameRaw, content, tree);
                    if (fun == null) {
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
                            name: fun.name,
                        }),
                        move(path),
                    ]);

                    return mergeWith(templateSource);
                } else {
                    throw e;
                }
            }
        }
    };
}

function maybeUseCustomTemplate(tree: Tree, src: Source, templateFileName?: string): Source {
    const logger = getLogger(maybeUseCustomTemplate.name);
    const originalSrc = src;

    if (typeof templateFileName === 'string' && tree.exists(templateFileName)) {
        const template = tree.read(templateFileName);
        if (template != null) {
            const [rest] = updateCustomTemplateCut(template.toString('utf8'));

            const t = Tree.empty();

            logger.debug(`${templateFileName} found and cut to [${rest}]`);
            t.create(basename(normalize(templateFileName)), rest);
            src = source(t);
        }
    }
    logger.debug(`${templateFileName ?? 'no template option passed ----'} ${src === originalSrc ? 'not' : ''} found `);
    return src;
}

function getFirstClass(fileName: string, fileContents: Buffer, tree: Tree) {
    const logger = getLogger(getFirstClass.name);
    logger.debug('entering')
    const descriptions = describeSource(fileName, fileContents.toString('utf8'), tree);

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
        depsCallsAndTypes,
    } = classWithConstructorParamsOrFirst;

    return { params, name, publicMethods, type, depsCallsAndTypes };
}

function getFirstFunction(fileName: string, fileContents: Buffer, tree: Tree) {
    const descriptions = describeSource(fileName, fileContents.toString('utf8'), tree);
    return (descriptions.filter((f) => f.type === 'function') as FunctionDescription[])[0];
}

function typeShorthand(name: string) {
    return typeof name === 'string' && name.length > 0 ? name.toLocaleLowerCase()[0] : 'x';
}
