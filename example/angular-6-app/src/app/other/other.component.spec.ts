import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherComponent } from './other.component';
import { autoSpy } from '../auto-spy';
import { Service } from '../service';

describe('OtherComponent', () => {
    let component: OtherComponent;
    let fixture: ComponentFixture<OtherComponent>;

    beforeEach(async(() => {
        const ser = autoSpy(Service);
        TestBed.configureTestingModule({
            declarations: [OtherComponent],
            providers: [{ provide: Service, useValue: ser }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OtherComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should carry the types (only methods should be mocked)', () => {
        // arrange
        const ser1 = autoSpy(Service);
        ser1.method.mockReturnValue(' some value');

        // act
        const comp = new OtherComponent(ser1);

        // assert
        expect(comp.title).toBe('otherComponent some value');
    });

    it('should mock methods', () => {
        // arrange
        const ser1 = autoSpy(Service);
        ser1.method.mockReturnValue('test');
        // act
        const res = ser1.method();

        // assert
        expect(ser1.method).toHaveBeenCalled();
        expect(res).toBe('test');
    });
});
