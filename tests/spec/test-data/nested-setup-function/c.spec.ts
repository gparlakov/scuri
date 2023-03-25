import { BDep } from '@angular/core';

describe('C', () => {
    function setup() {
        let bDep: SpyOf<ActivatedRoute> = autoSpy(bDep);
        const builder = {
            bDep,
            build: () => {
                return new C(bDep);
            },
        };

        return builder;
    }
});
