import { Component } from '@angular/core';
import { HttpClient } from 'selenium-webdriver/http';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(service: Object, rest: HttpClient) {}
    title = 'app';
    publicMethod() {}

    public explicitPublicMethod() {}

    async asyncPublicMethod() {}

    private privateMethod() {}

    protected protectedMethod() {}
}
