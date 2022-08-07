import { EOL } from 'os';
import * as ts from 'typescript';

export function printKindAndText(node?: ts.Node[] | ts.Node | null, printOutSpaces = false) {
    if (node != null) {
        if (Array.isArray(node)) {
            node.forEach(n => printKindAndText(n, printOutSpaces));
        } else {
            // tslint:disable-next-line:no-console
            console.log(
                _formatTextWithSpaces(node, printOutSpaces),
                'kind:',
                ts.SyntaxKind[node.kind],
                EOL
            );
        }
    } else {
        // tslint:disable-next-line:no-console
        console.log('this is empty');
    }
}
let depth = 1;
let maxDepth = 5;


export function printKindAndTextRecursive(node?: ts.Node[] | ts.Node | null, printOutSpaces = false) {
    if (node != null) {
        if (Array.isArray(node)) {
            node.forEach(c => printKindAndTextRecursive(c, printOutSpaces));
        } else {
            // tslint:disable-next-line:no-console
            console.log(
                _formatTextWithSpaces(node, printOutSpaces),
                EOL,
                'kind:',
                ts.SyntaxKind[node.kind],
                'depth:',
                depth,
                EOL
            );
            depth += 1;
            const children = node.getChildren();
            if (Array.isArray(children) && depth <= maxDepth) {
                printKindAndTextRecursive(children, printOutSpaces);
            }
            depth -= 1;
        }
    } else {
        // tslint:disable-next-line:no-console
        console.log('this is empty');
    }
}


function _formatTextWithSpaces(node: ts.Node | string, printOutSpaces: boolean) {
    const text = typeof node === 'string' ? node : node.getFullText();
    return printOutSpaces
        ? text
              .replace(/(\r\n|\r|\n)/g, 'NEW_LINE_MF')
              .replace(/\s/g, '•')
              .replace(/NEW_LINE_MF/g, '¶' + EOL)
        : text;
}
