import { Dep } from '@lib';

export class Component {
    constructor(private dep: Dep) {}

    method() {
        if(this.dep.property) {
            const x = this.dep.method();
        }
    }
}
