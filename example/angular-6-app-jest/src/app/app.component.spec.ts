import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Service } from './service';
import { autoSpy } from './auto-spy';

describe('AppComponent', () => {
    const ser = autoSpy(Service);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: Service, useValue: ser }]
        }).compileComponents();
    }));

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    it(`should have as title 'angular6app'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('angular6app');
    });

    it('should render title in a h1 tag', () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('Welcome to angular6app!');
    });

    it('should carry the types (only methods should be mocked)', () => {
        // arrange
        const ser1 = autoSpy(Service);
        ser1.method.mockReturnValue(' some value');

        // act
        const comp = new AppComponent(ser1);

        // assert
        expect(comp.title).toBe('angular6app some value');
    });

    it('should carry the types (only methods should be mocked)', () => {
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
