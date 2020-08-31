import { basename, extname, normalize } from '@angular-devkit/core';
import { Logger } from '@angular-devkit/core/src/logger';
import {
    apply,
    applyTemplates,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import { EOL } from 'os';
import { Change, InsertChange, RemoveChange } from '../../lib/utility/change';
import {
    describeSource,
    isClassDescription,
    ClassDescription,
    FunctionDescription
} from './read/read';
import { addMissing, update as doUpdate } from './update/update';

class SpecOptions {
    name: string;
    update?: boolean;
}

export function spec({ name, update }: SpecOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        // @ts-ignore
        const logger = context.logger.createChild('scuri.index');
        logger.info(`Params: name: ${name} update: ${update}`);
        try {
            if (update) {
                return updateExistingSpec(name, tree, logger);
            } else {
                // spec file does not exist
                return createNewSpec(name, tree, logger);
            }
        } catch (e) {
            e = e || {};
            logger.error(e.message || 'An error occurred');
            logger.debug(
                `---Error--- ${EOL}${e.message || 'Empty error message'} ${e.stack ||
                    'Empty stack.'}`
            );
        }
    };
}
function getSpecFileName(name: string) {
    const normalizedName = normalize(name);
    const ext = extname(basename(normalizedName));

    return name.split(ext)[0] + '.spec' + ext;
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
        const existingSpecFile = tree.get(getSpecFileName(specFileName));
        if (existingSpecFile == null) {
            logger.error(
                `Can not update spec (for ${specFileName}) since it does not exist. Try running without the --update flag.`
            );
        } else {
            const specFilePath = existingSpecFile.path;
            // if a spec exists we'll try to update it
            const { params, name, publicMethods } = getFirstClass(specFileName, content);
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
                shorthand
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
                shorthand
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
            .filter(c => c instanceof InsertChange)
            .forEach((change: InsertChange) => {
                recorder.insertLeft(change.order, change.toAdd);
            });
    } else {
        changes
            .filter(c => c instanceof RemoveChange)
            .forEach((change: RemoveChange) => {
                recorder.remove(change.order, change.toRemove.length);
            });
    }

    tree.commitUpdate(recorder);
}

function createNewSpec(fileNameRaw: string, tree: Tree, logger: Logger) {
    const content = tree.read(fileNameRaw);
    if (content == null) {
        logger.error(`The file ${fileNameRaw} is missing or empty.`);
    } else {
        // we aim at creating or updating a spec from the class under test (name)
        // for the spec name we'll need to parse the base file name and its extension and calculate the path

        // normalize the / and \ according to local OS
        // --name = ./example/example.component.ts -> example.component.ts
        const fileName = basename(normalize(fileNameRaw));
        // --name = ./example/example.component.ts -> ./example/example.component and the ext name -> .ts
        // for import { ExampleComponent } from "./example/example.component"
        const normalizedName = fileName.slice(0, fileName.length - extname(fileName).length);

        // the new spec file name
        const specFileName = `${normalizedName}.spec.ts`;

        const path = fileNameRaw.split(fileName)[0]; // split on the filename - so we get only an array of one item

        try {
            const { params, name, publicMethods } = getFirstClass(fileNameRaw, content);

            // if there are no methods in the class - let's add one test case anyway
            if (Array.isArray(publicMethods) && publicMethods.length === 0) {
                publicMethods.push('');
            }

            const shorthand = typeShorthand(name);

            const templateSource = apply(url('./files/class'), [
                applyTemplates({
                    // the name of the new spec file
                    specFileName,
                    normalizedName: normalizedName,
                    className: name,
                    publicMethods,
                    declaration: toDeclaration(),
                    builderExports: toBuilderExports(),
                    constructorParams: toConstructorParams(),
                    params,
                    shorthand
                }),
                move(path)
            ]);

            return mergeWith(templateSource);

            /**
             * End of the create function
             * Below are the in-scope functions
             */

            // functions defined in the scope of the else to use params and such
            // for getting called in the template - todo - just call the functions and get the result
            function toConstructorParams() {
                return params.map(p => p.name).join(',');
            }
            function toDeclaration() {
                return params
                    .map(p =>
                        p.type === 'string' || p.type === 'number'
                            ? `let ${p.name}:${p.type};`
                            : `const ${p.name} = autoSpy(${p.type});`
                    )
                    .join(EOL);
            }
            function toBuilderExports() {
                return params.length > 0
                    ? params
                          .map(p => p.name)
                          .join(',' + EOL)
                          .concat(',')
                    : '';
            }
        } catch (e) {
            if (e != null && e.message === 'No classes found to be spec-ed!') {
                const f = getFirstFunction(fileNameRaw, content);

                if (f == null) {
                    throw new Error('No exported class or function to be spec-ed!');
                }

                const templateSource = apply(url('./files/function'), [
                    applyTemplates({
                        // the name of the new spec file
                        specFileName,
                        normalizedName: normalizedName,
                        name: f.name
                    }),
                    move(path)
                ]);

                return mergeWith(templateSource);
            } else {
                throw e;
            }
        }
    }
}

function getFirstClass(fileName: string, fileContents: Buffer) {
    const descriptions = describeSource(fileName, fileContents.toString('utf8'));

    const classes = descriptions.filter(c => isClassDescription(c)) as ClassDescription[];

    // we'll take the first class with any number of constructor params or just the first if there are none
    const classWithConstructorParamsOrFirst: ClassDescription =
        classes.filter((c: ClassDescription) => c.constructorParams.length > 0)[0] ||
        descriptions[0];

    if (classWithConstructorParamsOrFirst == null) {
        throw new Error('No classes found to be spec-ed!');
    }
    const {
        constructorParams: params,
        name,
        publicMethods,
        type
    } = classWithConstructorParamsOrFirst;

    return { params, name, publicMethods, type };
}

function getFirstFunction(fileName: string, fileContents: Buffer) {
    const descriptions = describeSource(fileName, fileContents.toString('utf8'));
    return (descriptions.filter(f => f.type === 'function') as FunctionDescription[])[0];
}

function typeShorthand(name: string) {
    const normalizedName = (name || '').toLocaleLowerCase();
    const type = normalizedName.includes('component')
        ? 'c'
        : normalizedName.includes('service')
        ? 's'
        : normalizedName.includes('guard')
        ? 'g'
        : normalizedName.includes('effect')
        ? 'e'
        : normalizedName.includes('reduce')
        ? 'r'
        : 'x';
    return type;
}
