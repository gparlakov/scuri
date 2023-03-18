import { bDep } from '@angular/core';

describe('C', () => {
    beforeEach(async(() => {
        const setupInstance = setup().default();
        TestBed
        // somewhere
        .configureCompiler()
        .configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: 'someValue', useValue: 'other value' }]
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
