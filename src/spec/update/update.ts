import { EOL } from 'os';
import * as ts from '../../../lib/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { findNodes, insertAfterLastOccurrence } from '../../../lib/utility/ast-utils';
import { Change, InsertChange, RemoveChange } from '../../../lib/utility/change';
import { ConstructorParam } from '../read/read';
export const i = insertAfterLastOccurrence;

export function addMissing(
    path: string,
    fileContent: string,
    _dependencies: ConstructorParam[],
    _classUnderTestName: string
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
            return new ${_classUnderTestName}();
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
              ...addMissingImports(dependencies, fileContent, path),
              ...addProviders(
                  source,
                  paramsToAdd,
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

    const blockIndentation = '        ';

    return [
        ...declareNewDependencies(block, toAdd, path, blockIndentation),
        ...exposeNewDependencies(block, toAdd, path, blockIndentation),
        ...useNewDependenciesInConstructor(block, toAdd, path, classUnderTestName)
    ];
}

function declareNewDependencies(
    block: ts.Block,
    toAdd: ConstructorParam[],
    path: string,
    indentation?: string
) {
    // children of the block are the opening {  the block content (SyntaxList) and the closing }
    // we want to update the SyntaxList
    const setupBlockContent = block.getChildAt(1);
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
                    ? `let ${p.name}: ${p.type};${EOL}${indentation}`
                    : `const ${p.name} = autoSpy(${p.type});${EOL}${indentation}`
            )
    );
}

function exposeNewDependencies(
    block: ts.Block,
    toAdd: ConstructorParam[],
    path: string,
    indentation?: string
) {
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
    const positionToAdd = builderObjectLiteral.getChildAt(0).getEnd();
    return toAdd.map(a => new InsertChange(path, positionToAdd, `${EOL}${indentation}${a.name},`));
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
                `
it('when ${m} is called it should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    c.${m}();
    // assert
    // expect(c).toEqual
});
`
            )
    );
}

function addMissingImports(dependencies: ConstructorParam[], fileContent: string, path: string) {
    const missingImports = dependencies.filter(d => {
        const matchImport = new RegExp(`import.*${d.type}`);
        return fileContent.match(matchImport) == null;
    });
    const addImports = missingImports.map(
        i => new InsertChange(path, 0, `import { ${i.type} } from '${i.importPath}';${EOL}`)
    );
    return addImports;
}

function addProviders(
    _source: ts.SourceFile,
    _paramsToAdd: ConstructorParam[],
    _setupFunctionName: string,
    _path: string
) {
    const configureTestingModuleCall = findNodes(_source, ts.SyntaxKind.CallExpression)
        // reverse to find the innermost callExpression (the configureTestingModule)
        .reverse()
        .find(n => {
            const text = n.getText();
            return text.includes('configureTestingModule') && text.includes('TestBed')
        }) as ts.CallExpression | null;

    // this is apparently not using TestBed.configureTestingModule() so nothing to do here
    if (configureTestingModuleCall == null) {
        return [];
    } else {
        // find the parent that holds the TestBed call and its beginning ? or just setup()?
        // if a setup is already called take the name (standard builder)
        // else call const builder = setup(); and name is 'builder'
        const params = configureTestingModuleCall.getChildren().find(p => p.getText().match(/providers\s*:/) != null);
        // params is the { declarations: [AppComponent], providers: [Service, anotherService]}

        // case - when no providers - create
        // case when providers - the end position -1 (to include the new providers there)
        // for every parameter that has a type which is not part of the already  provided add a {provide: ${p.type}, useValue: ${builder}.${p.name}}
        _printKindAndText(params as any);
        return [];
    }
}

//@ts-ignore
function _printKindAndText(node: ts.Node) {
    // tslint:disable-next-line:no-console
    console.log(ts.SyntaxKind[node.kind], node.getText(), EOL);
}
