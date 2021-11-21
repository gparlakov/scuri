"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allTargetOptions = exports.allWorkspaceTargets = exports.createDefaultPath = exports.buildDefaultPath = exports.getWorkspace = exports.updateWorkspace = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_models_1 = require("./workspace-models");
function createHost(tree) {
    return {
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = tree.read(path);
                if (!data) {
                    throw new Error('File not found.');
                }
                return core_1.virtualFs.fileBufferToString(data);
            });
        },
        writeFile(path, data) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.overwrite(path, data);
            });
        },
        isDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                // approximate a directory check
                return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
            });
        },
        isFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.exists(path);
            });
        },
    };
}
function updateWorkspace(updaterOrWorkspace) {
    return (tree) => __awaiter(this, void 0, void 0, function* () {
        const host = createHost(tree);
        if (typeof updaterOrWorkspace === 'function') {
            const { workspace } = yield core_1.workspaces.readWorkspace('/', host);
            const result = yield updaterOrWorkspace(workspace);
            yield core_1.workspaces.writeWorkspace(workspace, host);
            return result || schematics_1.noop;
        }
        else {
            yield core_1.workspaces.writeWorkspace(updaterOrWorkspace, host);
            return schematics_1.noop;
        }
    });
}
exports.updateWorkspace = updateWorkspace;
function getWorkspace(tree, path = '/') {
    return __awaiter(this, void 0, void 0, function* () {
        const host = createHost(tree);
        const { workspace } = yield core_1.workspaces.readWorkspace(path, host);
        return workspace;
    });
}
exports.getWorkspace = getWorkspace;
/**
 * Build a default project path for generating.
 * @param project The project which will have its default path generated.
 */
function buildDefaultPath(project) {
    const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
    const projectDirName = project.extensions['projectType'] === workspace_models_1.ProjectType.Application ? 'app' : 'lib';
    return `${root}${projectDirName}`;
}
exports.buildDefaultPath = buildDefaultPath;
function createDefaultPath(tree, projectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = yield getWorkspace(tree);
        const project = workspace.projects.get(projectName);
        if (!project) {
            throw new Error(`Project "${projectName}" does not exist.`);
        }
        return buildDefaultPath(project);
    });
}
exports.createDefaultPath = createDefaultPath;
function* allWorkspaceTargets(workspace) {
    for (const [projectName, project] of workspace.projects) {
        for (const [targetName, target] of project.targets) {
            yield [targetName, target, projectName, project];
        }
    }
}
exports.allWorkspaceTargets = allWorkspaceTargets;
function* allTargetOptions(target, skipBaseOptions = false) {
    if (!skipBaseOptions && target.options) {
        yield [undefined, target.options];
    }
    if (!target.configurations) {
        return;
    }
    for (const [name, options] of Object.entries(target.configurations)) {
        if (options !== undefined) {
            yield [name, options];
        }
    }
}
exports.allTargetOptions = allTargetOptions;
//# sourceMappingURL=workspace.js.map