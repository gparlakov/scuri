import { Observable } from 'rxjs';

export class ServiceWithMethods {
    observableReturning(a?: string | undefined): Observable<string | number> {
        return of(a ? a : 1);
    }
}
