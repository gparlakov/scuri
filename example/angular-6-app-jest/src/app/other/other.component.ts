import { Component } from '@angular/core';
import { Service } from '../service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-other',
    templateUrl: './other.component.html',
    styleUrls: ['./other.component.css']
})
export class OtherComponent {
    title = 'otherComponent';

    constructor(private s: Service, private router: Router) {
        this.title = s.method() ? this.title + s.method() : this.title;
    }
}
