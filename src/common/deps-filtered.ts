import {
    DependencyCallDescription,
    DependencyMethodReturnAndPropertyTypes,
} from '../types';

export function depsFiltered(
    deps: DependencyMethodReturnAndPropertyTypes | undefined,
    skip: (d: DependencyCallDescription) => boolean
): DependencyMethodReturnAndPropertyTypes | undefined {
    if (deps == null || !(deps instanceof Map)) {
        return deps;
    }
    // prettier-ignore
    return new Map(
        [...deps.entries()]
            .map(([key, value]) => ([
                key, new Map(
                    [...value.entries()].filter(([, dep]) => !skip(dep))
                )
            ])
        )
    );
}


export function dependenciesWrap(ds: DependencyMethodReturnAndPropertyTypes | undefined) {

    return {
        skip(skipWhere: (d: DependencyCallDescription) => boolean) {
            return depsFiltered(ds, skipWhere)
        }
    }
}
