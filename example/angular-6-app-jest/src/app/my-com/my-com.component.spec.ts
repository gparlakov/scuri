import { MyComComponent } from './my-com.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { autoSpy } from 'autoSpy';

/**
 * Test the MyComComponent with test Bed -
 */
describe('MyComComponent: ', () => {
    describe('Test all class method :', () => {
        let build, builder, component: MyComComponent, actualValue, expectedValue;

        beforeEach(() => {
            // GIVEN -
            builder = setup().default();
            build = builder.build;
            component = build();
        });

        describe('when "ngOnInit()" is called', () => {
            beforeEach(() => {
                // GIVEN -
                // builder.SERVICE.and.callThrought();
                // builder.SERVICE.and.return({});
            });

            describe('it should', () => {
                it('Return VALUE', () => {
                    // WHEN - act
                    actualValue = component.ngOnInit();

                    // THEN - assert
                    // expectedValue = {};
                    // expect(actualValue).toEqual(expectedValue);
                    // expect(builder.SERVICE).toHaveBeenCalled();
                });

                /**
                 * Add more test about method ngOnInit
                 **/
            }); // END - ngOnInit it should

            describe('it should failed', () => {
                it('When given VALUE', () => {
                    // WHEN - act
                    actualValue = component.ngOnInit();

                    // THEN - assert
                    // expectedValue = {};
                    // expect(actualValue).toEqual(expectedValue);
                    // expect(builder.SERVICE).not.toHaveBeenCalled();
                });

                /**
                 * Add more test about method ngOnInit when failed
                 **/
            }); // END - ngOnInit it should failed
        }); // END - test ngOnInit
    }); // END - test all class method

    describe('Test with the dom :', () => {
        let compile, builder, component: MyComComponent;

        beforeEach(() => {
            // GIVEN -
            builder = setup().compile();
            compile = builder.compile;
        });

        beforeEach(() => {
            // WHEN -
            component = compile();
        });

        it('should create', () => {
            // THEN - assert
            expect(component).toBeTruthy();
        });

        /**
         * Test here your DOM component
         */
    }); // END - Test with the dom
}); // END - test

/**
 * Setup the test, will autospy all provider
 **/
function setup() {
    let component: MyComComponent;
    let fixture: ComponentFixture<MyComComponent>;
    const builder = {
        component,
        fixture,
        /**
         * Confirure class, to juste create class without Domm, usefull for test class methode
         */

        default() {
            TestBed.configureTestingModule({
                providers: [MyComComponent]
            });

            return builder;
        },
        /**
         * Build class to run without DOM. Will call ngOnInit if exist
         */

        build() {
            component = TestBed.get(MyComComponent);

            if (component.ngOnInit) {
                component.ngOnInit();
            }
            return component;
        },
        /**
         * Configure component, and compile it with DOM, usefull for test with DOM
         **/

        compile() {
            TestBed.configureTestingModule({
                declarations: [MyComComponent],
                providers: []
            }).compileComponents();

            return builder;
        },
        /**
         * Create component, with DOM supports
         **/

        create() {
            fixture = TestBed.createComponent(MyComComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            return component;
        }
    };

    return builder;
}
