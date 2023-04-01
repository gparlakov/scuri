import { EOL } from 'os';
import * as ts from 'typescript';
import { findNodes, insertImport, isImported } from '../../../lib/utility/ast-utils';
import { Change, InsertChange, RemoveChange } from '../../../lib/utility/change';
import {
    addDefaultObservableAndPromiseToSpy,
    addDefaultObservableAndPromiseToSpyJoined,
    createSetupMethodsFn,
    includePropertyMocks,
    propertyMocks,
} from '../../common/add-observable-promise-stubs';
import { buildErrorForMissingSwitchCase } from '../../common/build-time-error-for-missing-switch-case';

import { dependenciesWrap } from '../../common/deps-filtered';
import { getLogger } from '../../common/logger';
import { ConstructorParam, DependencyMethodReturnAndPropertyTypes } from '../../types';

export interface UpdateOptions {
    framework: 'jasmine' | 'jest';
}

export interface DepMethodsAdditionsOptions {
    source: ts.SourceFile;
    allParams: ConstructorParam[];
    path: string;
    deps: DependencyMethodReturnAndPropertyTypes | undefined;
    framework: UpdateOptions['framework'];
}

export interface AddDepPropsMockOptions {
    source: ts.SourceFile;
    allParams: ConstructorParam[];
    path: string;
    deps: DependencyMethodReturnAndPropertyTypes | undefined;
}



export function addMissing(
    path: string,
    source: ts.SourceFile,
    _dependencies: ConstructorParam[],
    classUnderTestName: string
) {
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
    source: ts.SourceFile,
    dependencies: ConstructorParam[],
    classUnderTestName: string,
    action: 'add' | 'remove' | 'add-spy-methods-and-props',
    publicMethods: string[],
    shorthand: string,
    deps: DependencyMethodReturnAndPropertyTypes | undefined,
    options: UpdateOptions
): Change[] {
    const log = getLogger(update.name);
    log.debug(`[action: ${action}] path:${path} ${classUnderTestName} params ${dependencies.map(d => `${d.name}: ${d.type}`).join()} publicMethods ${publicMethods.join(',')}  deps ${JSON.stringify(deps)} options ${JSON.stringify(options)}` )

    const setupFunctionNode = readSetupFunction(source);
    if (setupFunctionNode == null) {
        log.error("There is no setup function in the source file. We can't update that.");
        throw new Error("There is no setup function in the source file. We can't update that.");
    }

    const currentParams = readCurrentParameterNames(setupFunctionNode, classUnderTestName);
    const paramsToRemove = currentParams.filter((p) => !dependencies.some((d) => d.name === p));
    const paramsToAdd = dependencies.filter((d) => !currentParams.some((c) => c === d.name));

    log.debug(`Current params (${currentParams?.length}):${currentParams?.join(',')}`)
    log.debug(`Params to remove (${paramsToRemove?.length}):${paramsToRemove?.join(',')}`)
    log.debug(`Params to add (${paramsToAdd?.length}):${JSON.stringify(paramsToAdd)}`)

    switch (action) {

        case 'remove': return remove(paramsToRemove, setupFunctionNode, path);

        case 'add': return [
            // ordered as additions from the bottom of the file up
            // 1 the lowest - additions to the setup function
            ...add(paramsToAdd, setupFunctionNode, path, classUnderTestName, deps),
            // 2 additions to the setup function again
            ...addMissingDependencyReturns(
                paramsToAdd,
                paramsToRemove,
                deps,
                dependencies,
                setupFunctionNode,
                options
            ),
            // 3 methods - each of them will generate a it test case
            ...addMethods(publicMethods, path, source.getFullText(), source, shorthand),
            // 4 providers - if TestBed is used it will get the providers from a = setup().default() and provide them the classic Angular way
            ...addProvidersForTestBed(
                source,
                dependencies,
                setupFunctionNode.name!.getText() || 'setup',
                path
            ),
            // 5 add the missing imports on the top
            ...addMissingImports(dependencies, path, source),
        ];

        case 'add-spy-methods-and-props': return [
            ...addDepReturnsMethods({ allParams: dependencies, path, source, deps, framework: options.framework }),
            ...addDepPropsMocks({ allParams: dependencies, path, source, deps })
        ]

        default: buildErrorForMissingSwitchCase(action, `Unhandled action ${action}`);
    }
}

function readSetupFunction(source: ts.Node) {
    // FunctionDeclaration -> function setup () {/*body*/ }
    return (findNodes(source, ts.SyntaxKind.FunctionDeclaration) as ts.FunctionDeclaration[]).find(
        (n) => n.name != null && n.name.text.startsWith('setup')
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
        (node) =>
            node.kind === ts.SyntaxKind.NewExpression && node.getText().includes(classUnderTestName)
    ) as ts.NewExpression;

    //  SyntaxList -> dep1,dep2
    const parametersList = findNodes(
        instantiateClassUnderTestNode,
        ts.SyntaxKind.SyntaxList
    )[0] as ts.SyntaxList;

    // Array -> ['dep1', 'dep2']
    const parameterNames = findNodes(parametersList, ts.SyntaxKind.Identifier).map((n) =>
        n.getText()
    );

    return parameterNames;
}
function remove(toRemove: string[], setupFunction: ts.FunctionDeclaration, path: string) {
    const logger = getLogger(remove.name);
    logger.debug(`Entering for ${toRemove.join()} at ${path}`)
    // VariableStatement -> let dep:string; Or const service = autoSpy(Object);
    const instantiations = findNodes(setupFunction, ts.SyntaxKind.VariableStatement).filter(
        (n: ts.VariableStatement) =>
            n.declarationList.declarations.some((v) => toRemove.includes(v.name.getText()))
    );
    const uses = findNodes(setupFunction, ts.SyntaxKind.Identifier)
        .filter((i) => !i.parent || i.parent.kind !== ts.SyntaxKind.VariableDeclaration)
        .filter((i) => toRemove.includes((i as ts.Identifier).getText()));

    return instantiations
        .concat(uses)
        .map((i) => {
            logger.debug(`RemoveChange(${i.pos}, ${getTextPlusCommaIfNextCharIsComma(i).replace(/\n\r|\r\n|\n/, '┘')})`)
            return new RemoveChange(path, i.pos, getTextPlusCommaIfNextCharIsComma(i));
        });
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
    classUnderTestName: string,
    deps?: DependencyMethodReturnAndPropertyTypes,
): Change[] {
    // children of the setup include the block - that's what we want to change
    const block = getSetupFunctionBlock(setupFunction);

    return [
        ...useNewDependenciesInConstructor(block, toAdd, path, classUnderTestName),
        ...exposeNewDependencies(setupFunction, toAdd, path),
        ...declareNewDependencies(block, toAdd, path, deps),
    ];
}


function addDepReturnsMethods({
    allParams,
    source,
    path,
    deps,
    framework
}: DepMethodsAdditionsOptions
): InsertChange[] {
    // no dependency methods/properties used found - nothing to do here
    if ([...deps?.entries() ?? []].length === 0) {
        return [];
    }

    const setupFunctionNode = readSetupFunction(source);
    if (setupFunctionNode == null) {
        throw new Error("There is no setup function in the source file. We can't update that.");
    }

    const { indentation, endBracketPosition: position, builderObjectLiteral, syntaxListEndsWithComma, syntaxEndPosition } = getBuilderBlockMeta(setupFunctionNode);

    const commaMaybe = new InsertChange(path, syntaxEndPosition, syntaxListEndsWithComma ? '' : `,${EOL}${indentation}`);
    const blockText = builderObjectLiteral.getText();
    return [
        commaMaybe,
        ...createSetupMethodsFn(
            allParams,
            deps,
            {
                spyReturnType: framework,
                shouldSkip: (method, prop) => blockText.includes(method) || blockText.includes(prop),
            })
            .map((fn) => fn(`${EOL}${indentation}`))
            .map(method => new InsertChange(path, position, method))
    ];

}

function addDepPropsMocks({
    allParams,
    source,
    path,
    deps
}: AddDepPropsMockOptions): InsertChange[] {

    // no dependency methods/properties used found - nothing to do here
    if ([...deps?.entries() ?? []].length === 0) {
        return [];
    }

    const setupFunctionNode = readSetupFunction(source);
    if (setupFunctionNode == null) {
        throw new Error("There is no setup function in the source file. We can't update that.");
    }
    const ds = dependenciesWrap(deps);

    return allParams
        //finds the node with the dependency autoSpy (probably) declaration
        .map(p => {
            return [p, findNodes(
                setupFunctionNode,
                (n): n is ts.Node => n.kind === ts.SyntaxKind.VariableDeclaration
            )
                .find(n => n.getText().match(new RegExp(`${p.name}.*${p.type}`)))]
        })
        .filter((v): v is [ConstructorParam, ts.Node] => v[1] != null)
        // order closest to the end of file first b/c we want to insert changes from the bottom up
        .sort(([, n1], [,n2]) => (n2.pos ?? 0) - (n1?.pos ?? 0))

        .flatMap(([p, n]) => {
            const text = n.getText();
            const somePropsAdded =  text.includes('{');
            const insertPoint = (somePropsAdded
                ? findNodes(n, ts.isObjectLiteralExpression)[0].getLastToken()?.getStart()
                : n.getLastToken()?.getStart()
            ) ?? (n.getEnd() - 2);
            return [
                // skip props that are already added in the setup fn
                new InsertChange(path, n.parent.getStart(),
                    propertyMocks(
                        p,
                        ds.skip(dep => text.includes(dep.name)), // when the name of the prop is part of the definition means it has already been provided to autoSpy and can be skipped
                        {joiner: `${EOL}${getIndentationMinusComments(n!)}`}
                    )
                ),

                // add the declared props to the autoSpy call expression and calculate whether to add ',{}' or just ','
                new InsertChange(path,
                    insertPoint,
                    includePropertyMocks(
                        p,
                        deps,
                        /*skipWhen*/ depOrObj => depOrObj === 'checkShouldSkipObjectWrapper'
                            ? somePropsAdded
                            : text.includes(depOrObj.name)
                    )
                )
            ];
        });
}

const typesLikelyToChange = ['string', 'boolean', 'number', 'any', 'unknown', 'Object'];

function declareNewDependencies(
    setupFnBlock: ts.Block,
    toAdd: ConstructorParam[],
    path: string,
    deps?: DependencyMethodReturnAndPropertyTypes
) {
    // children of the block are the opening { [at index [0]], the block content (SyntaxList) [at index[1]] and the closing } [index [2]]
    // we want to update the SyntaxList
    const setupBlockContent = setupFnBlock.getChildAt(1);

    // leading because it includes the end-of-line from previous line plus indentation on current line
    const leadingIndent = getIndentationMinusComments(setupBlockContent);

    const position = setupBlockContent.getStart();
    return toAdd.map(
        (p) =>
            // if we are 'mocking' a simple/native type - let c: string; / let c: Object; - leave the instantiation till later
            // if it's a complex type -> const c = autoSpy(Service);
            new InsertChange(
                path,
                position,
                typesLikelyToChange.includes(p.type)
                    ? `let ${p.name}: ${p.type};${EOL}${leadingIndent}`
                    : `const ${p.name} = autoSpy(${p.type
                    });${addDefaultObservableAndPromiseToSpyJoined(p, deps, {
                        joiner: `${EOL}${leadingIndent}`,
                    })}${EOL}${leadingIndent}`
            )
    );
}

function exposeNewDependencies(block: ts.FunctionDeclaration, toAdd: ConstructorParam[], path: string) {
    const { positionToAdd, indentation } = getBuilderBlockMeta(block);
    return toAdd.map(
        (a) => new InsertChange(path, positionToAdd, `${EOL}${indentation}${a.name},`)
    );
}


function getSetupFunctionBlock(setupFunction: ts.FunctionDeclaration) {
    const block = setupFunction
        .getChildren()
        .find((c) => c.kind === ts.SyntaxKind.Block) as ts.Block;
    if (block == null) {
        throw new Error('Could not find the block of the setup function.');
    }
    return block;
}

function getBuilderBlockMeta(setupFunctionNode: ts.FunctionDeclaration) {
    const setupBlock = getSetupFunctionBlock(setupFunctionNode);
    const builderDeclaration = findNodes(setupBlock, ts.SyntaxKind.VariableDeclaration).find((v) => (v as ts.VariableDeclaration).name.getFullText().includes('builder')
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
    const childrenReversed = builderObjectLiteral.getChildren().reverse();
    const lastChildPosition = childrenReversed[0].getStart();
    const syntaxListEndsWithComma = childrenReversed[1]?.getText()?.endsWith(',');
    const syntaxEndPosition = childrenReversed[1].getEnd();
    return { positionToAdd, indentation, builderDeclaration, builderObjectLiteral, endBracketPosition: lastChildPosition, syntaxListEndsWithComma, syntaxEndPosition };
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
                (hasOtherParams ? ', ' : '') + toAdd.map((p) => p.name).join(', ')
            ),
        ]
        : []; // don't add params in constructor if no need to
}

function addMethods(
    publicMethods: string[],
    path: string,
    fileContent: string,
    source: ts.SourceFile,
    shorthand: string
): Change[] {
    const logger = getLogger(addMethods.name)
    logger.debug(`Entering for ${path} ${JSON.stringify(publicMethods)}`)
    const methodsThatHaveNoTests = publicMethods.filter(
        // search for invocations of the method 'c.myMethod('  - these are inevitable if one wants to actually test the method...
        (m) => !fileContent.match(new RegExp(`\\.${m}`))
    );

    logger.debug(`methods w/o tests ${methodsThatHaveNoTests.join(',')}`)


    let lastClosingBracketPositionOfDescribe = findNodes(
        source,
        ts.SyntaxKind.CallExpression,
        100,
        true
    )
        .map((e) => (e as ts.CallExpression).expression)
        // we get all describes calls
        .filter((i) => i.getText() === 'describe')
        // then their parent - the expression (it has the body with the curly brackets)
        .map((c) => c.parent)
        // then we flat the arrays of all close brace tokens from those bodies
        .reduce(
            (acc, c) => [...acc, ...findNodes(c, ts.SyntaxKind.CloseBraceToken, 100, true)],
            [] as ts.Node[]
        )
        // finally get the last brace position
        .reduce((lastClosingBracket, n) => {
            return n.pos > lastClosingBracket ? n.pos : lastClosingBracket;
        }, 0);

    return methodsThatHaveNoTests.map(
        (m) =>
            new InsertChange(
                path,
                lastClosingBracketPositionOfDescribe,
                `${EOL}    it('when ${m} is called it should', () => {${EOL}        // arrange${EOL}        const { build } = setup().default();${EOL}        const ${shorthand} = build();${EOL}        // act${EOL}        ${shorthand}.${m}();${EOL}        // assert${EOL}        // expect(${shorthand}).toEqual${EOL}    });`
            )
    );
}

function addMissingImports(dependencies: ConstructorParam[], path: string, source: ts.SourceFile) {
    // build a map of duplicate/first for each entry, based on the whether or not `previous` contains the elements
    const { duplicateMap } = dependencies.reduce(
        (r, n) => {
            r.duplicateMap.set(
                n,
                r.previous.some((p) => p.type === n.type && p.importPath === n.importPath)
                    ? 'duplicate'
                    : 'first'
            );
            r.previous = [...r.previous, n];
            return r;
        },
        {
            previous: [] as ConstructorParam[],
            duplicateMap: new Map<ConstructorParam, 'duplicate' | 'first'>(),
        }
    );

    return dependencies
        .filter((d) => d.importPath != null)
        .filter((d) => duplicateMap.get(d) === 'first')
        .filter((d) => !isImported(source, d.type, d.importPath!))
        .map((d) => insertImport(source, path, d.type, d.importPath!));
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
function addProvidersForTestBed(
    source: ts.SourceFile,
    params: ConstructorParam[],
    setupFunctionName: string,
    path: string
) {
    const configureTestingModuleCall = findNodes(source, ts.SyntaxKind.CallExpression, 5000, true)
        // reverse to find the innermost callExpression (the configureTestingModule)
        .reverse()
        .find((n) => {
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
        const setupInstance = findNodes(block, ts.SyntaxKind.VariableDeclaration).find((n) =>
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
                    `${EOL}${firstChildIndentation}const ${a} = ${setupFunctionName}().default();`
                ),
            ]
            : [];

        // calculate which dependencies we need to add
        const configureText = configureTestingModuleCall.getText();
        const depsToAdd = params.filter((p) => !configureText.includes(p.type));

        // and then add all missing deps in one configureTestingModule call with providers only
        if (depsToAdd.length > 0) {
            const newProviders = depsToAdd
                .map((d) => `{ provide: ${d.type}, useValue: ${a}.${d.name} }`)
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
    const lastWhitespace = leadingTrivia.match(/[^\r\n]*$/g);
    return lastWhitespace ? lastWhitespace[0] : '';
}

function addMissingDependencyReturns(
    paramsToAdd: ConstructorParam[],
    paramsToRemove: string[],
    deps: DependencyMethodReturnAndPropertyTypes | undefined,
    allParams: ConstructorParam[],
    setupFunctionNode: ts.FunctionDeclaration,
    updateOptions: UpdateOptions
): InsertChange[] {
    const setupText = setupFunctionNode.getFullText();

    const builderStatement = findNodes(setupFunctionNode, ts.SyntaxKind.VariableStatement).find(
        (n) => n.getText().includes('builder')
    );
    const pos = builderStatement?.pos ?? setupFunctionNode.pos + 65;

    const indent = builderStatement ? getIndentationMinusComments(builderStatement) : '    ';
    const wrap = dependenciesWrap(deps);
    return (
        allParams
            // skip the add ones as they'll get their own methods in the exposeDeps above
            .filter((p) => !paramsToAdd.some((toAdd) => toAdd.name === p.name))
            // skip the remove ones as they'll get removed and adding their deps is moot
            .filter((p) => !paramsToRemove.includes(p.name))
            // for the params that are part of the deps map
            .filter((p) => deps?.has(p.type))
            // create the lines of code to return a default value => `${p.name}.${dep.method}.and.returnValue({promise|observable default})
            .flatMap((p) => {
                // skip dependencies that have already been included
                const ds = wrap.skip(d => setupText.includes(`${p.name}.${d.name}`));
                return addDefaultObservableAndPromiseToSpy(p, ds, {spyReturnType: updateOptions?.framework});
            })
            // only take the ones that are not already there
            .filter((defaultReturnExpression) => !setupText.includes(defaultReturnExpression))
            // and create InsertChange-s for them
            .map(
                (defaultReturnExpression, i, arr) =>
                    new InsertChange(
                        '',
                        pos,
                        `${EOL}${indent}${defaultReturnExpression}${arr.length - 1 === i ? `${EOL}${indent}` : ''
                        }`
                    )
            )
    );
}

// function getPositionToInsert
