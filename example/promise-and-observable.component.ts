import { Observable } from 'rxjs';
import { switchMapTo } from 'rxjs/operators';
import { Service, User } from './service';
export class PromiseAndObservableComponent {
  v$: Observable<User>;
  constructor(private service: Service) {}

  myMethod() {
    this.service.onInit();
    this.v$ = this.service.userName$.pipe(
      switchMapTo(this.service.comments),
      switchMapTo(this.service.getComment('2')),
      switchMapTo(this.service.getUser('1'))
    )
  }

  mySecondMethod() {}
}
