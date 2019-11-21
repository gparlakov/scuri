import { ExampleComponent } from './example.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { autoSpy } from 'autoSpy';

/**
 * Test with test Bed -
 */
describe('ExampleComponent', () => {

    it('should create', () => {
        // GIVEN - arrange
        const { build } = setup().default();
        const component = build();

        // WHEN - act

        // THEN - assert
        expect(component).toBeTruthy();
    }); 

  it('when aMethod is called it should', () => {
    // GIVEN - arrange
    const { build } = setup().default();
    const component = build();

    // WHEN - act
    const aMethod = component.aMethod();

    // THEN - assert
    // const aMethodExpected = {};
    // expect(aMethod).toEqual(aMethodExpected);
  });

  it('when anotherMethod is called it should', () => {
    // GIVEN - arrange
    const { build } = setup().default();
    const component = build();

    // WHEN - act
    const anotherMethod = component.anotherMethod();

    // THEN - assert
    // const anotherMethodExpected = {};
    // expect(anotherMethod).toEqual(anotherMethodExpected);
  });

  it('when fourth is called it should', () => {
    // GIVEN - arrange
    const { build } = setup().default();
    const component = build();

    // WHEN - act
    const fourth = component.fourth();

    // THEN - assert
    // const fourthExpected = {};
    // expect(fourth).toEqual(fourthExpected);
  });

  
});

function setup() {
  let mep:string;
const service1: Object = autoSpy<Object>(Object, 'Object');
    let component: ExampleComponent;
    let fixture: ComponentFixture<ExampleComponent>;
  const builder = {
    mep,
service1,,
    component,
    fixture,
    default() {
        TestBed.configureTestingModule({
            declarations: [ExampleComponent],
            providers: [, 
{ provide: Object, useValue: service1 }]
        }).compileComponents();
        
      return builder;
    },
    build() {
        fixture = TestBed.createComponent(ExampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        return component;
    }
  };

  return builder;
}
