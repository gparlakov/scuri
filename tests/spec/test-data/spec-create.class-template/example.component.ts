import { ADep } from '../my/relative/path';
import { DDep } from '@angular/router';

export class ExampleComponent {
    constructor(
        private aDep: ADep,
        private d: DDep,
    ) {}

    aMethod();
}
