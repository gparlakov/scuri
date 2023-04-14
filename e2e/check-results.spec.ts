import {readFileSync, readdirSync } from 'fs';
import {join} from 'path';
const myCom = join(__dirname, './results/my-com.component.spec.ts')
const other = join(__dirname, './results/other.component.spec.ts')
const toUpdate = join(__dirname, './results/to-update.component.custom.spec.ts')
const promiseAndObservable = join(__dirname, './results/promise-and-observable.component.spec.ts')

describe('spec', () => {
   it('should check results against snapshot', () => {
    expect(readFileSync(myCom).toString('utf8')).toMatchSnapshot('my-com-expected');
    expect(readFileSync(other).toString('utf8')).toMatchSnapshot('other-expected');
    expect(readFileSync(toUpdate).toString('utf8')).toMatchSnapshot('to-update-expected');
    expect(readFileSync(promiseAndObservable).toString('utf8')).toMatchSnapshot('promise-and-observable');
   })
});
