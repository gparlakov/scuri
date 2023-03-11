import { ToUpdate } from './to-update-without-methods';
describe('ToUpdate', () => {

});

function setup() {
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new ToUpdate();
        }
    };

    return builder;
}
