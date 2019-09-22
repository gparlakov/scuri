import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Service } from './service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(rest: HttpClient, oneMore: Service) {}
    title = 'app';
    publicMethod() {}

    public explicitPublicMethod() {}

    async asyncPublicMethod() {}

    private privateMethod() {}

    protected protectedMethod() {}
}
