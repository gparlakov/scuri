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
  // we'll take the first class with any number of constructor params or just the first if there are none
  const classWithConstructorParamsOrFirst =
    classDescriptions.filter(c => c.constructorParams.length > 0)[0] ||
    classDescriptions[0];
  if (classWithConstructorParamsOrFirst == null) {
    throw new Error("No classes found to be spec-ed!");
  }
  const {
    constructorParams: params,
    name: className,
    publicMethods
  } = classWithConstructorParamsOrFirst;

  // todo - handle case with multiple components/services/pipes/etc. in one file

  return (tree: Tree, context: SchematicContext) => {
    const normalized = normalize(options.name);
    const fileName = basename(normalized);
    const ext = extname(fileName);
    const normalizedName = fileName.slice(0, fileName.length - ext.length);

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
        dasherize: strings.dasherize,
        publicMethods
      })
    ]);
    // todo - can we format the output?
    const c = (branchAndMerge(mergeWith(templateSource))(tree, context));
    return c;
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
