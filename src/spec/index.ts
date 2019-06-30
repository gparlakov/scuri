import { basename, extname, normalize, strings } from '@angular-devkit/core';
import {
    apply,
    branchAndMerge,
    mergeWith,
    Rule,
    SchematicContext,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import { EOL } from 'os';
import { readClassNamesAndConstructorParams } from '../read/read';
import { update } from '../update/update';
import { Change, InsertChange, RemoveChange } from '../../lib/utility/change';

class SpecOptions {
    name: string;
    param: string[];
}

export function spec(options: SpecOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        const fileContents = tree.read(options.name);
        if (fileContents == null) {
            throw new Error(`The file ${options.name} is missing or empty.`);
        }
        const classDescriptions = readClassNamesAndConstructorParams(
            options.name,
            fileContents.toString('utf8')
        );
        // we'll take the first class with any number of constructor params or just the first if there are none
        const classWithConstructorParamsOrFirst =
            classDescriptions.filter(c => c.constructorParams.length > 0)[0] ||
            classDescriptions[0];
        if (classWithConstructorParamsOrFirst == null) {
            throw new Error('No classes found to be spec-ed!');
        }
        const {
            constructorParams: params,
            name: className,
            publicMethods
        } = classWithConstructorParamsOrFirst;

        // normalize the / and \ according to local OS
        const normalized = normalize(options.name);
        // --name = ./example/example.component.ts -> example.component.ts
        const fileName = basename(normalized);
        // --name = ./example/example.component.ts -> .ts
        const ext = extname(fileName);
        // --name = ./example/example.component.ts -> ./example/example.component
        // for import { ExampleComponent } from "./example/example.component"
        const normalizedName = fileName.slice(0, fileName.length - ext.length);
        // the new spec full file name
        // --name = ./example/example.component.ts -> ./example/example.component (gets .spec.ts added later)
        const newFileNormalizedName = options.name.slice(0, options.name.length - ext.length);

        const existingSpecFile = tree.get(newFileNormalizedName + '.spec' + ext);
        // if a spec exists we'll update it
        if (existingSpecFile) {
            const changes = update(
                existingSpecFile.path,
                existingSpecFile.content.toString('utf8'),
                params,
                className
            );

            const recorder = tree.beginUpdate(existingSpecFile.path);
            changes.forEach((change: Change) => {
                if (change instanceof InsertChange) {
                    recorder.insertLeft(change.pos, change.toAdd);
                }
                if (change instanceof RemoveChange) {
                    recorder.remove(change.order, change.toRemove.length);
                }
            });
            tree.commitUpdate(recorder);

            return tree;
        } else {
            // spec file does not exist
            const templateSource = apply(url('../files'), [
                template({
                    classify: strings.classify,
                    normalizedName: normalizedName,
                    newFileNormalizedName,
                    name: options.name,
                    className: className,
                    params: params,
                    toConstructorParams,
                    toDeclaration,
                    toBuilderExports,
                    publicMethods
                })
            ]);
            return branchAndMerge(mergeWith(templateSource))(tree, context);
        }

        // functions defined in the scope of the Rule for use in the template
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
    };
}
