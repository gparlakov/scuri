import { basename, extname, normalize, strings } from "@angular-devkit/core";
import {
  apply,
  branchAndMerge,
  mergeWith,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from "@angular-devkit/schematics";
import { EOL } from "os";
import { readClassNamesAndConstructorParams } from "../read/read";

class SpecOptions {
  name: string;
  param: string[];
}

export function spec(options: SpecOptions): Rule {
  const classDescriptions = readClassNamesAndConstructorParams(options.name);
  const params = classDescriptions[0].constructorParams;
  const className = classDescriptions[0].name;
  // todo - handle case with multiple components/services/pipes/etc. in one file

  return (_tree: Tree, __context: SchematicContext) => {
    const normalized = normalize(options.name);
    const fileName = basename(normalized);
    const ext = extname(fileName);
    const normalizedName = fileName.slice(0, fileName.length - ext.length);
    console.log(normalizedName);

    const templateSource = apply(url("../files"), [
      template({
        classify: strings.classify,
        normalizedName: normalizedName,
        newFileNormalizedName: options.name.slice(
          0,
          options.name.length - ext.length
        ),
        name: options.name,
        className: className,
        params: params,
        toConstructorParams,
        toDeclaration,
        toBuilderExports,
        dasherize: strings.dasherize
      })
    ]);
    // todo - can we format the output?
    return branchAndMerge(mergeWith(templateSource));
  };

  function toConstructorParams() {
    return params.map(p => p.name).join(",");
  }

  function toDeclaration() {
    return params
      .map(p =>
        p.type === "string" || p.type === "number"
          ? `let ${p.name}:${p.type};`
          : `const ${p.name} = autoSpy(${p.type});`
      )
      .join(EOL);
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
