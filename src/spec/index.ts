import { basename, normalize, strings } from "@angular-devkit/core";
import { apply, branchAndMerge, mergeWith, Rule, SchematicContext, template, Tree, url } from "@angular-devkit/schematics";
import { EOL } from 'os';
import { readClassNamesAndConstructorParams } from "../read/read";

class SpecOptions {
  name: string;
  param: string[];
}

export function spec(options: SpecOptions): Rule {
  const classDescriptions = readClassNamesAndConstructorParams(options.name);
  const params = classDescriptions[0].constructorParams;
  // todo - handle case with multiple components/services/pipes/etc. in one file

  return (_tree: Tree, __context: SchematicContext) => {

    const templateSource = apply(url("../files"), [
      template({
        classify: strings.classify,
        name: basename(normalize(options.name)),
        params: params,
        toConstructorParams,
        toDeclaration,
        toBuilderExports,
        dasherize: strings.dasherize,
      })
    ]);

    return branchAndMerge(mergeWith(templateSource));
  };

  function toConstructorParams() {
    return params.map(p => p.name).join(",");
  }

  function toDeclaration() {
    return params.map(p => `const ${p.name} = autoSpy(${p.type})`).join(EOL);
  }

  function toBuilderExports() {
    return params.length > 0
      ? params
          .map(p => p.name)
          .join("," + EOL)
          .concat(",")
      : "";
  }
}
