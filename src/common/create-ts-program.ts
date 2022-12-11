import { Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { getLogger } from './logger';

let programMap = new Map<string, ts.Program>();
export function createTsProgram(fileName: string, tree: Tree): ts.Program {
    const logger = getLogger(createTsProgram.name);

    if(programMap.has(fileName)) {
        logger.debug(`Reusing program for ${fileName}`)
        return programMap.get(fileName)!;
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
                '\n'
            )}`
        );
    }

    const defaultHost = ts.createCompilerHost({}, true);
    logger.debug(
        `Creating (and caching) program for ${fileName}, with options\n${JSON.stringify(config.options)}`
    );
    const program = ts.createProgram([fileName], config.options, defaultHost);
    programMap.set(fileName, program)
    return program;
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


