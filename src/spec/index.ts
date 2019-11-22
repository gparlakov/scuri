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
import { readClassNamesAndConstructorParams } from './read/read';
import { addMissing, update as updateFunc } from './update/update';

class SpecOptions {
    name: string;
    update?: boolean;
    type?: string;
}

export function spec({ name, update, type }: SpecOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        // @ts-ignore
        const logger = context.logger.createChild('scuri.index');
        logger.info(`Params: name: ${name} update: ${update} for type : ${type}`);
        try {
            if (update) {
                return updateExistingSpec(name, tree, logger);
            } else {
                // spec file does not exist
                return createNewSpec(name, tree, logger, type);
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

function updateExistingSpec(name: string, tree: Tree, logger: Logger) {
    name = sliceSpecFromFileName(name);
    const content = tree.read(name);
    if (content == null) {
        logger.error(`The file ${name} is missing or empty.`);
    } else {
        // the new spec full file name contents - null if file not exist
        const existingSpecFile = tree.get(getSpecFileName(name));
        if (existingSpecFile == null) {
            logger.error(
                `Can not update spec (for ${name}) since it does not exist. Try running without the --update flag.`
            );
        } else {
            const specFilePath = existingSpecFile.path;
            // if a spec exists we'll try to update it
            const { params, className, publicMethods } = parseClassUnderTestFile(name, content);
            logger.debug(`Class name ${className} ${EOL}Constructor(${params}) {${publicMethods}}`);

            // start by adding missing things (like the setup function)
            const addMissingChanges = addMissing(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                className
            );
            applyChanges(tree, specFilePath, addMissingChanges, 'add');

            // then on the resulting tree - remove unneeded deps
            const removeChanges = updateFunc(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                className,
                'remove',
                publicMethods
            );
            applyChanges(tree, specFilePath, removeChanges, 'remove');

            // then add what needs to be added (new deps in the instantiation, 'it' for new methods, etc.)
            const changesToAdd = updateFunc(
                specFilePath,
                tree.read(specFilePath)!.toString('utf8'),
                params,
                className,
                'add',
                publicMethods
            );
            applyChanges(tree, specFilePath, changesToAdd, 'add');
            // console.log(tree.read('c.spec.ts')!.toString());
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

function createNewSpec(name: string, tree: Tree, logger: Logger, type: string = 'scuri') {
    const content = tree.read(name);
    logger.info('Create file ' + name);
    logger.info('' + content);
    if (content == null) {
        logger.error(`The file ${name} is missing or empty.`);
    } else {
        // we aim at creating or updating a spec from the class under test (name)
        // for the spec name we'll need to parse the base file name and its extension and calculate the path

        // normalize the / and \ according to local OS
        // --name = ./example/example.component.ts -> example.component.ts
        const fileName = basename(normalize(name));
        // --name = ./example/example.component.ts -> ./example/example.component and the ext name -> .ts
        // for import { ExampleComponent } from "./example/example.component"
        const normalizedName = fileName.slice(0, fileName.length - extname(fileName).length);

        // the new spec file name
        const specFileName = `${normalizedName}.spec.ts`;

        const path = name.split(fileName)[0]; // split on the filename - so we get only an array of one item

        const { params, className, publicMethods } = parseClassUnderTestFile(name, content);
        console.log('Params :', params);
        console.log('' + publicMethods);
        const templateSource = apply(url(`./files/${type}`), [
            applyTemplates({
                // the name of the new spec file
                specFileName,
                normalizedName: normalizedName,
                className: className,
                publicMethods,
                declaration: toDeclaration(),
                provider: toProvider(),
                builderExports: toBuilderExports(),
                constructorParams: toConstructorParams(),
                params
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
                        : `const ${p.name}: ${p.type} = autoSpy<${p.type}>(${p.type}, '${p.type}');`
                )
                .join(EOL);
        }
        function toProvider() {
            return params
                .reduce<string[]>((current, p) => {
                    if (p.type != 'string' && p.type != 'number') {
                        current.push(`{ provide: ${p.type}, useValue: ${p.name} }`);
                    }
                    return current;
                }, [])
                .join(', ' + EOL);
        }
        function toBuilderExports() {
            return params.length > 0
                ? params
                      .map(p => p.name)
                      .join(',' + EOL)
                      .concat(',')
                : '';
        }
    }
}

function parseClassUnderTestFile(name: string, fileContents: Buffer) {
    const classDescriptions = readClassNamesAndConstructorParams(
        name,
        fileContents.toString('utf8')
    );
    // we'll take the first class with any number of constructor params or just the first if there are none
    const classWithConstructorParamsOrFirst =
        classDescriptions.filter(c => c.constructorParams.length > 0)[0] || classDescriptions[0];
    if (classWithConstructorParamsOrFirst == null) {
        throw new Error('No classes found to be spec-ed!');
    }
    const {
        constructorParams: params,
        name: className,
        publicMethods
    } = classWithConstructorParamsOrFirst;

    return { params, className, publicMethods };
}
