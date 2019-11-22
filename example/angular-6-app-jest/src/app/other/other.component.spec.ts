import { Service } from '../service';
import { Router } from '@angular/router';
import { OtherComponent } from './other.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { autoSpy } from 'autoSpy';

/**
 * Test the OtherComponent with test Bed -
 */
describe('OtherComponent: ', () => {
    describe('Test all class method :', () => {
        let build, builder, component: OtherComponent, actualValue, expectedValue;

        beforeEach(() => {
            // GIVEN -
            builder = setup().default();
            build = builder.build;
            component = build();
        });
    }); // END - test all class method

    describe('Test with the dom :', () => {
        let compile, builder, component: OtherComponent;

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
    const s: Service = autoSpy<Service>(Service, 'Service');
    const router: Router = autoSpy<Router>(Router, 'Router');
    let component: OtherComponent;
    let fixture: ComponentFixture<OtherComponent>;
    const builder = {
        s,
        router,
        component,
        fixture,
        /**
         * Confirure class, to juste create class without Domm, usefull for test class methode
         */

        default() {
            TestBed.configureTestingModule({
                providers: [
                    OtherComponent,
                    { provide: Service, useValue: s },
                    { provide: Router, useValue: router }
                ]
            });

            return builder;
        },
        /**
         * Build class to run without DOM. Will call ngOnInit if exist
         */

        build() {
            component = TestBed.get(OtherComponent);

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
                declarations: [OtherComponent],
                providers: [
                    { provide: Service, useValue: s },
                    { provide: Router, useValue: router }
                ]
            }).compileComponents();

            return builder;
        },
        /**
         * Create component, with DOM supports
         **/

        create() {
            fixture = TestBed.createComponent(OtherComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            return component;
        }
    };

    return builder;
}
