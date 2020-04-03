import { EOL } from 'os';
import * as ts from '../../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {
    findNodes,
    insertAfterLastOccurrence,
    isImported,
    insertImport
} from '../../../lib/utility/ast-utils';
import { Change, InsertChange, RemoveChange } from '../../../lib/utility/change';
import { ConstructorParam } from '../read/read';
export const i = insertAfterLastOccurrence;

export function addMissing(
    path: string,
    fileContent: string,
    _dependencies: ConstructorParam[],
    classUnderTestName: string
) {
    const source = ts.createSourceFile(path, fileContent, ts.ScriptTarget.Latest, true);

    const setupFunctionNode = readSetupFunction(source);

    let missingThings: Change[] = [];
    if (setupFunctionNode == null) {
        missingThings.push(
            new InsertChange(
                path,
                source.end,
                `
function setup() {
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new ${classUnderTestName}();
        }
    }
    return builder;
}`
            )
        );
    }
    return missingThings;
}

export function update(
    path: string,
    fileContent: string,
    dependencies: ConstructorParam[],
    classUnderTestName: string,
    action: 'add' | 'remove',
    publicMethods: string[]
): Change[] {
    const source = ts.createSourceFile(path, fileContent, ts.ScriptTarget.Latest, true);

    const setupFunctionNode = readSetupFunction(source);
    if (setupFunctionNode == null) {
        throw new Error("There is no setup function in the source file. We can't update that.");
    }

    const currentParams = readCurrentParameterNames(setupFunctionNode, classUnderTestName);

    const paramsToRemove = currentParams.filter(p => !dependencies.some(d => d.name === p));
    const paramsToAdd = dependencies.filter(d => !currentParams.some(c => c === d.name));

    return action === 'remove'
        ? remove(paramsToRemove, setupFunctionNode, path)
        : [
              ...add(paramsToAdd, setupFunctionNode, path, classUnderTestName),
              ...addMethods(publicMethods, path, fileContent, source),
              ...addMissingImports(dependencies, path, source),
              ...addProviders(
                  source,
                  dependencies,
                  setupFunctionNode.name!.getText() || 'setup',
                  path
              )
          ];
}

function readSetupFunction(source: ts.Node) {
    // FunctionDeclaration -> function setup () {/*body*/ }
    return (findNodes(source, ts.SyntaxKind.FunctionDeclaration) as ts.FunctionDeclaration[]).find(
        n => n.name != null && n.name.text.startsWith('setup')
    );
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

    return instantiations
        .concat(uses)
        .map(i => new RemoveChange(path, i.pos, getTextPlusCommaIfNextCharIsComma(i)));
}

/**
 * Since we want to remove some content from the file it might be the case that there is a comma right after it.
 * In that case we want to remove the comma too
 * @param i the node to read
 * @example *
 * var t = new Class(toRemove, toKeep) // -> we want to remove [toRemove,] <- plus the comma
 * var t = new Class(toKeep)
 */
function getTextPlusCommaIfNextCharIsComma(i: ts.Node) {
    const nextSymbol = i.getSourceFile().getFullText()[i.getEnd()];
    let text = i.getFullText();
    if (nextSymbol === ',') {
        text += nextSymbol;
    }

    return text;
}
function add(
    toAdd: ConstructorParam[],
    setupFunction: ts.FunctionDeclaration,
    path: string,
    classUnderTestName: string
): Change[] {
    // children of the setup include the block - that's what we want to change
    const block = setupFunction.getChildren().find(c => c.kind === ts.SyntaxKind.Block) as ts.Block;
    if (block == null) {
        throw new Error('Could not find the block of the setup function.');
    }

    return [
        ...declareNewDependencies(block, toAdd, path),
        ...exposeNewDependencies(block, toAdd, path),
        ...useNewDependenciesInConstructor(block, toAdd, path, classUnderTestName)
    ];
}

function declareNewDependencies(
    block: ts.Block,
    toAdd: ConstructorParam[],
    path: string,
    _indentation?: string
) {
    // children of the block are the opening { [at index [0]], the block content (SyntaxList) [at index[1]] and the closing } [index [2]]
    // we want to update the SyntaxList
    const setupBlockContent = block.getChildAt(1);

    // leading because it includes the end-of-line from previous line plus indentation on current line
    const leadingIndent = getIndentationMinusComments(setupBlockContent);

    const position = setupBlockContent.getStart();
    return toAdd.map(
        p =>
            // if we are 'mocking' a simple/native type - let c: string; / let c: Object; - leave the instantiation till later
            // if it's a complex type -> const c = autoSpy(Service);
            new InsertChange(
                path,
                position,
                p.type === 'string' ||
                p.type === 'number' ||
                p.type === 'any' ||
                p.type === 'unknown' ||
                p.type === 'Object'
                    ? `let ${p.name}: ${p.type};` + leadingIndent
                    : `const ${p.name} = autoSpy(${p.type});` + leadingIndent
            )
    );
}

function exposeNewDependencies(block: ts.Block, toAdd: ConstructorParam[], path: string) {
    const builderDeclaration = findNodes(block, ts.SyntaxKind.VariableDeclaration).find(v =>
        (v as ts.VariableDeclaration).name.getFullText().includes('builder')
    );
    const builderObjectLiteral = findNodes(
        builderDeclaration!,
        ts.SyntaxKind.ObjectLiteralExpression
    )[0];
    if (builderDeclaration == null || builderObjectLiteral == null) {
        throw new Error('Could not find the builder declaration or its object literal.');
    }

    const indentation = getIndentationMinusComments(builderObjectLiteral.getChildAt(1));

    const positionToAdd = builderObjectLiteral.getChildAt(0).getEnd();
    return toAdd.map(a => new InsertChange(path, positionToAdd, `${indentation}${a.name},`));
}

function useNewDependenciesInConstructor(
    block: ts.Block,
    toAdd: ConstructorParam[],
    path: string,
    classUnderTestName: string
) {
    const classUnderTestConstruction = findNodes(block, ts.SyntaxKind.NewExpression).find(
        (n: ts.NewExpression) => n.getText().includes(classUnderTestName)
    );
    if (classUnderTestConstruction == null) {
        throw new Error(
            `Could not find the new ${classUnderTestName}() expression. Can not update spec.`
        );
    }
    const constrParams = findNodes(classUnderTestConstruction, ts.SyntaxKind.SyntaxList)[0];
    const hasOtherParams = constrParams.getChildCount() > 0;
    return toAdd && toAdd.length > 0
        ? [
              new InsertChange(
                  path,
                  classUnderTestConstruction.end - 1,
                  (hasOtherParams ? ', ' : '') + toAdd.map(p => p.name).join(', ')
              )
          ]
        : []; // dont add params in constructor if no need to
}

function addMethods(
    publicMethods: string[],
    path: string,
    fileContent: string,
    source: ts.SourceFile
) {
    const methodsThatHaveNoTests = publicMethods.filter(
        m => !fileContent.match(new RegExp("it\\s?\\('.*" + m))
    );

    let lastClosingBracketPositionOfDescribe = findNodes(source, ts.SyntaxKind.CallExpression)
        .map(e => (e as ts.CallExpression).expression)
        // we get all describes calls
        .filter(i => i.getText() === 'describe')
        // then their parent - the expression (it has the body with the curly brackets)
        .map(c => c.parent)
        // then we flat the arrays of all close brace tokens from those bodies
        .reduce(
            (acc, c) => [...acc, ...findNodes(c, ts.SyntaxKind.CloseBraceToken)],
            [] as ts.Node[]
        )
        // finally get the last brace position
        .reduce((lastClosingBracket, n) => {
            return n.pos > lastClosingBracket ? n.pos : lastClosingBracket;
        }, 0);

    return methodsThatHaveNoTests.map(
        m =>
            new InsertChange(
                path,
                lastClosingBracketPositionOfDescribe,
                `${EOL}    it('when ${m} is called it should', () => {${EOL}        // arrange${EOL}        const { build } = setup().default();${EOL}        const c = build();${EOL}        // act${EOL}        c.${m}();${EOL}        // assert${EOL}        // expect(c).toEqual${EOL}    });`
            )
    );
}

function addMissingImports(dependencies: ConstructorParam[], path: string, source: ts.SourceFile) {
    // build a map of duplicate/first for each entry, based on the whether or not `previous` contains the elements
    const { duplicateMap } = dependencies.reduce(
        (r, n) => {
            r.duplicateMap.set(
                n,
                r.previous.some(p => p.type === n.type && p.importPath === n.importPath)
                    ? 'duplicate'
                    : 'first'
            );
            r.previous = [...r.previous, n];
            return r;
        },
        {
            previous: [] as ConstructorParam[],
            duplicateMap: new Map<ConstructorParam, 'duplicate' | 'first'>()
        }
    );

    return dependencies
        .filter(d => d.importPath != null)
        .filter(d => duplicateMap.get(d) === 'first')
        .filter(d => !isImported(source, d.type, d.importPath!))
        .map(d => insertImport(source, path, d.type, d.importPath!));
}

/**
 * Should look around for the TestBed configure and update that.
 * If there is no setup call (or there is but it's destructured) it will add a `const a = setup().default()`
 * For each missing provider it will add `.overrideProvider(type, {useValue: a.[name]})`
 * (easier that way instead of picking through the vast number of combinations of the configure testing module)
 *
 * @param source the source created from the file text
 * @param params the constructor parameters of the class-under-test
 * @param setupFunctionName what's the setup function name (default setup)
 * @param path the path to the file
 */
function addProviders(
    source: ts.SourceFile,
    params: ConstructorParam[],
    setupFunctionName: string,
    path: string
) {
    const configureTestingModuleCall = findNodes(source, ts.SyntaxKind.CallExpression)
        // reverse to find the innermost callExpression (the configureTestingModule)
        .reverse()
        .find(n => {
            const text = n.getText();
            return text.includes('configureTestingModule') && text.includes('TestBed');
        }) as ts.CallExpression | null;

    if (configureTestingModuleCall == null) {
        // this is apparently not using TestBed.configureTestingModule() so nothing to do here
        return [];
    } else {
        // find the block of the method that declared TestBed (usually beforeEach)
        const block = findTheParentBlock(configureTestingModuleCall) as ts.Block;
        // as well as the position right at the end of the first brace (so we could insert setup call if necessary)
        const openingBracketPosition = block.getChildAt(0)!.end;
        const firstChildIndentation = getIndentationMinusComments(block.getChildAt(1));

        // if setup function is called - take the name
        const setupInstance = findNodes(block, ts.SyntaxKind.VariableDeclaration).find(n =>
            n.getText().includes('setup')
        );

        const hasANamedSetupInstance =
            setupInstance != null &&
            (setupInstance as ts.VariableDeclaration).name.kind === ts.SyntaxKind.Identifier;

        // if the setup is not called or its value is not assigned to a variable (e.g. is destructured)
        const a = hasANamedSetupInstance
            ? (setupInstance as ts.VariableDeclaration).name.getText()
            : 'a';
        // insert a call to setup function
        const inserts: InsertChange[] = !hasANamedSetupInstance
            ? [
                  new InsertChange(
                      path,
                      openingBracketPosition,
                      `${firstChildIndentation}const ${a} = ${setupFunctionName}().default();`
                  )
              ]
            : [];

        // calculate which dependencies we need to add
        const configureText = configureTestingModuleCall.getText();
        const depsToAdd = params.filter(p => !configureText.includes(p.type));

        // and then add all missing deps in one configureTestingModule call with providers only
        if (depsToAdd.length > 0) {
            const newProviders = depsToAdd
                .map(d => `{ provide: ${d.type}, useValue: ${a}.${d.name} }`)
                .join(',' + EOL + '            ');
            inserts.push(
                new InsertChange(
                    path,
                    configureTestingModuleCall.end,
                    `.configureTestingModule({ providers: [${newProviders}] })`
                )
            );
        }

        return inserts;
    }
}

function findTheParentBlock(node: ts.Node): ts.Node {
    if (node == null || node.kind === ts.SyntaxKind.Block) {
        return node;
    } else {
        return findTheParentBlock(node.parent);
    }
}

function getIndentationMinusComments(node: ts.Node) {
    if (node == null) {
        return '';
    }
    const leadingTrivia = node.getFullText().replace(node.getText(), '');
    let index = leadingTrivia.indexOf(EOL);
    return index < 0 ? leadingTrivia : leadingTrivia.slice(index);
}

//@ts-ignore
function _printKindAndText(node?: ts.Node[] | ts.Node | null, printOutSpaces = false) {
    if (node != null) {
        if (Array.isArray(node)) {
            node.forEach(n => _printKindAndText(n, printOutSpaces));
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
//@ts-ignore
function _printKindAndTextRecursive(node?: ts.Node[] | ts.Node | null, printOutSpaces = false) {
    if (node != null) {
        if (Array.isArray(node)) {
            node.forEach(c => _printKindAndTextRecursive(c, printOutSpaces));
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
                _printKindAndTextRecursive(children, printOutSpaces);
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
