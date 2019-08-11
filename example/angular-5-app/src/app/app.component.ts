import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(rest: HttpClient) {}
    title = 'app';
    publicMethod() {}

    public explicitPublicMethod() {}

    async asyncPublicMethod() {}

    private privateMethod() {}

    protected protectedMethod() {}
}
