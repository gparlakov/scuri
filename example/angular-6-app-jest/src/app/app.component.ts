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

    getTitle() {
        return (this.title = this.s.method() ? this.title + this.s.method() : this.title);
    }

    save() {
        this.s.save();
    }
}
