import { MyDirective } from './directive';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ExampleComponent', () => {

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            providers: [
                MyDirective,
                { provide: Service, useClass: autoSpy(Service, 'Service') },
            ]
        });

        directive = TestBed.inject(MyDirective);
    }));

    it('when myMethod is called it should', () => {
        // arrange
        // act
        e.myMethod();
        // assert
        // expect(e).toEqual
    });
});
