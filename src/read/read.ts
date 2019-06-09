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

  // todo how to get all classes (deep ? or just shallow - start with just shallow)
  // todo get all constructor params

  read(sourceFile);

  return [];

  function read(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration: {
        const result = {
          name: node.getText(),
          params: readConstructorParams
        };
        break;
      }
    }

    ts.forEachChild(node, read);
  }
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
export type ClassDescription = {
  name: string;
  constructorParams: ConstructorParam[];
};

type ConstructorParam = {
  name: string;
  type: string;
};
