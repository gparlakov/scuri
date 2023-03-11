import { ToUpdate } from './to-update-with-methods';

describe('ToUpdate', () => {
    it('when oldMethod is called it should', () => {
        c.oldMethod();
    });
});

function setup() {
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new ToUpdate(stringDependency, service);
        }
    };

    return builder;
}
