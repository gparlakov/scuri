import { ToUpdate } from './to-update';

describe('ToUpdate', () => {});

function setup() {
    let stringDependency: string;
    const service = autoSpy(Object);
    const builder = {
        stringDependency,
        service,
        default() {
            return builder;
        },
        build() {
            return new ToUpdate(stringDependency, service);
        },
    };

    return builder;
}
