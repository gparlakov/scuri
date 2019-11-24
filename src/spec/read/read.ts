import * as ts from '../../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript';



/**
 * Will read the Abstract Syntax Tree of the `fileContents` and extract from that:
 *  * the names and types of all constructors' parameters
 *  * the names of all public method
 *  * the path to the dependencies
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
export function readClassNamesAndConstructorParams(
    fileName: string,
    fileContents: string
): ClassDescription[] {
    const sourceFile = ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.ES2015, true);

    const res = read(sourceFile);
    const enrichedRes = res.map(r => ({
        ...r,
        constructorParams: addImportPaths(r.constructorParams, fileContents)
    }));
    return enrichedRes;
}

function read(node: ts.Node) {
    let result: ClassDescription[] = [];
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        const classDeclaration = node as ts.ClassDeclaration;
        const methods = readPublicMethods(node as ts.ClassDeclaration);
        result = [
            {
                name: classDeclaration.name != null ? classDeclaration.name.getText() : 'default',
                constructorParams: readConstructorParams(node as ts.ClassDeclaration),
                publicMethods: methods.map<string>(m => m.name),
                methods: methods
            }
        ];
        console.log ('result : ', result); 
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

function readPublicMethods(node: ts.ClassDeclaration): methodeType[] {
    let publicMethods: methodeType[] = [];

    ts.forEachChild(node, node => {
        if (node.kind === ts.SyntaxKind.MethodDeclaration) {
            const method = node as ts.MethodDeclaration;

            const func = constructMethodType(method);

            if (methodIsPublic(method)) {
                publicMethods.push(func);
            }
        }
    });
    return publicMethods;
}

function constructMethodType(methodNode: ts.MethodDeclaration): methodeType {

    const method: methodeType = {name: methodNode.name.getText()};

    method.params = methodNode.parameters.map<methodParams>(p => ({
                name: p.name.getText(),
                type: (p.type && p.type.getText()) || 'any' // the type of constructor param or any if not passe
            }));
    const flags = ts.getCombinedModifierFlags(methodNode);
    // check if the private flag is part of this binary flag - if not means the method is public
    if ((flags & ts.ModifierFlags.Private) === ts.ModifierFlags.Private) {
      method.isPublic = false;
      method.type = 'private';
    } else if ((flags & ts.ModifierFlags.Protected) === ts.ModifierFlags.Protected) {
      method.isPublic = false;
      method.type = 'protected';
    } else {
      method.isPublic = true;
      method.type = 'public';
    }

    console.log('methodType :', method);


    return method;
}

function methodIsPublic(methodNode: ts.MethodDeclaration) {
    const flags = ts.getCombinedModifierFlags(methodNode);
    // check if the private flag is part of this binary flag - if not means the method is public
    return (
        (flags & ts.ModifierFlags.Private) !== ts.ModifierFlags.Private &&
        (flags & ts.ModifierFlags.Protected) !== ts.ModifierFlags.Protected
    );
}

function addImportPaths(params: ConstructorParam[] | methodParams[], fullText: string): ConstructorParam[] | methodParams[] {
    return params.map(p => {
        const match = fullText.match(new RegExp(`import.*${p.type}.*from.*('|")(.*)('|")`)) || [];
        return { ...p, importPath: match[2] }; // take the 2 match     1-st^^^  ^^2-nd
    });
}
export type ClassDescription = {
    name: string;
    constructorParams: ConstructorParam[];
    publicMethods: string[];
    methods: methodeType[];
};

export type ConstructorParam = {
    name: string;
    type: string;
    importPath?: string;
};

export type methodeType = {
    name: string;
    isPublic?: boolean,
    type?: 'public' | 'private' | 'protected',
    body?: string,
    params?: methodParams[], 
    [key: string]: any;
}

export type methodParams = {
    name: string;
    type: string,    
    importPath?: string;
}
