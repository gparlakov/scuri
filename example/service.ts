import { Observable } from 'rxjs';

export class Service {
    userName$: Observable<string>;
    comments: Promise<Comment[]>

    onInit() {}

    getComment(id: string): Promise<Comment> {
        throw new Error('not implemented')
    }

    getUser(id: string): Observable<User> {
        throw new Error('not implemented')
    }
}

export type Comment = {
    id: string;
}
export type User = {
    id: string;
    name: string;
}
