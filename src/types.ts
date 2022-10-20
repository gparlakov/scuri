import {
    camelize,
    capitalize,
    classify,
    dasherize,
    decamelize,
    levenshtein,
    underscore,
} from '@angular-devkit/core/src/utils/strings';

/**
 * When the class-under-test(or function-under-test) uses a dependency
 * this data structure will hold the metadata about that use (method call or property use)
 *
 * @example
 * ```ts
 * class MyService {
 *  aProperty$: BehaviorSubject<Array<string>>;
 *
 *  aMethod(): Promise<Person>;
 *  another(): Observable<Iterable<Person[]>>
 * }
 *
 * class ClassUnderTest {
 *  constructor(private m: MyService) {}
 *
 *  onInit() {
 *      this.m.another.pipe(
 *          switchMapTo(this.m.aMethod),
 *          switchMapTo(this.aProperty$),
 *      )
 *  }
 * }
 * ```
 */
export interface DependencyCallDescription {
    /** The name of the dep method/prop - in the example above that would be `aProperty$`, `aMethod` and `another`  */
    name: string;

    /**
     * What is it - function or property. In the example above:
     *  - `aProperty$` is a 'property'
     *  - `aMethod` and `another` are 'function'-s
     */
    signature: 'function' | 'property';

    /**
     * What kind of type is it - observable promise or another type. In the example above:
     *  - `aProperty$` and `another` are 'observable'
     *  - `aMethod`  are 'promise'-s
     */
    kind: 'observable' | 'promise' | 'other';

    /**
     * The TypeScript Type verbatim. In the example above:
     *  - `aProperty$: BehaviorSubject<Array<string>>;`
     *  - `aMethod(): Promise<Person>;`
     *  - `another(): Observable<Iterable<Person[]>>`
     */
    type: string;

    /**
     * The TypeScript Type params. They are interesting for the creating an Observable that covers the same type. In the example above:
     *  - `aProperty$: Array<string>`
     *  - `aMethod(): Person`
     *  - `another(): Iterable<Person[]>`
     */
    typeParams: string[];
}

export type DependencyTypeName = string;

export type DependencyPropertyName = string;

export type DependencyCall = DependencyCallDescription;

export type DependencyMethodReturnAndPropertyTypes = Map<DependencyTypeName, Map<DependencyPropertyName, DependencyCall>>;

export type ClassDescription = {
    type: 'class';
    name: string;
    constructorParams: ConstructorParam[];
    publicMethods: string[];

    depsCallsAndTypes?: DependencyMethodReturnAndPropertyTypes;
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

    setupMethods: TemplateFunction[];
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

export type TemplateFunction = (joiner: string) => string;
