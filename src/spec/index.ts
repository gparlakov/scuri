import { strings } from "@angular-devkit/core";
import {
  apply,
  template,
  branchAndMerge,
  mergeWith,
  Rule,
  SchematicContext,
  Tree,
  url
} from "@angular-devkit/schematics";

class SpecOptions {
  name: string;
  param: string[];
}

export function spec(options: SpecOptions): Rule {
  // take one or multiple specified param(s) or an empty array of those
  const specifiedParams = options.param
    ? Array.isArray(options.param)
      ? options.param
      : [options.param]
    : [];

  // turn them  from <name,type> (i.e. 'my:HttpClient') into the type {name: string, type: string } i.e. name: 'my', type:'HttpClient'
  const params = specifiedParams
    .map(p => p.split(":"))
    .map(split => ({ name: split[0], type: split[1] }));

  return (_: Tree, _context: SchematicContext) => {

    // todo next steps
    // read the file passed in with the name - i.e. test or test.component.ts or test.service.ts or test.directive.ts (or some else)
    // then turn the component's parameters into params here
    // then run the schematic

    const templateSource = apply(url("../files"), [
      template({
        classify: strings.classify,
        name: options.name,
        params: params,
        toConstructorParams,
        toDeclaration,
        toBuilderExports,
        dasherize: strings.dasherize
      })
    ]);

    return branchAndMerge(mergeWith(templateSource));
  };

  function toConstructorParams() {
    return params.map(p => p.name).join(",");
  }

  function toDeclaration() {
    return params.map(p => `const ${p.name} = autoSpy(${p.type})`).join("/n");
  }

  function toBuilderExports() {
    return params.length > 0
      ? params
          .map(p => p.name)
          .join(",/n")
          .concat(",")
      : "";
  }
}
