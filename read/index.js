"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var ts = require("typescript");
function delint(sourceFile) {
    delintNode(sourceFile);
    function delintNode(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration: {
                console.log("class declaration start", sourceFile.getLineAndCharacterOfPosition(node.getStart()), "end", sourceFile.getLineAndCharacterOfPosition(node.end));
                break;
            }
            case ts.SyntaxKind.ClassExpression: {
                console.log("class expression", sourceFile.getLineAndCharacterOfPosition(node.getStart()), "end", sourceFile.getLineAndCharacterOfPosition(node.end));
                break;
            }
            case ts.SyntaxKind.Constructor: {
                console.log("consturctor start", sourceFile.getLineAndCharacterOfPosition(node.getStart()), "end", sourceFile.getLineAndCharacterOfPosition(node.end));
                var constrNode = node;
                constrNode.parameters.forEach(function (p) { return report(p, "param " + p.name.getFullText() + " " + p.type.getFullText()); });
                constrNode.parameters.forEach(function (p) { return report(p, "param " + p.name.getText() + " " + p.type.getText()); });
                //constrNode.parameters.forEach(p => console.log('param', p.name, p.type));
                break;
            }
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
                if (node.statement.kind !== ts.SyntaxKind.Block) {
                    report(node, "A looping statement's contents should be wrapped in a block body.");
                }
                break;
            case ts.SyntaxKind.IfStatement:
                var ifStatement = node;
                if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
                    report(ifStatement.thenStatement, "An if statement's contents should be wrapped in a block body.");
                }
                if (ifStatement.elseStatement &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement) {
                    report(ifStatement.elseStatement, "An else statement's contents should be wrapped in a block body.");
                }
                break;
            case ts.SyntaxKind.BinaryExpression:
                var op = node.operatorToken.kind;
                if (op === ts.SyntaxKind.EqualsEqualsToken ||
                    op === ts.SyntaxKind.ExclamationEqualsToken) {
                    report(node, "Use '===' and '!=='.");
                }
                break;
        }
        ts.forEachChild(node, delintNode);
    }
    function report(node, message) {
        var _a = sourceFile.getLineAndCharacterOfPosition(node.getStart()), line = _a.line, character = _a.character;
        console.log(sourceFile.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
    }
}
exports.delint = delint;
var fileNames = process.argv.slice(2);
fileNames.forEach(function (fileName) {
    console.log(fileName);
    // Parse a file
    var sourceFile = ts.createSourceFile(fileName, fs_1.readFileSync(fileName).toString(), ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    // delint it
    delint(sourceFile);
});
