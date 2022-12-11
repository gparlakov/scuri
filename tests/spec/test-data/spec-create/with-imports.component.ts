import { Router } from '@angular/core';
import { ADep } from '../../deps/a-dep.ts';
import { local } from './local.ts';
import * as AnotherDep from './local-deps/a-depth.service.ts';

export class WithImportsComponent {
    constructor(
        private router: Router,
        private aDep: ADep,
        private anoter: AnotherDep,
        local: local,
        simple: Object
    ) {}
}
