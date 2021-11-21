import { Router } from "@the/router";
import { Just } from "maybe";
// tslint:disable-next-line:quotemark
import { Service } from "./service";
export class ExampleComponent {
  constructor(service: Service, router: Router, just: Just) {}

  myMethod() {}
}
