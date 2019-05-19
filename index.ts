import { readFileSync } from "fs";
import * as ts from "typescript";

export function delint(sourceFile: ts.SourceFile) {
  delintNode(sourceFile);

  function delintNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration: {
        console.log(
          "class declaration start",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(
            node.end
          )
        );
        break;
      }

      case ts.SyntaxKind.ClassExpression: {
        console.log(
          "class expression",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(
            node.end
          )
        );
        break;
      }

      case ts.SyntaxKind.Constructor: {
        console.log(
          "consturctor start",
          sourceFile.getLineAndCharacterOfPosition(node.getStart()),
          "end",
          sourceFile.getLineAndCharacterOfPosition(
            node.end
          )
        );
        const constrNode = (node as ts.ConstructorDeclaration);

        constrNode.parameters.forEach(p => report(p, `param ${p.name.getFullText()} ${p.type.getFullText()}`))
        constrNode.parameters.forEach(p => report(p, `param ${p.name.getText()} ${p.type.getText()}`))
        //constrNode.parameters.forEach(p => console.log('param', p.name, p.type));

        break;
      }

      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
        if (
          (node as ts.IterationStatement).statement.kind !== ts.SyntaxKind.Block
        ) {
          report(
            node,
            "A looping statement's contents should be wrapped in a block body."
          );
        }
        break;

      case ts.SyntaxKind.IfStatement:
        const ifStatement = node as ts.IfStatement;
        if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
          report(
            ifStatement.thenStatement,
            "An if statement's contents should be wrapped in a block body."
          );
        }
        if (
          ifStatement.elseStatement &&
          ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
          ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement
        ) {
          report(
            ifStatement.elseStatement,
            "An else statement's contents should be wrapped in a block body."
          );
        }
        break;

      case ts.SyntaxKind.BinaryExpression:
        const op = (node as ts.BinaryExpression).operatorToken.kind;
        if (
          op === ts.SyntaxKind.EqualsEqualsToken ||
          op === ts.SyntaxKind.ExclamationEqualsToken
        ) {
          report(node, "Use '===' and '!=='.");
        }
        break;
    }

    ts.forEachChild(node, delintNode);
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

const fileNames = process.argv.slice(2);
fileNames.forEach(fileName => {
  console.log(fileName);
  // Parse a file
  const sourceFile = ts.createSourceFile(
    fileName,
    readFileSync(fileName).toString(),
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
  );

  // delint it
  delint(sourceFile);
});
