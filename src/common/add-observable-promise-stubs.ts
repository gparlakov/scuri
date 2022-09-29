import { EOL } from 'os';
import { ConstructorParam, 
    //DependencyCall, DependencyCallDescription, 
    DependencyMethodReturnAndPropertyTypes } from '../types';

export function addDefaultObservableAndPromiseToSpyJoined(p: ConstructorParam, deps?: DependencyMethodReturnAndPropertyTypes, options?: DefaultMethodReturnsOptions): string {
    if(!deps?.has(p.type)) {
        return ''
    }
    const joiner = typeof options?.joiner === 'string' ? options?.joiner : EOL;

    return `${typeof joiner === 'string'? joiner : ''}${addDefaultObservableAndPromiseToSpy(p, deps, options).join(joiner)}`;
}

export function addDefaultObservableAndPromiseToSpy(p: ConstructorParam, deps?: DependencyMethodReturnAndPropertyTypes, options?: DefaultMethodReturnsOptions): string[] {
    if(!deps?.has(p.type)) {
        return []
    }
    const spyReturn = (v: string) => options?.spyReturnType === 'jest' ? `.mockReturnValue(${v})` : `.and.returnValue(${v})`;
    const dep = deps.get(p.type);
    const observables = Array.from(dep!.entries())
        .filter(([_, value]) => typeof value === 'string' ? value.match(/Observable<|Subject</) : (value?.kind === 'observable' && value?.signature === 'function'))
        .map(([key,]) => `${p.name}.${key}${spyReturn('EMPTY')};`);

    const promises = Array.from(dep!.entries())
        .map(([key, value]) => {
            return [key, value];
        })
        .filter(([_, value]) => typeof value === 'string' ? value.match(/Promise</) : (value?.kind === 'promise' && value?.signature === 'function'))
        .map(([key]) => `${p.name}.${key}${spyReturn('new Promise(res => {})')};`);
    return [...observables, ...promises];
}

interface DefaultMethodReturnsOptions {
    joiner?: string;
    spyReturnType?: 'jasmine' | 'jest';
}

export function listAllDefaultReturns(params: ConstructorParam[], deps?: DependencyMethodReturnAndPropertyTypes, options?: DefaultMethodReturnsOptions) {
    return params.flatMap(p => addDefaultObservableAndPromiseToSpy(p, deps, options))
}

export function addDefaultPropStubs(params: ConstructorParam[], deps?: DependencyMethodReturnAndPropertyTypes, _?: DefaultMethodReturnsOptions) {
    if(deps == null || params?.length < 1) {
        return {}
    }
    // params.map(p => {
    //     const d = deps.get(p.type) ?? new Map<string, DependencyCall> ();
    //     const declarations = Array.from(d.entries())
    //         .filter(([_, depCall]) => typeof depCall !== 'string' && depCall.signature === 'property')
    //         .map(([prop, depCall]: [string, DependencyCallDescription]) => `const ${prop.replace('$', '')}$: ReplaySubject<${depCall.type}> = new ReplaySubject(1)`);
    // })
}
