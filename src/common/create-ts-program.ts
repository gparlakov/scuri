import { Tree } from '@angular-devkit/schematics';
import { EOL } from 'os';
import * as ts from 'typescript';
import { getLogger } from './logger';

export function createTsProgram(fileName: string, tree: Tree): ts.Program {
    const logger = getLogger(createTsProgram.name);

    let config: ts.ParsedCommandLine = { options: {}, fileNames: [], errors: [] };

    const closestTsConfig = ts.findConfigFile(fileName, (f) => tree.exists(f));
    if (typeof closestTsConfig === 'string') {
        logger.debug(`Found ${closestTsConfig}`);
        const src = ts.readJsonConfigFile(closestTsConfig, (f) => {
            if (tree.exists(f)) {
                const raw = tree.read(f);
                if (raw != null) {
                    return raw.toString();
                }
            }
        });
        logger.debug(`Parsed json ${src?.getText() ?? 'TsConfigSourceFile is nullish'}`);
        config = ts.parseJsonSourceFileConfigFileContent(
            src,
            {
                fileExists: (f) => {
                    logger.debug(`parseConfig: fileExists ${f}?${tree.exists(f)}`);
                    return tree.exists(f);
                },
                useCaseSensitiveFileNames: true,
                readFile: (f) => {
                    logger.debug(`parseConfig: readFile ${f} : ${tree.read(f)?.toString()}`);
                    return tree.read(f)?.toString();
                },
                readDirectory: (r, _exs, _excludes, _includes, _depth) => {
                    logger.debug(`parseConfig:readDirectory ${r}`);
                    return tree.getDir(r).subfiles.map((s) => s);
                }
            },
            tree.root.path,
            undefined,
            closestTsConfig
        );

        logger.debug(`parsed config: ${JSON.stringify(config)}`);
    } else {
        let checkedFiles: string[] = [];
        ts.findConfigFile(fileName, (f) => (checkedFiles.push(f), tree.exists(f)));
        logger.warn(
            `Did not find a tsconfig file close to ${fileName}. Some types might be missing. Searched in ${checkedFiles.join(
                '\n'
            )}`
        );
    }

    const defaultHost = ts.createCompilerHost({}, true);
    const treeHost = {
        ...defaultHost,
        readFile: (s: string) => {
            const res = tree.read(s)?.toString();
            logger.debug(`treeHost: readFile ${s}: ${res}`);
            return res;
        },
        writeFile: (name: string, text: string) => {
            logger.debug(`treeHost: writing ${name}:${text}`);
            tree.overwrite(name, text);
        },
        fileExists: (name: string) => {
            logger.debug(`treeHost: exists ${name}:${tree.exists(name)}`);
            return tree.exists(name);
        },
        getNewLine: () => EOL,


    };

    return ts.createProgram([fileName], config.options, treeHost);
}
