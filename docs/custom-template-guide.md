# How to use custom templates with SCuri

Working starter templates: 
- **Class** custom template (**create** and **update**)  - [link](https://gist.github.com/gparlakov/f299011829e229c9d37cf0cb38506d97) 
- **Function** custom template (**create**) - [link](https://gist.github.com/gparlakov/0b9b94f8140687bb3b1db1772503bd0d) 

## Templates 

SCuri comes out of the box with a set of templates for generating and updating specs for classes and functions. When using scuri with the following command:

```sh
schematics scuri:spec --name src/app/core/my-service.ts
```

SCuri will:

- read the `src/app/core/my-service.ts` file
- get its public methods and its constructor dependencies with their import paths
- generate a `src/app/core/my-service.spec.ts` file

The generation step will use a template - the [\_\_specFileName__.template](../src/spec/files/class/__specFileName__.template). 

### Functions

```sh_
schematics scuri:spec --name src/app/core/my-functions.ts
```

In the case there are only functions in `my-functions.ts` SCuri will use a different template - the [\_\_specFileName__.template](../src/spec/files/class/__specFileName__.template) from the functions files.

## Custom templates 

A **custom template** allows users to replace the aforementioned \_\_specFileName__.template with their own implementation. 

```sh
schematics scuri:spec --name src/app/core/my-service.ts --classTemplate templates/__specFileName____.template  
``` 

This will tell scuri to go get the `templates/__specFileName__.template` and use that when generating a spec. 

### Configuration

Yes, there is a [configuration](../readme.md#configuring) `classTemplate` can be provided in that. 

_Note: the command line parameter `--classTemplate` will override the configuration `{classTemplate:...}`_

Here's a gist of a template that details all parameters that are exposed to the template:
- [Class template](https://gist.github.com/gparlakov/f299011829e229c9d37cf0cb38506d97) 
    - [an issue with discussion and example](https://github.com/gparlakov/scuri/issues/32#issuecomment-946332209)
- [Function template](https://gist.github.com/gparlakov/0b9b94f8140687bb3b1db1772503bd0d)

### Update with custom template

SCuri can not know what part of the custom template to use when updating specs so it needs a marker.

#### Markers

- The marker `// scuri:<label1>` that denotes where to place the updated content
    - `// scuri:injectables`
    - `// scuri:lets` 
- The template `// scuri:template:<label1>:<template>` that is the update template for that marker
    - ```html
      /** scuri:template:lets:<%params.forEach(p => {%>let <%= camelize(p.type) %>Spy: <%= p.type %>;
      <% }) %>*/
      ```
      (note the new line)
    - ```html
      /** scuri:template:injectables:<%params.forEach(p => {%>{ provide: <%= p.type %>, useClass: autoSpy(<%= p.type %>, '<%= p.type %>') },
      <% }) %>*/
      ```
- Skip de-duplication by adding `-skip-deDupe` to the label
    - ```html
      /** scuri:template:methods-skipDeDupe:print this out every time you update*/
      ````

When updating with a custom template SCuri
- finds all custom-update-templates and their markers in the spec file
- runs the templates with the constructor params, imports and public method names
- removes the lines that already apper in the spec file (de-duplicates - can be skipped by `-skip-deDupe`)
- adds the updates to your spec file

## Exposed Properties and functions
SCuri exposes some properties like `specFileName` and `params`, and some functions like `camelize` and `classify`:  

### Properties

Properties are strong typed in the [types.ts](../src/types.ts#l35) `ClassTemplateData` and include:

- `publicMethods: string[];` - array of all public methods 
- `params: ConstructorParam[];` - array of all constructor params that have a `type`, `name` and `importPath` 
- `constructorParams: string;` a flattened, comma-separated list of the `params`: for `class My { constructor(r: Router, s: Service) {}}` it's `constructorParams === 'r: Router, s: Service'`
- `className: string;` - the name of the class for `exports class ExampleComponent` it's `ExampleComponent` 
- `specFileName: string;` - the name of the spec file: for `--name ./example/example.component.ts` -> `example.component.spec.ts`
- `normalizedName: string;` - the import name of the class file: for `--name ./example/example.component.ts` its `example.component` // note the lack of extension
- `shorthand?: string;` the first letter of the file name: for `--name .\example\example.component.ts` it's `e`

- `declaration: string;` - [SETUP][CREATE-ONLY] the declaration of the setup properties (see [\_\_specFileName__.template](../src/spec/files/class/__specFileName__.template))

- `builderExports: string;` - [SETUP][CREATE-ONLY] the exports of the setup properties (see [\_\_specFileName__.template](../src/spec/files/class/__specFileName__.template))    
    

### Functions 
SCuri exposes all functions from [@angular-devkit/core/src/utils/strings](https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/core/src/utils/strings.ts) including:
- camelize
- capitalize
- classify
- dasherize
- decamelize
- levenshtein
- underscore

## Custom naming 

When naming the file most of the **properties** and **functions** can be used. The **exceptions** are ~~levenshtein~~, ~~publicMethods~~, ~~params~~. 

Here's a few examples of custom spec file names for `some-example.component.ts` that exports `SomeExampleComponent`:

- `__specFileName__.template` -> `some-example.component.spec.ts`
- `__specFileName__` -> `some-example.component.spec.ts` 
  - same as above as `.template` gets removed
- `__name@dasherize__.myspec.ts.template` -> `some-example-component.myspec.ts`
  - apply the `dasherize` function on the `name` property
- `__name@dasherize__.myspec.ts` -> `some-example-component.myspec.ts` 
  - same as above as `.template` gets removed
- `./tools/scuri/__name@dasherize__.myspec.ts` -> `some-example-component.myspec.ts`
  - the path to the tools folder gets removed
  - the path of the spec file depends on the location of the class-under-test fileEG

## Custom template example
- [Class template](https://gist.github.com/gparlakov/f299011829e229c9d37cf0cb38506d97) 
    - [an issue with discussion and example](https://github.com/gparlakov/scuri/issues/32#issuecomment-946332209)
- [Function template](https://gist.github.com/gparlakov/0b9b94f8140687bb3b1db1772503bd0d)

