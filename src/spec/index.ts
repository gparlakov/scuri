import { basename, extname, normalize } from '@angular-devkit/core';
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
import { update as updateFunc } from './update/update';
import { Logger } from '@angular-devkit/core/src/logger';

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

function updateExistingSpec(name: string, tree: Tree, logger: Logger) {
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
            // if a spec exists we'll try to update it
            const { params, className, publicMethods } = parseClassUnderTestFile(name, content);
            logger.debug(`Class name ${className} ${EOL}Constructor(${params}) {${publicMethods}}`);
            const removeChanges = updateFunc(
                existingSpecFile.path,
                existingSpecFile.content.toString('utf8'),
                params,
                className,
                'remove',
                publicMethods
            );
            // first pass - remove
            const removeRecorder = tree.beginUpdate(existingSpecFile.path);
            removeChanges.forEach((change: Change) => {
                if (change instanceof RemoveChange) {
                    removeRecorder.remove(change.order, change.toRemove.length);
                }
            });
            tree.commitUpdate(removeRecorder);
            // now we need to redo the update on the new file contents
            const changesToAdd = updateFunc(
                existingSpecFile.path,
                tree.read(existingSpecFile.path)!.toString('utf8'),
                params,
                className,
                'add',
                publicMethods
            );
            // first pass - add
            const addRecorder = tree.beginUpdate(existingSpecFile.path);
            changesToAdd.forEach((change: Change) => {
                if (change instanceof InsertChange) {
                    addRecorder.insertLeft(change.order, change.toAdd);
                }
            });
            tree.commitUpdate(addRecorder);
            return tree;
        }
    }
}

function createNewSpec(name: string, tree: Tree, logger: Logger) {
    const content = tree.read(name);
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
        const templateSource = apply(url('./files'), [
            applyTemplates({
                // the name of the new spec file
                specFileName,
                normalizedName: normalizedName,
                className: className,
                publicMethods,
                declaration: toDeclaration(),
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
