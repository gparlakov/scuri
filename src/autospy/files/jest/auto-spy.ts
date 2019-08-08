/** Keeps the types of properties of a type but assigns type of Spy to the methods */
type SpyOf<T> = Partial<
    { [k in keyof T]: T[k] extends (...args: any[]) => any ? jest.Mock<T[R]> : T[k] }
> &
    T;

/** Create an object with methods that are autoSpy-ed to use as mock dependency */
function autoSpy<T>(obj: new (...args: any[]) => T): SpyOf<T> {
    const res: SpyOf<T> = {} as any;

    Object.keys(obj.prototype).forEach(key => {
        res[key] = jest.fn();
    });

    return res;
}
