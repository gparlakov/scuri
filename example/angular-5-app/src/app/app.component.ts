import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  constructor(dep: string) {}
  title = "app";
  publicMethod() {}

  public explicitPublicMethod() {}

  async asyncPublicMethod() {}

  private privateMethod() {}

  protected protectedMethod() {}
}
