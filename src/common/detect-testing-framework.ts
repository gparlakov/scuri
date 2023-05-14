import { Tree } from '@angular-devkit/schematics';
import { getLogger } from './logger';

export type Supported = 'jest' | 'jasmine';
const supported: Supported[] = ['jest', 'jasmine'];

/**
 * Take the framework from the 1. cli params or 2. config or 3. best effort autodetect
 * @param cliParam command line interface param if any
 * @param configParam configured param if any
 * @param t Tree
 * @param fallback - if all else fails use this
 * @returns 'jest' | 'jasmine'
 */
export function detectTestingFramework(
    cliParam: string | undefined,
    configParam: string | undefined,
    t: Tree,
    fallback: Supported
): 'jest' | 'jasmine' {
    const logger = getLogger(detectTestingFramework.name);

    logger.log('debug', 'entering');
    if (typeof cliParam === 'string' && supported.includes(cliParam as Supported)) {
        logger.debug(`Detected supported cli param ${cliParam}`);
        return cliParam as Supported;
    }
    if (typeof cliParam === 'string') {
        logger.warn(
            `Detected un-supported cli param ${cliParam}. please use ${supported.join(' or ')}`
        );
    }
    if (typeof configParam === 'string' && supported.includes(configParam as Supported)) {
        logger.debug(`Detected supported config param ${cliParam}`);
        return configParam as Supported;
    }
    if (typeof configParam === 'string') {
        logger.warn(
            `Detected un-supported config param ${configParam}. please use ${supported.join(
                ' or '
            )}`
        );
    }

    const found: {
        jest: string[];
        jasmine: string[];
    } = { jest: [], jasmine: [] };

    const root = t.getDir('.');

    root.subfiles.forEach(f => {
        if(f.includes('node_modules')) {
            // skip node modules
            return;
        }

        if (f.includes('jest')) {
            found.jest.push(f);
            logger.debug(`Detected jest by way of ${f}`);
        } else if (f.includes('karma')) {
            found.jasmine.push(f);
            logger.debug(`Detected jasmine by way of: ${f}`);
        } else if (f.includes('package.json')) {
            const content = t.read(`./${f}`)?.toString();
            if (typeof content === 'string') {
                if (content.includes('"jasmine-core"')) {
                    found.jasmine.push(f);
                    logger.debug(`Detected jasmine by way of ${f}`);
                }
                if (content.includes('"jest"')) {
                    found.jest.push(f);
                    logger.debug(`Detected jest by way of ${f}`);
                }
            }
        }
    });

    if (found.jasmine.length > found.jest.length) {
        logger.debug(`Detected jasmine by way of ${found.jasmine.join()}`);
        return 'jasmine';
    } else if (found.jest.length > found.jasmine.length) {
        logger.debug(`Detected jest by way of ${found.jest.join()}`);
        return 'jest';
    } else {
        logger.debug(`Fallback to ${fallback}`);
        // jest == jasmine
        return fallback;
        // todo - read through the files again and get the .mockReturnValue  and '.and.' numbers and .returnValue counts to make sure which type of runner is being used
    }
}
