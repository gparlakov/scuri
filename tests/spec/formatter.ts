import { LogService } from '@angular/core';
import { bDep } from '@angular/core';
describe('C', () => {});
function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    };
    return builder;
}
