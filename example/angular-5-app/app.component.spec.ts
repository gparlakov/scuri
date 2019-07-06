import { autoSpy } from 'autoSpy';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
    it('when publicMethod is called it should', () => {
        // arrange
        const { build } = setup().default();
        const c = build();
        // act
        c.publicMethod();
        // assert
        // expect(c).toEqual
    });

    it('when explicitPublicMethod is called it should', () => {
        // arrange
        const { build } = setup().default();
        const c = build();
        // act
        c.explicitPublicMethod();
        // assert
        // expect(c).toEqual
    });

    it('when asyncPublicMethod is called it should', () => {
        // arrange
        const { build } = setup().default();
        const c = build();
        // act
        c.asyncPublicMethod();
        // assert
        // expect(c).toEqual
    });
});

function setup() {
    let service: Object;
    const rest = autoSpy(HttpClient);
    const builder = {
        service,
        rest,
        default() {
            return builder;
        },
        build() {
            return new AppComponent(service, rest);
        }
    };

    return builder;
}
