import { HttpClient } from '@angular/common/http';
import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { autoSpy } from './auto-spy';

describe('AppComponent', () => {
    beforeEach(async(() => {
        const { rest } = setup().default();

        TestBed.configureTestingModule({
            declarations: [AppComponent],
            providers: [{ provide: HttpClient, useValue: rest }]
        }).compileComponents();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    }));
    it(`should have as title 'app'`, async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app.title).toEqual('app');
    }));
    it('should render title in a h1 tag', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
    }));
});

function setup() {
    const rest = autoSpy(HttpClient);

    const builder = {
        rest,
        default() {
            return builder;
        },
        build() {
            return new AppComponent(rest);
        }
    };

    return builder;
}
