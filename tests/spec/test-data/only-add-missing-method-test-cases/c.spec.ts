import { bDep } from '@angular/core';

describe('C', () => {
    it('existing method one test', () => {
        c.methodOne();
    })
    it('existing test case with name of methodTwo in the spec title', () => {
        c.methodTwo();
    })
    it('just any name', () => {
        c.methodThree();
    })
});
