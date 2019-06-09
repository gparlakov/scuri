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

  read(sourceFile);

  return [];

  function read(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration: {
        console.log(
          "class declaration start",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(node.end)
        );
        break;
      }

      case ts.SyntaxKind.ClassExpression: {
        console.log(
          "class expression",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(node.end)
        );
        break;
      }

      case ts.SyntaxKind.Constructor: {
        console.log(
          "consturctor start",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(node.end)
        );
        const constrNode = node as ts.ConstructorDeclaration;

        constrNode.parameters.forEach(p =>
          report(p, `param ${p.name.getFullText()} ${p.type && p.type.getFullText()}`)
        );
        constrNode.parameters.forEach(p =>
          report(p, `param ${p.name.getText()} ${p.type && p.type.getText()}`)
        );
        //constrNode.parameters.forEach(p => console.log('param', p.name, p.type));

        break;
      }
    }

    function report(node: ts.Node, message: string) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart()
      );
      console.log(
        `${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`
      );
    }
  }
}
export type ClassDescription = {
  name: string;
  constructorParams: {
    name: string;
    type: string;
  };
};
