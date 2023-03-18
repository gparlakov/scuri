import { ADep, BDep } from '../my/relative/path';
import { Router, DDep } from '@angular/router';

export class WithImportsComponent {
    constructor(
        private aDep: ADep,
        private d: DDep,
        private b: BDep,
        private router: Router,
    ) {}
}
