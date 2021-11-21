import * as ts from '../../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { Description, isClassDescription, ConstructorParam } from '../../types';

/**
 * Will read the Abstract Syntax Tree of the `fileContents` and extract from that:
 *  - the names and types of all constructors' parameters
 *  - the names of all public method
 *  - the path to the dependencies
 * @example
 * class Test {
 *  constructor(service: MyService, param: string) { }
 *
 *  async future() {}
 *  now() {}
 * }
 * // result would be
 * {
 *  name: 'Test',
 *  constructorParams: [{name: 'service', type:'MyService', importPath:'../../my.service.ts'}, {name: 'param', type:'string', importPath: '-----no-import-path----'}],
 *  publicMethods: ['future', 'now']
 * }
 * @param fileName the name of the file (required by ts API)
 * @param fileContents contents of the file
 */
export function describeSource(fileName: string, fileContents: string): Description[] {
    const sourceFile = ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true);

    const description = read(sourceFile);
    const enrichedDescription = description.map(r =>
        isClassDescription(r)
            ? {
                  ...r,
                  constructorParams: addImportPaths(r.constructorParams, fileContents)
              }
            : r
    );
    return enrichedDescription;
}

function read(node: ts.Node) {
    let result: Description[] = [];
    if (isExportedClass(node)) {
        const classDeclaration = node as ts.ClassDeclaration;
        result = [
            {
                type: 'class',
                name: classDeclaration.name != null ? classDeclaration.name.getText() : 'default',
                constructorParams: readConstructorParams(node as ts.ClassDeclaration),
                publicMethods: readPublicMethods(node as ts.ClassDeclaration)
            }
        ];
    }

    if (isExportedFunction(node)) {
        const func = node as ts.FunctionDeclaration;
        result = [
            {
                type: 'function',
                name: func.name != null ? func.name.getText() : 'anonymousFunction'
            }
        ];
    }
    ts.forEachChild(node, n => {
        const r = read(n);
        if (r && r.length > 0) {
            result = result.concat(r);
        }
    });

    return result;
}

function readConstructorParams(node: ts.ClassDeclaration): ConstructorParam[] {
    let params: ConstructorParam[] = [];

    ts.forEachChild(node, node => {
        if (node.kind === ts.SyntaxKind.Constructor) {
            const constructor = node as ts.ConstructorDeclaration;

            params = constructor.parameters.map(p => ({
                name: p.name.getText(),
                type: (p.type && p.type.getText()) || 'any' // the type of constructor param or any if not passe
            }));
        }
    });
    return params;
}

function readPublicMethods(node: ts.ClassDeclaration): string[] {
    let publicMethods: string[] = [];

    ts.forEachChild(node, node => {
        if (node.kind === ts.SyntaxKind.MethodDeclaration) {
            const method = node as ts.MethodDeclaration;

            if (methodIsPublic(method)) {
                publicMethods.push(method.name.getText());
            }
        }
    });
    return publicMethods;
}

function methodIsPublic(methodNode: ts.MethodDeclaration) {
    const flags = ts.getCombinedModifierFlags(methodNode);
    // check if the private flag is part of this binary flag - if not means the method is public
    return (
        (flags & ts.ModifierFlags.Private) !== ts.ModifierFlags.Private &&
        (flags & ts.ModifierFlags.Protected) !== ts.ModifierFlags.Protected
    );
}

function addImportPaths(params: ConstructorParam[], fullText: string) {
    return params.map(p => {
        const match = fullText.match(new RegExp(`import.*${p.type}.*from.*('|")(.*)('|")`)) || [];
        return { ...p, importPath: match[2] }; // take the 2 match     1-st^^^  ^^2-nd
    });
}

function isExported(node: ts.Node, kind: ts.SyntaxKind): boolean {
    return (
        node.kind === kind &&
        node.modifiers != null &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    );
}

function isExportedClass(node: ts.Node): node is ts.ClassDeclaration {
    return isExported(node, ts.SyntaxKind.ClassDeclaration);
}
function isExportedFunction(node: ts.Node): node is ts.FunctionDeclaration {
    return isExported(node, ts.SyntaxKind.FunctionDeclaration);
}
