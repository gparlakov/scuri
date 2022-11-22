import { extname } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { } from 'fs';
import { EOL } from 'os';
import * as ts from 'typescript';
import { getLogger } from './logger';

export function createTsProgram(fileName: string, tree: Tree): ts.Program {
    const logger = getLogger(createTsProgram.name);

    let config: ts.ParsedCommandLine = {
        options: {
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS,
            noLib: true
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
    const treeHost = <ts.CompilerHost>{
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
            logger.debug(`treeHost: exists ${name}:${tree.exists(name) && tree.get(name) != null}`);
            return tree.exists(name) && tree.get(name) != null;
        },
        getNewLine: () => EOL,
        getCurrentDirectory: () => {
            logger.debug(`treeHost: getCurrentDirectory ${tree.root.path}}`);
            return tree.root.path
        },
        getDirectories: (path: string) => {
            logger.debug(`treeHost: getDirectories for ${path}: ${tree.getDir(path)?.subdirs}`);
            return tree.getDir(path)?.subdirs
        },
        directoryExists: (directoryName: string) => {
            logger.debug(`treeHost: directoryExists for ${directoryName}: ${tree.getDir(directoryName) != null}`);
            return tree.getDir(directoryName) != null
        },
        readDirectory(rootDir, extensions, excludes, includes, depth?) {
            const files: string[] = []
            tree.getDir(rootDir).visit(f => {
                const supportedExtension = extensions != null && extensions?.length > 0 ? extensions.includes(extname(f)) : true;
                const isExcluded = excludes != null && excludes?.length > 0 ? excludes.some(e => e === f || new RegExp(e).test(f)) : false ;
                const isIncluded = includes != null && includes?.length > 0  ? includes.some(e => e === f || new RegExp(e).test(f)) : true ;

                if(isExcluded || !isIncluded || !supportedExtension) {
                    return;
                }
                files.push(f);
            });

            logger.debug(`treeHost: readDirectory for, ${rootDir}, ${extensions}, ${excludes}, ${includes}, ${depth}:${EOL}${files.join(',')}`);
            return files;
        },
        getSourceFile(fileName, languageVersionOrOptions, _onError) {
            logger.debug(`treeHost:getSourceFile for, ${fileName}, ${languageVersionOrOptions}`);
            const contents = treeHost.readFile(fileName);
            if(!contents) {
                logger.debug(`Could not find ${fileName}`);
                return undefined;
            }

            return ts.createSourceFile(fileName, contents, languageVersionOrOptions, true);
        }
        // ,
        // watchFile() {
        //     context.schematic.collection.description.name
        // }
    };
    logger.debug(
        `Creating program for ${fileName}, with options\n${JSON.stringify(config.options)}`
    );
    return ts.createProgram([fileName], config.options, treeHost);
}


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


