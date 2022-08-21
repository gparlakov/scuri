import { EOL } from 'os';
import { ConstructorParam, DependencyMethodReturnTypes } from '../types';

export function addDefaultObservableAndPromiseToSpyJoined(p: ConstructorParam, deps?: DependencyMethodReturnTypes, options?: DefaultMethodReturnsOptions): string {
    if(!deps?.has(p.type)) {
        return ''
    }
    const joiner = typeof options?.joiner === 'string' ? options?.joiner : EOL;
    
    return `${typeof joiner === 'string'? joiner : ''}${addDefaultObservableAndPromiseToSpy(p, deps, options).join(joiner)}`;
}

export function addDefaultObservableAndPromiseToSpy(p: ConstructorParam, deps?: DependencyMethodReturnTypes, options?: DefaultMethodReturnsOptions): string[] {
    if(!deps?.has(p.type)) {
        return []
    }
    const spyReturn = (v: string) => options?.spyReturnType === 'jest' ? `.mockReturnValue(${v})` : `.and.returnValue(${v})`;
    const dep = deps.get(p.type);
    const observables = Array.from(dep!.entries())
        .filter(([_, value]) => value.match(/Observable<|Subject</))
        .map(([key,]) => `${p.name}.${key}${spyReturn('EMPTY')}`);

    const promises = Array.from(dep!.entries())
        .map(([key, value]) => {
            return [key, value];
        })
        .filter(([_, value]) => value.match(/Promise</))
        .map(([key]) => `${p.name}.${key}${spyReturn('new Promise(res => {})')}`);
    return [...observables, ...promises];
}

interface DefaultMethodReturnsOptions {
    joiner?: string;
    spyReturnType?: 'jasmine' | 'jest';
}

export function listAllDefaultReturns(params: ConstructorParam[], deps?: DependencyMethodReturnTypes, options?: DefaultMethodReturnsOptions) {
    return params.flatMap(p => addDefaultObservableAndPromiseToSpy(p, deps, options))
}