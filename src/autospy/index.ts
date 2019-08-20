import { mergeWith, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';

export class AutoSpyOptions {
    for: 'jasmine' | 'jest' = 'jasmine';
    legacy?: boolean = false;
}

export default function(options: AutoSpyOptions): Rule {
    return (_tree: Tree, _context: SchematicContext) => {

        const runner = options.for;
        const v = options.legacy ? '-ts-2.7' : '';

        const source = url(`./files/${runner}${v}`);
        return mergeWith(source);
    };
}
