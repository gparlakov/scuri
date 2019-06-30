import { readFileSync } from "fs";
import * as ts from "../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript";

export function readClassNamesAndConstructorParams(fileName: string): ClassDescription[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    readFileSync(fileName).toString(),
    ts.ScriptTarget.ES2015,
    true
  );

  return read(sourceFile);
}

function read(node: ts.Node) {
  let result: ClassDescription[] = [];
  if (node.kind === ts.SyntaxKind.ClassDeclaration) {
    const classDeclaration = node as ts.ClassDeclaration;
    result = [
      {
        name: classDeclaration.name != null ? classDeclaration.name.getText() : "default",
        constructorParams: readConstructorParams(node as ts.ClassDeclaration),
        publicMethods: readPublicMethods(node as ts.ClassDeclaration)
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
        type: (p.type && p.type.getText()) || "any" // the type of constructor param or any if not passe
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
  return (flags & ts.ModifierFlags.Private) !== ts.ModifierFlags.Private && (flags & ts.ModifierFlags.Protected) !== ts.ModifierFlags.Protected;
}
export type ClassDescription = {
  name: string;
  constructorParams: ConstructorParam[];
  publicMethods: string[];
};

export type ConstructorParam = {
  name: string;
  type: string;
};
