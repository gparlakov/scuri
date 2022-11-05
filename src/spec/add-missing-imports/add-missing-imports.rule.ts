import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { EOL } from 'os';
import * as ts from 'typescript';
import { insertImport } from '../../../lib/utility/ast-utils';
import { applyToUpdateRecorder } from '../../../lib/utility/change';
import { getLogger } from '../../common/logger';

const observableImports = ['Subject', 'Observable', 'EMPTY', 'of'];

export function addMissingImports(specFile: string): Rule {
    const logger = getLogger(addMissingImports.name);
    return (tree: Tree, _context: SchematicContext): Tree => {
        if(!tree.exists(specFile)) {
            // adding the imports to a missing file is a noop
            return tree;
        }

        const defaultHost = ts.createCompilerHost({});
        defaultHost.readFile = (s: string) => {
            return tree.read(s)?.toString();
        };

        defaultHost.writeFile = (name: string, text: string) => {
            logger.debug(`default host writing ${name}:${text}`);
        };

        defaultHost.fileExists = (name: string) => tree.exists(name);
        defaultHost.getNewLine = () => EOL;

        const prog = ts.createProgram([specFile], {}, defaultHost);

        // alternative
        // create a language service and getCodeFixes 2304(string index?)
        // const s = ts.createLanguageService(defaultHost);

        const missingImports = prog
            .getSemanticDiagnostics()
            .map((d) => {
                logger.debug(`${d.messageText}`);
                return d;
            })
            .map((d) => {
                if (typeof d.messageText === 'string') {
                    const m = d.messageText.match(/cannot find name '(.*)'/i);
                    if (m != null && m.length > 0) {
                        return m[1];
                    }
                }
                return undefined;
            });

        const uniqMissingImports = <SupportedImport[]>(
            [...new Set(missingImports)].map(isSupportedImport).filter((s) => s !== 'unsupported')
        );

        const r = tree.beginUpdate(specFile);
        const specFileSrc = prog.getSourceFile(specFile)!;

        const addFromRxjs = uniqMissingImports.some((i) => i.kind === 'observable')
            ? [
                  insertImport(
                      specFileSrc,
                      specFile,
                      uniqMissingImports
                          .filter((i) => i.kind === 'observable')
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((i) => i.name)
                          .join(', '),
                      'rxjs'
                  ),
              ]
            : [];

        const addAutoSpyMaybe = uniqMissingImports.some((i) => i.kind === 'autospy')
            ? [insertImport(specFileSrc, specFile, 'autoSpy', 'autoSpy')]
            : [];

        applyToUpdateRecorder(r, [
            ...addFromRxjs,
            ...addAutoSpyMaybe,
        ]);
        tree.commitUpdate(r);

        // read the file and create a src for it
        // get all errors where something is missing
        // try and use the fix that adds the imports ?
        // alternatively - for each error get the import path and import it
        return tree;
    };
}

interface SupportedImport {
    name: string;
    kind: 'observable' | 'autospy';
}

function isSupportedImport(v?: string): 'unsupported' | SupportedImport {
    if (typeof v !== 'string') {
        return 'unsupported';
    }
    if (v.includes('autoSpy')) {
        return { name: v, kind: 'autospy' };
    }
    if (observableImports.some((i) => v.includes(i))) {
        return { name: v, kind: 'observable' };
    }

    return 'unsupported';
}