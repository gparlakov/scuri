import { Change, RemoveChange } from "../../lib/utility/change";
import * as ts from "../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript";
import { ConstructorParam } from "../read/read";
import { findNodes } from "../../lib/utility/ast-utils";
import { EOL } from "os";

export function update(
    path: string,
    fileContent: string,
    dependencies: ConstructorParam[],
    classUnderTestName: string
): Change[] {
    const source = ts.createSourceFile(path, fileContent, ts.ScriptTarget.Latest, true);

    const setupFunctionNode = readSetupFunction(source);

    if (setupFunctionNode == null) {
        throw new Error("There is no setup function in the source file. We can't update that.");
    }

    const currentParams = readCurrentParameterNames(setupFunctionNode, classUnderTestName);

    const paramsToRemove = currentParams.filter(p => !dependencies.some(d => d.name === p));
    const paramsToAdd = dependencies.filter(d => !currentParams.some(c => c === d.name));

    console.log("remove", paramsToRemove, "add:", paramsToAdd);

    return remove(paramsToRemove, setupFunctionNode, path);
}

function readSetupFunction(source: ts.Node) {
    // FunctionDeclaration -> function setup () {/*body*/ }
    let setupFunctionNode: ts.FunctionDeclaration | null = null;
    ts.forEachChild(source, node => {
        if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
            const name = (node as ts.FunctionDeclaration).name;
            if (name != null && name.text.startsWith("setup")) {
                setupFunctionNode = node as ts.FunctionDeclaration;
                return true; // finish the forEachChild - we found what we are looking for
            }
        }
    });
    return setupFunctionNode;
}

function readCurrentParameterNames(
    setupFunctionNode: ts.FunctionDeclaration,
    classUnderTestName: string
) {
    // NewExpression -> new ExampleComponent(dep1, dep2)
    const instantiateClassUnderTestNode = findNodes(
        setupFunctionNode,
        ts.SyntaxKind.NewExpression
    ).find(
        node =>
            node.kind === ts.SyntaxKind.NewExpression && node.getText().includes(classUnderTestName)
    ) as ts.NewExpression;

    //  SyntaxList -> dep1,dep2
    const parametersList = findNodes(
        instantiateClassUnderTestNode,
        ts.SyntaxKind.SyntaxList
    )[0] as ts.SyntaxList;

    // Array -> ['dep1', 'dep2']
    const parameterNames = findNodes(parametersList, ts.SyntaxKind.Identifier).map(n =>
        n.getText()
    );

    return parameterNames;
}
function remove(toRemove: string[], setupFunction: ts.FunctionDeclaration, path: string) {
    // VariableStatement -> let dep:string; Or const service = autoSpy(Object);
    const instantiations = findNodes(setupFunction, ts.SyntaxKind.VariableStatement).filter(
        (n: ts.VariableStatement) =>
            n.declarationList.declarations.some(v => toRemove.includes(v.name.getText()))
    );
    const uses = findNodes(setupFunction, ts.SyntaxKind.Identifier)
        .filter(i => !i.parent || i.parent.kind !== ts.SyntaxKind.VariableDeclaration)
        .filter(i => toRemove.includes((i as ts.Identifier).getText()));

    return instantiations.concat(uses).map(i => new RemoveChange(path, i.pos, i.getFullText()));
}

// @ts-ignore
function getTextPlusCommaIfAny(i: ts.Node) {
    const children = i.parent.getChildren();
    const useIndex = children.findIndex(c => c === i);
    if (children[useIndex + 1] && children[useIndex + 1].kind === ts.SyntaxKind.CommaToken) {
        // there is a comma right after the node
        console.log(i.getText() + children[useIndex + 1].getText());
        return i.getText() + children[useIndex + 1].getText();
    } else {
        // there is no comma right after the node
        return i.getText();
    }
}

//@ts-ignore
function _printKindAndText(node: ts.Node) {
    console.log(ts.SyntaxKind[node.kind], node.getText(), EOL);
}
