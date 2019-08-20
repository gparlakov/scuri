import { Component } from '@angular/core';
import { Service } from './service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'angular6app';

    constructor(private s: Service) {
        this.title = s.method() ? this.title + s.method() : this.title;
    }
}
