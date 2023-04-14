import {
    apply,
    applyTemplates,
    mergeWith,
    Rule,
    SchematicContext,
    Tree,
    url,
    move
} from '@angular-devkit/schematics';
import { setLogger } from '../common/logger';

export class AutoSpyOptions {
    for: 'jasmine' | 'jest' = 'jasmine';
    legacy?: boolean = false;
    path: string = '.';
}

export default function(options: AutoSpyOptions): Rule {
    return (_tree: Tree, _context: SchematicContext) => {
        setLogger(_context.logger.createChild('scuri.autoSpy'))
        const runner = options.for;
        const v = options.legacy ? '-ts-2.7' : '';

        const source = apply(url(`./files/${runner}${v}`), [applyTemplates({}), move(options.path)]);
        return mergeWith(source);
    };
}
