import { ADep } from '../my/relative/path';
import { DDep } from '@angular/router';
import { WithImportsComponent } from './with-imports.component';
import { autoSpy } from 'autoSpy';

describe('WithImportsComponent', () => {

});

function setup() {
    const aDep = autoSpy(aDep);
    const dDep = autoSpy(DDep);
    const builder = {
        dDep,
        aDep,
        default() {
            return builder;
        },
        build() {
            return new WithImportsComponent(aDep,dDep);
        }
    };

    return builder;
}
