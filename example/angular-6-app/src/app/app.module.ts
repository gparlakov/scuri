import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { Service } from './service';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule],
    providers: [Service],
    bootstrap: [AppComponent]
})
export class AppModule {}
