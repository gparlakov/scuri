import { mergeWith, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';

export class AutoSpyOptions {
    for: 'jasmine' | 'jest' = 'jasmine';
    legacy?: boolean = false;
}

export default function(_options: AutoSpyOptions): Rule {
    console.log(_options.for === 'jasmine' ? './files/jasmine' : './files/jest')
    return (_tree: Tree, _context: SchematicContext) => {
        const source = url(_options.for === 'jasmine' ? './files/jasmine' : './files/jest');
        return mergeWith(source);
    };
}
