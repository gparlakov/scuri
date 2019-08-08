import { Component, OnInit, Router } from '@angular/core';

@Component({
    selector: 'app-my-com',
    templateUrl: './my-com.component.html',
    styleUrls: ['./my-com.component.css']
})
export class MyComComponent implements OnInit {
    constructor(private router: Router) {}

    ngOnInit() {}
}
