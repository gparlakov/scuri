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

import { readClassNamesAndConstructorParams } from "../read/read";

class SpecOptions {
  name: string;
  param: string[];
}

export function spec(options: SpecOptions): Rule {
  const classDescriptions = readClassNamesAndConstructorParams(options.name);
  const params = classDescriptions[0].constructorParams;
  // todo - handle case with multiple components/services/pipes/etc. in one file

  return (_: Tree, _context: SchematicContext) => {
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
