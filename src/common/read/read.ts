import { Tree } from '@angular-devkit/schematics';
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
import { createTsProgram } from '../create-ts-program';
import { getLogger } from '../logger';
import { getKindAndText, printKindAndText } from '../print-node';

const observableProps = ['source', 'operator', 'lift', 'subscribe', 'toPromise'];

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
export function describeSource(fileName: string, fileContents: string, tree: Tree): Description[] {
    const program = createTsProgram(fileName, tree);
    const fileSrc = program.getSourceFile(fileName);

    if (fileSrc == null) {
        getLogger(describeSource.name).debug('fileSrc is missing. Nothing to do here');
        return [];
    }

    return read(fileSrc, program).map((r) =>
        isClassDescription(r)
            ? {
                  ...r,
                  constructorParams: addImportPaths(r.constructorParams, fileContents),
              }
            : r
    );
}

function read(node: ts.Node, program: ts.Program) {
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
                depsCallsAndTypes: readDependencyCalls(classDeclaration, constructorParams, program),
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
        const r = read(n, program);
        if (r && r.length > 0) {
            result = result.concat(r);
        }
    });

    return result;
}

function readConstructorParams(node: ts.ClassDeclaration): ConstructorParam[] {
    let params: ConstructorParam[] = [];
    // const logger = getLogger(readConstructorParams.name);

    ts.forEachChild(node, (node) => {
        if (node.kind === ts.SyntaxKind.Constructor) {
            const constructor = node as ts.ConstructorDeclaration;

            params = constructor.parameters.map((p) => {
                return {
                    name: p.name.getText(),
                    type: (p.type && p.type.getText()) || 'any', // the type of constructor param or any if not passe
                };
            });
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
    constructorParams: ConstructorParam[],
    prog: ts.Program
): DependencyMethodReturnAndPropertyTypes | undefined {
    const l = getLogger(readDependencyCalls.name);
    const sourceFileName = n.getSourceFile().fileName;
    const nodeFullText = n.getFullText();

    const checker = prog.getTypeChecker();
    let dependencyUseTypes = new Map<
        DependencyTypeName,
        Map<DependencyPropertyName, DependencyCall>
    >(
        constructorParams.map((p) => [p.type, new Map()]) // init the Map (hash) for each constructor param type
    );
    const srcFile = prog.getSourceFile(sourceFileName);
    if (srcFile == null) {
        l.debug('missing src file');
        return undefined;
    }

    const node = findNodes(srcFile, ts.isClassDeclaration).find(
        (n) => n.getFullText() === nodeFullText
    );
    if (node == null) {
        l.debug('missing class description node');
        return undefined;
    }

    findNodes(node, ts.isPropertyAccessExpression, 10000, true)
        .filter((accessExpr) =>
            constructorParams.some(
                (param) =>
                    param.name === accessExpr.name.text &&
                    checker.typeToString(checker.getTypeAtLocation(accessExpr)).includes(param.type)
            )
        )
        .filter(
            (accessExpr) =>
                ts.isPropertyAccessExpression(accessExpr.parent) ||
                ts.isElementAccessExpression(accessExpr.parent)
        )
        .forEach((accessExpr) => {
            const p = constructorParams.find(
                (param) =>
                    param.name === accessExpr.name.text &&
                    checker.typeToString(checker.getTypeAtLocation(accessExpr)).includes(param.type)
            )!;

            const callType = checker.getTypeAtLocation(accessExpr.parent);
            l.debug(`accessExpr ${getKindAndText(accessExpr)}, type: ${checker.typeToString(checker.getTypeAtLocation(accessExpr))}`)
            l.debug(
                `processing,${getKindAndText(accessExpr.parent)}: ${checker.typeToString(callType)}`
            );
            const callSignatures = callType.getCallSignatures();

            if (callSignatures?.length > 0) {
                callSignatures.forEach((signature) => {
                    const declaration = signature.getDeclaration();
                    const returnType = signature.getReturnType();

                    if (ts.isMethodDeclaration(declaration)) {
                        const declName = declaration.name.getText();

                        l.debug(
                            `method: ${
                                accessExpr.name.text
                            }.${declName} of type: ${checker.typeToString(
                                checker.getTypeAtLocation(accessExpr.parent)
                            )}`
                        );

                        dependencyUseTypes.get(p.type)!.set(declName, {
                            type: checker.typeToString(returnType),
                            typeParams:
                                'typeArguments' in returnType
                                    ? checker
                                          .getTypeArguments(<ts.TypeReference>returnType)
                                          .map((t) => checker.typeToString(t))
                                    : [],
                            signature: 'function',
                            name: declName,
                            kind: typeKind(returnType),
                        });
                    }
                });
            } else if (
                ts.isPropertyAccessExpression(accessExpr.parent) ||
                ts.isElementAccessExpression(accessExpr.parent)
            ) {
                const propName = getPropName(accessExpr.parent);
                l.debug(
                    `property: ${accessExpr.name.text}.${propName} of type: ${checker.typeToString(
                        checker.getTypeAtLocation(accessExpr.parent)
                    )}`
                );

                dependencyUseTypes.get(p.type)?.set(propName, {
                    type: checker.typeToString(callType),
                    typeParams:
                        'typeArguments' in callType
                            ? checker
                                  .getTypeArguments(<ts.TypeReference>callType)
                                  .map((t) => checker.typeToString(t))
                            : [],
                    signature: 'property',
                    name: propName,
                    kind: typeKind(callType),
                });
            } else {
                l.debug(
                    `not a prop and not a method: ${accessExpr.name.text}.${printKindAndText(
                        accessExpr
                    )} of type: ${checker.typeToString(
                        checker.getTypeAtLocation(accessExpr.parent)
                    )}`
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

function getPropName(p: ts.PropertyAccessExpression | ts.ElementAccessExpression): string {
    // PropertyAccessExpression children [ expression or identifier, dot, identifier] - want the name of identifier
    // ElementAccessExpression children [ expression, open-bracket, stringLiteral, close-bracket ]
    return p.getChildAt(2).getText().replace(/['"`]/g, ''); // clean up the quotes from string literal if
}
