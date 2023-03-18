import { MyDirective } from './directive';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ExampleComponent', () => {
    // scuri:lets

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                providers: [
                    MyDirective,
                    { provide: Service, useClass: autoSpy(Service, 'Service') },
                    // scuri:injectables
                ]
            });

            directive = TestBed.inject(MyDirective);
            // scuri:get-instances
        })
    );

    it('when myMethod is called it should', () => {
        // arrange
        // act
        e.myMethod();
        // assert
        // expect(e).toEqual
    });

    // scuri:methods
});
