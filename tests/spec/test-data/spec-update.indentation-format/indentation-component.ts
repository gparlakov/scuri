import { LogService, BDep } from '@angular/core';

export class C  {
    constructor(
        private aDep: BDep,
        private bDep: BDep,
        private cDep: BDep,
        private logger: LogService
    ) {}
}
