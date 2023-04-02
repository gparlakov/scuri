import { Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { getLogger } from './logger';


export function getSourceFile(fullFileName: string, tree: Tree): ts.SourceFile | undefined {
    const logger = getLogger(getSourceFile.name);
    logger.debug(`entering for ${fullFileName}`);
    // const program = createTsProgram(fullFileName, tree);

    // if(program == null) {
    //     logger.debug('Program/source file is still null, probably some error in log above. Creating a new source file from scratch.')
    //     const contents = tree.read(fullFileName)?.toString();
    //     if(contents == null) {
    //         logger.error(`The contents of the ${fullFileName} are empty - the file is probably missing. Can't create a source file`)
    //         return undefined;
    //     }
    //     logger.debug(`Creating just a source file for ${fullFileName}`)
    return ts.createSourceFile(
        fullFileName,
        tree.read(fullFileName)?.toString() ?? '',
        ts.ScriptTarget.Latest,
        true
    );
    // }

    // logger.debug('Found program. Returning the source file from it')
    // return program.getSourceFile(fullFileName);
}

export function createTsProgram(fileName: string, tree: Tree): ts.Program {
    const logger = getLogger(createTsProgram.name);

    let config: ts.ParsedCommandLine = {
        options: {
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS,
        },
        fileNames: [],
        errors: [],
    };

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
                },
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

    const host = ts.createCompilerHost(config.options, true);
    const originalReadFile = host.readFile.bind(host);
    host.readFile = (f: string) => {
        const path = f; // f.includes(host.getCurrentDirectory()) ? f.replace(host.getCurrentDirectory(), '') :
        logger.debug(`----- reading file ${path} from ${tree.exists(path) ? 'tree' : 'system'}`);
        return tree.exists(path) ? tree.read(path)?.toString() : originalReadFile(path);
    }

    logger.debug(
        `Creating program for ${fileName}, with options\n${JSON.stringify(config.options)}`
    );
    logger.debug('using proxied host');
    return ts.createProgram([fileName], config.options, host);
}
