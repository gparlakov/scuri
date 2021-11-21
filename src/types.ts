import {
    camelize,
    capitalize,
    classify,
    dasherize,
    decamelize,
    levenshtein,
    underscore,
} from '@angular-devkit/core/src/utils/strings';

export type ClassDescription = {
    type: 'class';
    name: string;
    constructorParams: ConstructorParam[];
    publicMethods: string[];
};

export type ConstructorParam = {
    name: string;
    type: string;
    importPath?: string;
};

export type FunctionDescription = {
    type: 'function';
    name: string;
};

export function isClassDescription(obj: Description): obj is ClassDescription {
    return obj != null && obj.type === 'class';
}

export type Description = ClassDescription | FunctionDescription;

export type ClassTemplateData = StringsFunctions & {
    publicMethods: string[];
    params: ConstructorParam[];
    /**
     * @example
     * for --name .\example\example.component.ts
     * exporting:
     * ```
     * exports class ExampleComponent
     * ```
     *
     * className is `ExampleComponent`
     *
     */
    className: string;
    // same as className
    name: string;

    /**
     * @example
     * for --name .\example\path\example.component.ts
     *
     * folder is example/path
     *
     */
     folder: string;

    /**
     * @example
     * for --name ./example/example.component.ts
     *
     * specFileName is `example.component.spec.ts`
     *
     */
    specFileName: string;

    /**
     * @example
     * for --name ./example/example.component.ts
     *
     * normalizedName is `example.component` // note the lack of extension
     *
     */
    normalizedName: string;

    /**
     * @example
     * for --name .\example\example.component.ts
     * exporting:
     *
     * ```
     * exports class ExampleComponent
     * ```
     *
     * shorthand is `e`
     *
     */
    shorthand?: string;

    /**
     * Flattened comma separated list of constructor params
     * @example
     * ```ts
     * class My { constructor(r: Router, s: Service) {}}
     * ```
     * constructorParams === 'r: Router, s: Service'
     */
    constructorParams: string;

    declaration: string;

    builderExports: string;
};

type StringsFunctions = {
    decamelize: typeof decamelize;
    dasherize: typeof dasherize;
    camelize: typeof camelize;
    classify: typeof classify;
    underscore: typeof underscore;
    capitalize: typeof capitalize;
    levenshtein: typeof levenshtein;
};
