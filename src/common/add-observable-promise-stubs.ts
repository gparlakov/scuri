import { EOL } from 'os';
import { ConstructorParam, DependencyMethodReturnTypes } from '../types';

export function addDefaultObservableAndPromiseToSpy(p: ConstructorParam, deps?: DependencyMethodReturnTypes, joinWith?: string): string {
    if(!deps?.has(p.type)) {
        return ''
    }
    const joiner = typeof joinWith === 'string' ? joinWith : EOL;
    const dep = deps.get(p.type);
    const observables = Array.from(dep!.entries())
        .filter(([_, value]) => value.match(/Observable<|Subject</))
        .map(([key,]) => `${p.name}.${key}.and.returnValue(EMPTY)`)
        .join(joiner)

    const promises = Array.from(dep!.entries())
        .map(([key, value]) => {
            return [key, value];
        })
        .filter(([_, value]) => value.match(/Promise</))
        .map(([key]) => `${p.name}.${key}.and.returnValue(new Promise(res => {}))`)
        .join(joiner);
    return `${typeof joinWith === 'string'? joinWith : ''}${observables}${joiner}${promises}`;
}