import { Service } from './service';
import { AppComponent } from './app.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { autoSpy } from 'autoSpy';

/**
 * Test with test Bed -
 */
describe('AppComponent', () => {
    it('should create', () => {
        // GIVEN - arrange
        const { build } = setup().default();
        const component = build();

        // WHEN - act

        // THEN - assert
        expect(component).toBeTruthy();
    });

    it('when getTitle is called it should', () => {
        // GIVEN - arrange
        const { build } = setup().default();
        const component = build();

        // WHEN - act
        const getTitle = component.getTitle();

        // THEN - assert
        // const getTitleExpected = {};
        // expect(getTitle).toEqual(getTitleExpected);
    });

    it('when save is called it should', () => {
        // GIVEN - arrange
        const { build } = setup().default();
        const component = build();

        // WHEN - act
        const save = component.save();

        // THEN - assert
        // const saveExpected = {};
        // expect(save).toEqual(saveExpected);
    });
});

function setup() {
    const s: Service = autoSpy<Service>(Service, 'Service');
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    const builder = {
        s,
        component,
        fixture,
        default() {
            TestBed.configureTestingModule({
                declarations: [AppComponent],
                providers: [{ provide: Service, useValue: s }]
            }).compileComponents();

            return builder;
        },
        build() {
            fixture = TestBed.createComponent(AppComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            return component;
        }
    };

    return builder;
}
