import { MyDep } from '@angular/Common';
import { LibraryClass, LibraryClass1 } from '../shared/library';
import { LogService, BDep, CDep } from '@angular/core';

export class C  {
    constructor(
        private aDep: BDep,
        private bDep: BDep,
        private cDep: BDep,
        private dDep: CDep,
        private eDep: MyDep,
        private fDep: LibraryClass,
        private gDep: LibraryClass1,
        private logger: LogService
    ) {}
}
