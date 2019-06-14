import { readFileSync } from "fs";
import * as ts from "typescript";

export function readClassNamesAndConstructorParams(
  fileName: string
): ClassDescription[] {
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
        name:
          classDeclaration.name != null
            ? classDeclaration.name.getText()
            : "default",
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
      const flags = ts.getCombinedModifierFlags(method);

      if (flags === 0 || (flags | ts.ModifierFlags.Public) === 0) {
        publicMethods.push(method.name.getText());
      }
    }
  });
  return publicMethods;
}
export type ClassDescription = {
  name: string;
  constructorParams: ConstructorParam[];
  publicMethods: string[];
};

type ConstructorParam = {
  name: string;
  type: string;
};
