
import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        const a = setup().default();
        // does this appear
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: bDep, useValue: a.bDep }]
        }).compileComponents();
    }));
});

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
    }
    return builder;
}
