import { classify } from '@angular-devkit/core/src/utils/strings';
import { EOL } from 'os';
import {
    ConstructorParam,
    DependencyCallDescription,
    DependencyMethodReturnAndPropertyTypes,
    TemplateFunction,
} from '../types';
import { buildErrorForMissingSwitchCase } from './build-time-error-for-missing-switch-case';

interface DefaultMethodReturnsOptions {
    joiner?: string;
    spyReturnType?: 'jasmine' | 'jest';
}

export function addDefaultObservableAndPromiseToSpyJoined(
    p: ConstructorParam,
    deps?: DependencyMethodReturnAndPropertyTypes,
    options?: DefaultMethodReturnsOptions
): string {
    if (!deps?.has(p.type)) {
        return '';
    }
    const joiner = typeof options?.joiner === 'string' ? options?.joiner : EOL;

    return `${typeof joiner === 'string' ? joiner : ''}${addDefaultObservableAndPromiseToSpy(
        p,
        deps,
        options
    ).join(joiner)}`;
}

export function addDefaultObservableAndPromiseToSpy(
    p: ConstructorParam,
    deps?: DependencyMethodReturnAndPropertyTypes,
    options?: DefaultMethodReturnsOptions
): string[] {
    if (!deps?.has(p.type) || deps.get(p.type) == null) {
        return [];
    }
    // with the above we ensure the dep is in the map so we ! to tell that to TS
    const dep = deps.get(p.type)!;

    const spyReturn = getSpyReturnBasedOnTestingFramework(options);

    const empty = '----------------empty-----------------';
    return Array.from(dep.entries())
        .map(([key, value]) => {
            // only add for the functions (properties are added inline of the autoSpy)
            if (value.signature != 'function') {
                return empty;
            }

            switch (value.kind) {
                case 'observable':
                    return `${p.name}.${key}${spyReturn('EMPTY')};`;
                case 'promise':
                    return `${p.name}.${key}${spyReturn('new Promise(res => {})')};`;
                case 'other':
                    return empty;
                default:
                    buildErrorForMissingSwitchCase(value.kind, `unhandled kind ${value.kind}`);
            }
        })
        .filter((v) => v !== empty);
}

export function propertyMocks(
    p: ConstructorParam,
    depsCallsAndTypes: DependencyMethodReturnAndPropertyTypes | undefined,
    o?: DefaultMethodReturnsOptions
): string {
    if (depsCallsAndTypes?.get(p.type)?.entries() == null) {
        return '';
    }
    const joiner = typeof o?.joiner === 'string' ? o.joiner : EOL;
    const w = joinerWhitespace(joiner, '    ');

    const dep = depsCallsAndTypes?.get(p.type);
    return Array.from(dep!.keys())
        .map((propOrMethod) => {
            const depMeta = dep?.get(propOrMethod);

            if (depMeta == null || depMeta.kind === 'other' || depMeta.signature === 'function') {
                return undefined;
            } else {
                const { name } = depMeta;
                const Name = `${classify(p.name)}${classify(name)}`;
                const name$ = observablePropName(p.name, depMeta.name);
                const promiseName = promisePropName(p.name, depMeta.name);
                const type = depMeta.typeParams[0];
                const nl = joiner;
                switch (depMeta.kind) {
                    case 'observable':
                        // prettier ignore
                        return `const ${name$} = new ReplaySubject<${type}>(1);`;
                    case 'promise':
                        // prettier ignore
                        return `const resolve${Name}: Function;${nl}const reject${Name}: Function;${nl}const ${promiseName} = new Promise((res, rej) => {${nl}${w}${resolveName(
                            name
                        )} = res;${nl}${w}${rejectName(name)} = rej;${nl}});`;
                    default:
                        return buildErrorForMissingSwitchCase(
                            depMeta.kind,
                            `unhandled kind of metadata ${depMeta.kind}`
                        );
                }
            }
        })
        .filter((v) => v !== undefined)
        .join(joiner)
        .concat(joiner);
}

export function includePropertyMocks(
    p: ConstructorParam,
    depsCallsAndTypes: DependencyMethodReturnAndPropertyTypes | undefined,
    skipWhen?: (dep: DependencyCallDescription | 'checkShouldSkipObjectWrapper') => boolean
): string {
    if (depsCallsAndTypes?.get(p.type)?.entries() == null) {
        return '';
    }

    const skip = typeof skipWhen === 'function' ? skipWhen : () => false;
    const dep = depsCallsAndTypes?.get(p.type);
    const r = Array.from(dep!.keys())
        .map((propOrMethod) => {
            const depMeta = dep?.get(propOrMethod);

            if (depMeta == null || depMeta.kind === 'other' || depMeta.signature === 'function') {
                return undefined;
            }

            if (skip(depMeta)) {
                return undefined;
            }

            return depMeta.kind === 'observable'
                ? `${depMeta.name}: ${observablePropName(p.name, depMeta.name)}`
                : `${depMeta.name}: ${promisePropName(p.name, depMeta.name)}`;
        })
        .filter((r) => r != undefined)
        .join(', ');

    if (r.length === 0) {
        return '';
    }
    if (skip('checkShouldSkipObjectWrapper')) {
        return `, ${r}`;
    }

    return `, { ${r} }`;
}

export function createSetupMethodsFn(
    params: ConstructorParam[],
    depsCallsAndTypes: DependencyMethodReturnAndPropertyTypes | undefined,
    options?: DefaultMethodReturnsOptions & {
        shouldSkip?(methodName: string, propName: string): boolean;
    }
): TemplateFunction[] {
    const skip = typeof options?.shouldSkip === 'function' ? options.shouldSkip : () => false;
    // create an array of functions. Each of those will generate an array of methods
    return params.map((p) => {
        if (depsCallsAndTypes?.get(p.type)?.entries() == null) {
            return () => '';
        }

        return (joiner: string) => {
            const w = joinerWhitespace(joiner, '    ');

            const dep = depsCallsAndTypes?.get(p.type);
            const r = Array.from(dep!.keys())
                // don't do work for missing or void|never methods|props
                .filter(
                    (propOrMethod) =>
                        dep?.get(propOrMethod) != null &&
                        !['void', 'never'].includes(dep.get(propOrMethod)!.type)
                )
                .map((propOrMethod) => {
                    const depMeta = dep?.get(propOrMethod)!;

                    const { name, signature, kind, type, typeParams } = depMeta;
                    const Name = `${classify(p.name)}${classify(name)}`;
                    const otherName = `with${Name}Return`;
                    const otherParam = propOrMethod;
                    const observableMethodName = `with${Name}`;
                    const name$ = observablePropName(p.name, name);

                    const promiseProp = promisePropName(p.name, name);
                    const promiseMethodName = `with${promiseProp}`;
                    const promiseParam = resolveName(name);
                    if (
                        (kind === 'other' && skip(otherName, otherParam)) ||
                        (kind === 'observable' && skip(observableMethodName, name$)) ||
                        (kind === 'promise' && skip(promiseMethodName, promiseParam))
                    ) {
                        return undefined;
                    }

                    const n = name[0];
                    const paramType = typeParams[0];
                    const nl = joiner;

                    if (signature === 'function') {
                        // prettier-ignore
                        return `with${Name}Return(${n}: ${type}) {${
                            nl}${w}${p.name}.${propOrMethod}${getSpyReturnBasedOnTestingFramework(options)(n)};${
                            nl}${w}return builder;${
                        nl}}`;
                    }

                    switch (kind) {
                        case 'observable':
                            // prettier-ignore
                            return `with${Name}(${n}$: Observable<${paramType}>) {${
                                    nl}${w}${n}$.subscribe({${
                                        nl}${w}${w}next: (v) => ${name$}.next(v),${
                                        nl}${w}${w}error: (e) => ${name$}.error(e),${
                                        nl}${w}${w}complete: () => ${name$}.complete()${
                                    nl}${w}});${
                                    nl}${w}return builder;${
                                nl}}`;
                        case 'promise':
                            // prettier-ignore
                            return `with${Name}(${n}: Promise<${paramType}>) {${
                                    nl}${w}${n}${
                                        nl}${w}${w}.then((v) => ${resolveName(promiseProp)}(v))${
                                        nl}${w}${w}.catch((e) => ${rejectName(promiseProp)}(e));${
                                    nl}${w}return builder;${
                                nl}}`;

                        case 'other':
                            // prettier-ignore
                            return `with${Name}(${n}: ${type}) {${
                                nl}${w}${p.name}.${propOrMethod} = ${n};${
                                nl}${w}return builder;${
                            nl}}`;
                        default:
                            buildErrorForMissingSwitchCase(
                                kind,
                                `unhandled kind of metadata ${kind}`
                            );
                    }
                });

            return r.length > 0
                ? r
                      .filter((r) => r != null && r != '')
                      .join(`,${joiner}`)
                      .concat(',')
                : '';
        };
    });
}

function joinerWhitespace(j: string, or: string = ''): string {
    if (typeof j === 'string') {
        const w = j.match(/(\w)/);
        if (w != null) {
            return w[1];
        }
    }

    return or;
}

function ensure$(name: string) {
    return `${name.replace('$', '')}$`;
}
function observablePropName(depName: string, propName: string) {
    return `${depName}${classify(ensure$(propName))}`;
}
function promisePropName(depName: string, propName: string) {
    return `${depName}${classify(propName)}`;
}
function rejectName(name: string) {
    return `reject${classify(name)}`;
}
function resolveName(name: string) {
    return `resolve${classify(name)}`;
}

function getSpyReturnBasedOnTestingFramework(options: DefaultMethodReturnsOptions | undefined) {
    return (v: string) =>
        options?.spyReturnType === 'jest' ? `.mockReturnValue(${v})` : `.and.returnValue(${v})`;
}

export function listAllDefaultReturns(
    params: ConstructorParam[],
    deps?: DependencyMethodReturnAndPropertyTypes,
    options?: DefaultMethodReturnsOptions
) {
    return params.flatMap((p) => addDefaultObservableAndPromiseToSpy(p, deps, options));
}
