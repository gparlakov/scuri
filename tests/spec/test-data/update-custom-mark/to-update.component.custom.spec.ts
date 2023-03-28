import { ToUpdateComponent } from './to-update.component';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ToUpdateComponent', () => {

    // scuri:lets

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                providers: [
                    MyDirective,

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
        t.myMethod();
        // assert
        // expect(t).toEqual
    });


    // scuri:Methods

});

