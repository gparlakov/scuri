import * as ts from 'typescript';
import { findNodes } from '../../../lib/utility/ast-utils';
import {
    ConstructorParam,
    DependencyCall,
    DependencyMethodReturnAndPropertyTypes,
    DependencyPropertyName,
    DependencyTypeName,
    Description,
    isClassDescription,
} from '../../types';
const observableProps = [
    'source',
    'operator',
    'lift',
    'subscribe',
    'toPromise',
];

const promiseProps = ['then', 'catch', 'finally'];
/**
 * Will read the Abstract Syntax Tree of the `fileContents` and extract from that:
 *  - the names and types of all constructors' parameters
 *  - the names of all public method
 *  - the path to the dependencies
 * @example
 * class Test {
 *  constructor(service: MyService, param: string) { }
 *
 *  async future() {
 *      const x = await this.service.getFromServer() // returns a Promise<string>
 *
 *      return x.length;
 *  }
 *
 *  alsoFuture() {
 *      return this.service.getFromServer$() // returns an Observable
 *          .pipe(map(x => x.length))
 *  }
 * }
 * // result would be
 * {
 *  name: 'Test',
 *  constructorParams: [{
 *      name: 'service',
 *      type:'MyService',
 *      importPath:'../../my.service.ts'
 *  }, {
 *      name: 'param',
 *      type:'string',
 *      importPath: '-----no-import-path----'
 *  }],
 *  publicMethods: ['future', 'alsoFuture'],
 *  depsCallsAndTypes: new Map([
 *      ['MyService', new Map([
 *          ['getFromServer', 'Promise<string>'],
 *          ['getFromServer$', 'Observable<string>'],
 *      ])]
 *  ])
 * }
 * @param fileName the name of the file (required by ts API)
 * @param fileContents contents of the file
 */
export function describeSource(fileName: string, fileContents: string): Description[] {
    return read(ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true)).map(
        (r) =>
            isClassDescription(r)
                ? {
                      ...r,
                      constructorParams: addImportPaths(r.constructorParams, fileContents),
                  }
                : r
    );
}

function read(node: ts.Node) {
    let result: Description[] = [];
    if (isExportedClass(node)) {
        const classDeclaration = node;
        const constructorParams = readConstructorParams(classDeclaration);
        result = [
            {
                type: 'class',
                name: classDeclaration.name != null ? classDeclaration.name.getText() : 'default',
                constructorParams: constructorParams,
                publicMethods: readPublicMethods(classDeclaration),
                depsCallsAndTypes: readDependencyCalls(classDeclaration, constructorParams),
            },
        ];
    }

    if (isExportedFunction(node)) {
        const func = node as ts.FunctionDeclaration;
        result = [
            {
                type: 'function',
                name: func.name != null ? func.name.getText() : 'anonymousFunction',
            },
        ];
    }
    ts.forEachChild(node, (n) => {
        const r = read(n);
        if (r && r.length > 0) {
            result = result.concat(r);
        }
    });

    return result;
}

function readConstructorParams(node: ts.ClassDeclaration): ConstructorParam[] {
    let params: ConstructorParam[] = [];

    ts.forEachChild(node, (node) => {
        if (node.kind === ts.SyntaxKind.Constructor) {
            const constructor = node as ts.ConstructorDeclaration;

            params = constructor.parameters.map((p) => ({
                name: p.name.getText(),
                type: (p.type && p.type.getText()) || 'any', // the type of constructor param or any if not passe
            }));
        }
    });
    return params;
}

function readPublicMethods(node: ts.ClassDeclaration): string[] {
    let publicMethods: string[] = [];

    ts.forEachChild(node, (node) => {
        if (node.kind === ts.SyntaxKind.MethodDeclaration) {
            const method = node as ts.MethodDeclaration;

            if (methodIsPublic(method)) {
                publicMethods.push(method.name.getText());
            }
        }
    });
    return publicMethods;
}

function readDependencyCalls(
    n: ts.Node,
    constructorParams: ConstructorParam[]
): DependencyMethodReturnAndPropertyTypes | undefined {
    const sourceFileName = n.getSourceFile().fileName;
    const nodeFullText = n.getFullText();
    const prog = ts.createProgram([sourceFileName], {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
    });
    const checker = prog.getTypeChecker();
    let dependencyUseTypes = new Map<
        DependencyTypeName,
        Map<DependencyPropertyName, DependencyCall>
    >();
    const srcFile = prog.getSourceFile(sourceFileName);
    if (srcFile == null) {
        return undefined;
    }

    const node = findNodes(srcFile, ts.isClassDeclaration).find(
        (n) => n.getFullText() === nodeFullText
    );
    if (node == null) {
        return undefined;
    }

    ts.forEachChild(node, (methodMaybe) => {
        if (methodMaybe.kind === ts.SyntaxKind.MethodDeclaration) {
            findNodes(methodMaybe, ts.SyntaxKind.PropertyAccessExpression, 20, true).forEach(
                (propAccess) => {
                    const type = checker.typeToString(checker.getTypeAtLocation(propAccess));
                    const p = constructorParams.find((p) => p.type === type);

                    if (p != null && propAccess.getText().includes(p.name)) {
                        const parent = checker.getTypeAtLocation(propAccess.parent);
                        if (!dependencyUseTypes.has(p.type)) {
                            dependencyUseTypes.set(p.type, new Map());
                        }
                        const callSignatures = parent.getCallSignatures();

                        if (Array.isArray(callSignatures) && callSignatures.length > 0) {
                            callSignatures.forEach((s) => {
                                const dec = s.getDeclaration();
                                const returnType = s.getReturnType();

                                if (ts.isMethodDeclaration(dec)) {
                                    dependencyUseTypes
                                        .get(p.type)!
                                        .set(
                                            dec.name.getText(),
                                            {
                                                type: checker.typeToString(returnType),
                                                typeParams:
                                                    'typeArguments' in returnType
                                                        ? checker
                                                              .getTypeArguments(
                                                                  <ts.TypeReference>returnType
                                                              )
                                                              .map((t) => checker.typeToString(t))
                                                        : [],
                                                signature: 'function',
                                                name: dec.name.getText(),
                                                kind: typeKind(returnType),
                                            }
                                        );
                                }
                            });
                        } else {
                            const propName = (
                                propAccess.parent.getChildren().reverse()[0] as ts.Identifier
                            ).text;

                            dependencyUseTypes.get(p.type)?.set(propName, {
                                type: checker.typeToString(parent),
                                typeParams:
                                    'typeArguments' in parent
                                        ? checker
                                              .getTypeArguments(<ts.TypeReference>parent)
                                              .map((t) => checker.typeToString(t))
                                        : [],
                                signature: 'property',
                                name: propName,
                                kind: typeKind(parent),
                            });
                        }
                    }
                }
            );
        }
    });
    return dependencyUseTypes;
}

function typeKind(parent: ts.Type): 'observable' | 'promise' | 'other' {
    return isObservable(parent) ? 'observable' : isPromise(parent) ? 'promise' : 'other';
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
    return params.map((p) => {
        const match = fullText.match(new RegExp(`import.*${p.type}.*from.*('|")(.*)('|")`)) || [];
        return { ...p, importPath: match[2] }; // take the 2 match     1-st^^^  ^^2-nd
    });
}

function isExported(node: ts.Node, kind: ts.SyntaxKind): boolean {
    return (
        node?.kind === kind &&
        /** True if this is visible outside this file, false otherwise */
        ((ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile))
    );
}

function isExportedClass(node: ts.Node): node is ts.ClassDeclaration {
    return isExported(node, ts.SyntaxKind.ClassDeclaration);
}
function isExportedFunction(node: ts.Node): node is ts.FunctionDeclaration {
    return isExported(node, ts.SyntaxKind.FunctionDeclaration);
}

function isPromise(t: ts.Type): boolean {
    return (
        t.getProperties().filter((p) => promiseProps.includes(p.name)).length ===
        promiseProps.length
    );
}

function isObservable(t: ts.Type): boolean {
    return (
        t.getProperties().filter((p) => observableProps.includes(p.name)).length ===
        observableProps.length
    );
}
