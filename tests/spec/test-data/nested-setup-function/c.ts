import { LogService, BDep } from '@angular/core';

export class C {
    constructor(private bDep: BDep, private logger: LogService) {}
}
