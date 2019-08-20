import { Component } from '@angular/core';
import { Service } from '../service';

@Component({
    selector: 'app-other',
    templateUrl: './other.component.html',
    styleUrls: ['./other.component.css']
})
export class OtherComponent {
    title = 'otherComponent';

    constructor(private s: Service) {
        this.title = s.method() ? this.title + s.method() : this.title;
    }
}
