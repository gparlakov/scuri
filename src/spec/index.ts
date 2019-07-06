import { basename, extname, normalize } from '@angular-devkit/core';
import {
    apply,
    applyTemplates,
    FileEntry,
    mergeWith,
    move,
    Rule,
    SchematicContext,
    Tree,
    url
} from '@angular-devkit/schematics';
import { EOL } from 'os';
import { Change, InsertChange, RemoveChange } from '../../lib/utility/change';
import { readClassNamesAndConstructorParams } from '../read/read';
import { update } from '../update/update';

class SpecOptions {
    name: string;
    update?: boolean;
    path?: string;
}

export function spec({ name, update: up, path }: SpecOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        // @ts-ignore
        const logger = context.logger.createChild('scuri.index');
        logger.info(`running with name: ${name} update: ${up}`);

        const content = tree.read(name);
        if (content == null) {
            throw new Error(`The file ${name} is missing or empty.`);
        }

        // the new spec full file name contents - null if file not exist
        const existingSpecFile = tree.get(getSpecFileName(name));
        // if a spec exists we'll try to update it
        if (existingSpecFile) {
            return updateExistingSpec(up, name, content, existingSpecFile, tree);
        } else {
            // spec file does not exist
            return createNewSpec(name, content, tree, context, path);
        }
    };
}
function getSpecFileName(name: string) {
    const normalizedName = normalize(name);
    const ext = extname(basename(normalizedName));

    return name.split(ext)[0] + '.spec' + ext;
}

function updateExistingSpec(
    up: boolean | undefined,
    name: string,
    content: Buffer,
    existingSpecFile: FileEntry,
    tree: Tree
) {
    if (up !== true) {
        throw new Error(
            'The spec file already exists. Please specify --update or -u if you want to update the spec file.'
        );
    }
    const { params, className } = parseClassUnderTestFile(name, content);
    const removeChanges = update(
        existingSpecFile.path,
        existingSpecFile.content.toString('utf8'),
        params,
        className,
        'remove'
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
    const changesToAdd = update(
        existingSpecFile.path,
        tree.read(existingSpecFile.path)!.toString('utf8'),
        params,
        className,
        'add'
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

function createNewSpec(
    name: string,
    content: Buffer,
    _tree: Tree,
    _context: SchematicContext,
    path?: string
) {
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

    path = path || name.split(fileName)[0]; // split on the filename - so we get only an array of one item

    const { params, className, publicMethods } = parseClassUnderTestFile(name, content);
    const templateSource = apply(url('../files'), [
        applyTemplates({
            // the name of the new spec file
            specFileName,
            normalizedName: normalizedName,
            className: className,
            publicMethods,
            declaration: toDeclaration(),
            builderExports: toBuilderExports(),
            constructorParams: toConstructorParams()
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
