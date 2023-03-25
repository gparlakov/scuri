import { Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { getLogger } from './logger';

let programCache = new Map<string, ts.Program>();
export function createTsProgram(fileName: string, tree: Tree): ts.Program {
    const logger = getLogger(createTsProgram.name);
    logger.debug(`entering for ${fileName}`)

    if(programCache.has(fileName)) {
        logger.debug(`Reusing program for ${fileName}`)
        return programCache.get(fileName)!;
    }

    let config: ts.ParsedCommandLine = {
        options: {
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS
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
                '||'
            )}`
        );
    }

    const defaultHost = ts.createCompilerHost({}, true);
    logger.debug(
        `Creating (and caching) program for ${fileName}, with options\n${JSON.stringify(config.options)}`
    );
    const program = ts.createProgram([fileName], config.options, defaultHost);
    logger.debug(`FileContents: ${program.getSourceFile(fileName)?.getFullText()}`)
    programCache.set(fileName, program)
    return program;
}

export function getSourceFile(fullFileName: string, tree: Tree): ts.SourceFile | undefined {
    const logger = getLogger(getSourceFile.name);
    logger.debug(`entering for ${fullFileName}`)
    // const program = createTsProgram(fullFileName, tree);

    // if(program == null) {
    //     logger.debug('Program/source file is still null, probably some error in log above. Creating a new source file from scratch.')
    //     const contents = tree.read(fullFileName)?.toString();
    //     if(contents == null) {
    //         logger.error(`The contents of the ${fullFileName} are empty - the file is probably missing. Can't create a source file`)
    //         return undefined;
    //     }
    //     logger.debug(`Creating just a source file for ${fullFileName}`)
    return ts.createSourceFile(fullFileName, tree.read(fullFileName)?.toString() ?? '', ts.ScriptTarget.Latest, true);
    // }

    // logger.debug('Found program. Returning the source file from it')
    // return program.getSourceFile(fullFileName);
}
// failed experiment - faking the ts host by reading/writing from the tree host
// failed b/c tree does not get node_modules and other  necessary .d.ts files that comprise a big chunk of the base types like string, Number, HTMLElement, etc.
// keeping it around as it took way too much effort to just delete... :(

// export function createTsProgram_1(fileName: string): ts.Program {
//     const logger = getLogger(createTsProgram.name);

//     let config: ts.ParsedCommandLine = {
//         options: {
//             target: ts.ScriptTarget.ES2015,
//             module: ts.ModuleKind.CommonJS,
//         },
//         fileNames: [],
//         errors: [],
//     };

//     const closestTsConfig = ts.findConfigFile(fileName, (f) => tree.exists(f));
//     if (typeof closestTsConfig === 'string') {
//         logger.debug(`Found ${closestTsConfig}`);
//         const src = ts.readJsonConfigFile(closestTsConfig, (f) => {
//             if (tree.exists(f)) {
//                 const raw = tree.read(f);
//                 if (raw != null) {
//                     return raw.toString();
//                 }
//             }
//         });
//         logger.debug(`Parsed json ${src?.getText() ?? 'TsConfigSourceFile is nullish'}`);
//         config = ts.parseJsonSourceFileConfigFileContent(
//             src,
//             {
//                 fileExists: (f) => {
//                     logger.debug(`parseConfig: fileExists ${f}?${tree.exists(f)}`);
//                     return tree.exists(f);
//                 },
//                 useCaseSensitiveFileNames: true,
//                 readFile: (f) => {
//                     logger.debug(`parseConfig: readFile ${f} : ${tree.read(f)?.toString()}`);
//                     return tree.read(f)?.toString();
//                 },
//                 readDirectory: (r, _exs, _excludes, _includes, _depth) => {
//                     logger.debug(`parseConfig:readDirectory ${r}`);
//                     return tree.getDir(r).subfiles.map((s) => s);
//                 },
//             },
//             tree.root.path,
//             undefined,
//             closestTsConfig
//         );

//         logger.debug(`parsed config: ${JSON.stringify(config)}`);
//     } else {
//         let checkedFiles: string[] = [];
//         ts.findConfigFile(fileName, (f) => (checkedFiles.push(f), tree.exists(f)));
//         logger.warn(
//             `Did not find a tsconfig file close to ${fileName}. Some types might be missing. Searched in ${checkedFiles.join(
//                 '\n'
//             )}`
//         );
//     }

//     const defaultHost = ts.createCompilerHost({}, true);
//     const treeHost = <ts.CompilerHost>{
//         ...defaultHost,
//         readFile: (s: string) => {
//             const res = tree.read(s)?.toString();
//             logger.debug(`treeHost: readFile ${s}: ${res}`);
//             return res;
//         },
//         writeFile: (name: string, text: string) => {
//             logger.debug(`treeHost: writing ${name}:${text}`);
//             tree.overwrite(name, text);
//         },
//         fileExists: (name: string) => {
//             logger.debug(`treeHost: exists ${name}:${tree.exists(name)}`);
//             return tree.exists(name);
//         },
//         getNewLine: () => EOL,
//         getCurrentDirectory: () => {
//             logger.debug(`treeHost: getCurrentDirectory ${tree.root.path}}`);
//             return tree.root.path
//         },
//         getDirectories: (path: string) => {
//             logger.debug(`treeHost: getDirectories for ${path}: ${tree.getDir(path)?.subdirs}`);
//             return tree.getDir(path)?.subdirs
//         },
//         directoryExists: (directoryName: string) => {
//             logger.debug(`treeHost: directoryExists for ${directoryName}: ${tree.getDir(directoryName) != null}`);
//             return tree.getDir(directoryName) != null
//         },
//         readDirectory(rootDir, extensions, excludes, includes, depth?) {
//             logger.debug(`treeHost: readDirectory for, ${rootDir}, ${extensions}, ${excludes}, ${includes}, ${depth}`);
//             return tree.getDir(rootDir).subfiles
//         },
//     };
//     logger.debug(
//         `Creating program for ${fileName}, with options\n${JSON.stringify(config.options)}`
//     );
//     return ts.createProgram([fileName], config.options, treeHost);
// }


